#!/usr/bin/env node
/**
 * Copy the built WASM SDK from the sibling CLI checkout into vendor/orderly.
 *
 * The showcase is a standalone repository, so it commits the generated SDK
 * artifacts. Regenerate them with:
 *
 *   cd ../cli && pnpm build
 *   cd ../showcase && node scripts/sync-orderly-sdk.mjs
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const source = process.env.ORDERLY_SDK_DIR
  ? path.resolve(process.env.ORDERLY_SDK_DIR)
  : path.resolve(root, "../cli");
const target = path.resolve(root, "vendor/orderly");
const sourcePackage = JSON.parse(
  readFileSync(path.join(source, "package.json"), "utf8"),
);

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(path.join(source, "dist"), path.join(target, "dist"), {
  recursive: true,
});
cpSync(path.join(source, "wasm"), path.join(target, "wasm"), {
  recursive: true,
});

writeFileSync(
  path.join(target, "package.json"),
  `${JSON.stringify(
    {
      name: "@orderly.network/orderly",
      version: sourcePackage.version,
      description: sourcePackage.description,
      type: "module",
      main: "./dist/index.js",
      types: "./dist/index.d.ts",
      exports: {
        ".": {
          types: "./dist/index.d.ts",
          import: "./dist/index.js",
        },
      },
      files: ["dist", "wasm"],
      engines: { node: ">=18" },
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  path.join(target, "README.md"),
  `# @orderly.network/orderly (vendored)

Generated from [OrderlyNetwork/cli](https://github.com/OrderlyNetwork/cli).
The published package is the repository root. Do not edit by hand.

The WebAssembly core is the CLI's Rust signing and request layer, compiled with
\`wasm-bindgen\`. The transport is host \`fetch\`; the signer interface keeps key
material outside the SDK.

Regenerate:

\`\`\`bash
cd ../cli
pnpm build
cd ../showcase
node scripts/sync-orderly-sdk.mjs
\`\`\`
`,
);
