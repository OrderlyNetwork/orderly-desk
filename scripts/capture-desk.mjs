#!/usr/bin/env node
/**
 * Capture the local bridge's desk payload into src/data/desk-snapshot.json.
 *
 * The snapshot is what the static site shows when the bridge is not running.
 * It contains public testnet account data only; no keys are ever returned by
 * the bridge.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outFile = path.join(root, "src/data/desk-snapshot.json");
const bridge = process.env.BRIDGE_URL ?? "http://127.0.0.1:8791";

const response = await fetch(`${bridge}/api/desk?fresh=1`);
if (!response.ok) {
  console.error(`Bridge returned ${response.status} ${response.statusText}`);
  process.exit(1);
}

const snapshot = await response.json();
if (!snapshot || typeof snapshot !== "object" || !("positions" in snapshot)) {
  console.error("Unexpected desk payload; refusing to write the snapshot.");
  process.exit(1);
}

writeFileSync(outFile, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(
  `wrote ${path.relative(root, outFile)} · ${snapshot.positions.length} positions · ${snapshot.orders.length} orders · ${snapshot.fills.length} fills`,
);
