#!/usr/bin/env node
/**
 * Stateless signal helper for any agent that can run a shell command.
 *
 * It uses the `orderly` CLI for every read:
 *   orderly kline
 *   orderly market-price
 *   orderly positions-list
 *
 * It never places, edits, or closes an order.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateStrategy } from "../../../../packages/strategies/dist/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const candidates = [
  process.env.ORDERLY_BIN,
  path.resolve(here, "../../../../../cli/target/release/orderly"),
  "orderly",
].filter(Boolean);
const BIN =
  candidates.find((candidate) => candidate === "orderly" || existsSync(candidate)) ??
  "orderly";

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function flag(name) {
  return process.argv.includes(`--${name}`);
}

function run(args) {
  const stdout = execFileSync(BIN, args, {
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: 4_000_000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const text = stdout.trim();
  if (!text) throw new Error(`orderly ${args[0]} returned no output`);
  return JSON.parse(text);
}

const strategy = arg("strategy", "momentum");
const symbol = arg("symbol", "PERP_BTC_USDC").toUpperCase();
const network = arg("network", "testnet");
const interval = arg("interval", "5m");
const size = Number(arg("size", "200"));
const account = arg("account", "");

const publicBase = ["--network", network];
const authBase = account ? [...publicBase, "--account", account] : publicBase;

const kline = run(["kline", symbol, interval, "--size", String(size), ...publicBase]);
const market = run(["market-price", symbol, ...publicBase]);
const positions = run(["positions-list", "--product-type", "PERP", ...authBase]);

const candles = (kline.rows ?? []).map((row) => ({
  time: Number(row.start_timestamp ?? 0) / 1000,
  open: Number(row.open),
  high: Number(row.high),
  low: Number(row.low),
  close: Number(row.close),
  volume: Number(row.volume ?? 0),
}));

const position =
  (positions.rows ?? []).find((row) => row.symbol === symbol) ?? null;
const signal = evaluateStrategy({
  strategy,
  candles,
  market,
  position,
});

const mark = Number(market.mark_price ?? candles.at(-1)?.close ?? 0);
const quantity = Math.max(
  0.001,
  Math.floor(200 / (mark || 1) / 0.001) * 0.001,
);
const accountFlag = account ? ` --account ${account}` : "";
const commands =
  signal.action === "open"
    ? {
        leverage: `orderly leverage ${symbol} 3${accountFlag} --network ${network}`,
        order: `orderly order-place ${symbol} ${signal.side} MARKET ${quantity}${accountFlag} --network ${network}`,
      }
    : signal.action === "close"
      ? {
          close: `orderly positions-close ${symbol}${accountFlag} --network ${network}`,
        }
      : {};

const output = {
  strategy,
  symbol,
  network,
  generatedAt: new Date().toISOString(),
  signal,
  mark,
  quantity,
  position: position
    ? {
        side: Number(position.position_qty) > 0 ? "LONG" : "SHORT",
        quantity: Math.abs(Number(position.position_qty)),
        entryPrice: Number(position.average_open_price),
      }
    : null,
  commands,
  note: "Signal only. Confirm with the user, then run the CLI command explicitly.",
};

console.log(JSON.stringify(output, null, flag("pretty") ? 2 : 0));
