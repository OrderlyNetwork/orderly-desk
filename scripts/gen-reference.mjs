#!/usr/bin/env node
/**
 * Regenerate src/data/commands.json from `orderly schema`.
 *
 * The generated file is committed so a Cloudflare Pages build never needs the
 * Rust binary. Run this whenever the CLI command surface changes.
 */
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outFile = path.join(root, "src/data/commands.json");

const candidates = [
  process.env.ORDERLY_BIN,
  path.resolve(root, "../cli/target/release/orderly"),
  path.resolve(root, "../cli/target/debug/orderly"),
  "orderly",
].filter(Boolean);

const bin = candidates.find((candidate) => candidate === "orderly" || existsSync(candidate));
if (!bin) {
  console.error("Could not find the orderly CLI. Set ORDERLY_BIN to its path.");
  process.exit(1);
}

const raw = execFileSync(bin, ["schema"], {
  encoding: "utf8",
  maxBuffer: 8_000_000,
});

const schema = JSON.parse(raw);
if (!Array.isArray(schema.commands)) {
  console.error("Unexpected schema shape: missing commands[]");
  process.exit(1);
}

writeFileSync(outFile, `${JSON.stringify(schema, null, 2)}\n`);
console.log(
  `wrote ${path.relative(root, outFile)} · ${schema.commands.length} commands · orderly ${schema.version}`,
);
