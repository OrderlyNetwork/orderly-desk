#!/usr/bin/env node
/**
 * Refresh src/data/versions.json from the actual public release sources.
 *
 * Sources:
 *   CLI          GitHub latest release (the Rust CLI is released on GitHub)
 *   trading-mcp  npm registry dist-tag "latest"
 *   registry     official MCP registry entry (may lag npm)
 *   verified     the CLI version used for the captured walkthrough outputs
 *
 * Network failures keep the previous committed value: a Cloudflare build must
 * never fail because GitHub or npm is having a bad day.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const versionsFile = path.join(root, "src/data/versions.json");
const commandsFile = path.join(root, "src/data/commands.json");
const packageFile = path.join(root, "package.json");

const previous = existsSync(versionsFile)
  ? JSON.parse(readFileSync(versionsFile, "utf8"))
  : {};
const commands = JSON.parse(readFileSync(commandsFile, "utf8"));
const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

const [github, npm, registry] = await Promise.allSettled([
  fetchJson("https://api.github.com/repos/OrderlyNetwork/cli/releases/latest", {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "orderly-desk-version-sync",
    },
  }),
  fetchJson("https://registry.npmjs.org/@orderly.network%2Ftrading-mcp/latest"),
  fetchJson(
    "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.OrderlyNetwork/trading-mcp",
  ),
]);

const cliFallback = previous.cli ?? {
  version: commands.version,
  tag: `v${commands.version}`,
  publishedAt: null,
  url: `https://github.com/OrderlyNetwork/cli/releases/tag/v${commands.version}`,
};

const cli =
  github.status === "fulfilled"
    ? {
        version: String(github.value.tag_name ?? "").replace(/^v/, ""),
        tag: github.value.tag_name,
        publishedAt: github.value.published_at ?? null,
        url: github.value.html_url,
      }
    : cliFallback;

const mcpFallback = previous.tradingMcp ?? {
  version: "0.0.0",
  package: "@orderly.network/trading-mcp",
  command: "orderly-trading-mcp",
  url: "https://www.npmjs.com/package/@orderly.network/trading-mcp",
};

const tradingMcp =
  npm.status === "fulfilled"
    ? {
        ...mcpFallback,
        version: npm.value.version,
        url: `https://www.npmjs.com/package/@orderly.network/trading-mcp`,
      }
    : mcpFallback;

const registryServer =
  registry.status === "fulfilled" ? registry.value?.servers?.[0]?.server : null;
const registryMeta =
  registry.status === "fulfilled"
    ? registry.value?.servers?.[0]?._meta?.["io.modelcontextprotocol.registry/official"]
    : null;

const mcpRegistry = registryServer
  ? {
      name: registryServer.name,
      version: registryServer.version,
      status: registryMeta?.status ?? "unknown",
      url: "https://registry.modelcontextprotocol.io/",
    }
  : previous.mcpRegistry ?? {
      name: "io.github.OrderlyNetwork/trading-mcp",
      version: null,
      status: "unknown",
      url: "https://registry.modelcontextprotocol.io/",
    };

const output = {
  checkedAt: new Date().toISOString(),
  showcase: packageJson.version,
  cli: {
    ...cli,
    verifiedWith: commands.version,
  },
  tradingMcp,
  mcpRegistry,
};

writeFileSync(versionsFile, `${JSON.stringify(output, null, 2)}\n`);
console.log(
  `versions · cli ${output.cli.version} (verified ${output.cli.verifiedWith}) · ` +
    `trading-mcp ${output.tradingMcp.version} · registry ${output.mcpRegistry.version ?? "unknown"}`,
);
