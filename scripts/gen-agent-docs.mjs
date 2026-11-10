#!/usr/bin/env node
/**
 * Generate the agent-facing markdown files in public/.
 *
 * Sources:
 *   src/content/agent-walkthrough.md
 *   src/content/agent-mcp.md
 *   src/data/commands.json
 *   src/data/versions.json
 *
 * Set SITE_URL (for example https://desk.example.com) to emit absolute links in
 * llms.txt. Without it the links are relative, which still works for a client
 * that fetched the file from the same origin.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const publicDir = path.join(root, "public");

const versions = JSON.parse(readFileSync(path.join(root, "src/data/versions.json"), "utf8"));
const schema = JSON.parse(readFileSync(path.join(root, "src/data/commands.json"), "utf8"));
const siteUrl = (process.env.SITE_URL ?? "").replace(/\/$/, "");

const values = {
  "{{CLI_VERSION}}": versions.cli.version,
  "{{CLI_TAG}}": versions.cli.tag,
  "{{CLI_URL}}": versions.cli.url,
  "{{VERIFIED_WITH}}": versions.cli.verifiedWith,
  "{{MCP_VERSION}}": versions.tradingMcp.version,
  "{{MCP_PACKAGE}}": versions.tradingMcp.package,
  "{{MCP_COMMAND}}": versions.tradingMcp.command,
  "{{MCP_URL}}": versions.tradingMcp.url,
  "{{MCP_REGISTRY_NAME}}": versions.mcpRegistry.name,
  "{{MCP_REGISTRY_VERSION}}": versions.mcpRegistry.version ?? "unknown",
  "{{MCP_REGISTRY_URL}}": versions.mcpRegistry.url,
  "{{CHECKED_AT}}": versions.checkedAt.slice(0, 10),
  "{{SHOWCASE_VERSION}}": versions.showcase,
};

function fill(template) {
  return Object.entries(values).reduce(
    (output, [placeholder, value]) => output.replaceAll(placeholder, String(value)),
    template,
  );
}

function commandUsage(command) {
  const positional = [];
  const flags = [];

  for (const arg of command.args) {
    if (!arg.long) {
      const name = arg.valueName || arg.name;
      positional.push(arg.required ? `<${name}>` : `[${name}]`);
      continue;
    }
    const value = arg.takesValue ? ` <${arg.valueName || arg.name}>` : "";
    flags.push(arg.required ? `--${arg.long}${value}` : `[--${arg.long}${value}]`);
  }

  return [`orderly ${command.path}`, ...positional, ...flags].join(" ").replace(/\s+/g, " ");
}

function referenceMarkdown() {
  const lines = [
    "# Orderly CLI reference",
    "",
    `Generated from \`orderly schema\` v${schema.version}. ${schema.description}.`,
    "",
    "This file is generated from `src/data/commands.json`; do not edit it by hand.",
    "",
    "## Global flags",
    "",
  ];

  for (const arg of schema.globalArgs ?? []) {
    const flag = arg.long ? `--${arg.long}` : arg.name;
    const value = arg.takesValue ? ` <${arg.valueName || arg.name}>` : "";
    lines.push(`- \`${flag}${value}\` — ${arg.help ?? ""}`);
  }

  lines.push("", "## Commands", "");

  for (const command of [...schema.commands].sort((a, b) => a.path.localeCompare(b.path))) {
    lines.push(`### \`${command.path}\``, "");
    if (command.about) lines.push(command.about, "");
    lines.push(`- **Usage:** \`${commandUsage(command)}\``);
    lines.push(`- **Mutates:** ${command.mutates ? "yes" : "no"}`);

    if (command.args.length) {
      lines.push("", "**Flags:**", "");
      for (const arg of command.args) {
        const flag = arg.long
          ? `--${arg.long}${arg.takesValue ? ` <${arg.valueName || arg.name}>` : ""}`
          : arg.name.replace(/_$/, "");
        const required = arg.required ? " (required)" : "";
        lines.push(`- \`${flag}\`${required}${arg.help ? ` — ${arg.help}` : ""}`);
      }
    }

    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function llmsTxt() {
  const link = (suffix) => `${siteUrl}${suffix}`;
  const lines = [
    "# The Orderly Desk",
    "",
    "> An agentic trading showcase on Orderly testnet: three autonomous BTC perp agents, a read-only dashboard, and the CLI as the control plane.",
    "",
    "## Start here",
    "",
    `- [Agent walkthrough](${link("/walkthrough.md")}): the manual CLI path, commands, guardrails, Predict, MCP alternative.`,
    `- [Trading MCP guide](${link("/mcp.md")}): the local stdio path for AI clients.`,
    `- [CLI reference](${link("/reference.md")}): all ${schema.commands.length} commands generated from \`orderly schema\`.`,
    `- [Version data](${link("/versions.json")}): current CLI, npm MCP, and registry versions.`,
    "",
    "## Showcase",
    "",
    `- [Agent desk](${link("/dashboard")}): live testnet fleet, decisions, and mainnet reference market data. Read-only.`,
    `- [Human walkthrough](${link("/walkthrough")}): long-form version with captured terminal output.`,
    `- [Command reference page](${link("/reference")}): searchable HTML version.`,
    "",
    "## Guardrails",
    "",
    "- This demo trades testnet. The CLI itself supports mainnet and testnet.",
    "- The dashboard is read-only. It never signs or submits orders.",
    "- Hosted agent keys live in Worker secrets; the browser never receives them.",
    "- Local CLI keys live in the OS keychain.",
    "- Preview mutations with `--dry-run` first.",
    "",
    "## Versions",
    "",
    `- orderly: ${versions.cli.version} (walkthrough verified with ${versions.cli.verifiedWith})`,
    `- trading-mcp: ${versions.tradingMcp.version}`,
    `- MCP registry: ${versions.mcpRegistry.version ?? "unknown"} (${versions.mcpRegistry.status})`,
    `- checked: ${values["{{CHECKED_AT}}"]}`,
    "",
  ];
  return lines.join("\n");
}

const walkthroughTemplate = readFileSync(
  path.join(root, "src/content/agent-walkthrough.md"),
  "utf8",
);
const mcpTemplate = readFileSync(path.join(root, "src/content/agent-mcp.md"), "utf8");

const files = {
  "walkthrough.md": `${fill(walkthroughTemplate).trimEnd()}\n`,
  "mcp.md": `${fill(mcpTemplate).trimEnd()}\n`,
  "reference.md": referenceMarkdown(),
  "llms.txt": llmsTxt(),
  "versions.json": `${JSON.stringify(versions, null, 2)}\n`,
};

for (const [name, content] of Object.entries(files)) {
  writeFileSync(path.join(publicDir, name), content);
}

console.log(
  `agent docs · ${Object.entries(files)
    .map(([name, content]) => `${name} ${(content.length / 1024).toFixed(1)}kB`)
    .join(" · ")}`,
);
