#!/usr/bin/env node
/**
 * Minimal JS/TS agent loop using the CLI's WASM core and the extracted
 * strategies. Read-only by default; set EXECUTE=1 to place the order.
 *
 * Testnet:
 *   ORDERLY_ACCOUNT=0x... ORDERLY_API_SECRET=... node examples/agent-loop.mjs
 *
 * Mainnet requires both EXECUTE=1 and CONFIRM_MAINNET=1.
 */
import { MemorySigner, OrderlyClient } from "@orderly.network/cli-wasm";
import { evaluateStrategy } from "@orderly-desk/strategies";

const network = process.env.ORDERLY_NETWORK === "mainnet" ? "mainnet" : "testnet";
const symbol = (process.env.ORDERLY_SYMBOL ?? "PERP_BTC_USDC").toUpperCase();
const strategy = process.env.ORDERLY_STRATEGY ?? "momentum";
const accountId = process.env.ORDERLY_ACCOUNT;
const privateKey = process.env.ORDERLY_API_SECRET;

if (!accountId || !privateKey) {
  console.error("Set ORDERLY_ACCOUNT and ORDERLY_API_SECRET (testnet key).");
  process.exit(1);
}
if (network === "mainnet" && process.env.CONFIRM_MAINNET !== "1") {
  console.error("Refusing mainnet. Set CONFIRM_MAINNET=1 to continue.");
  process.exit(1);
}

const client = new OrderlyClient({
  network,
  signer: new MemorySigner({ accountId, privateKey }),
});

const [candles, market, positions] = await Promise.all([
  client.klines(symbol, "5m", 200),
  client.marketPrice(symbol),
  client.positions("PERP"),
]);

const position =
  positions.find(
    (row) => row.symbol === symbol && Number(row.position_qty) !== 0,
  ) ?? null;
const signal = evaluateStrategy({ strategy, candles, market, position });
console.log(JSON.stringify({ network, symbol, strategy, signal, position }, null, 2));

if (process.env.EXECUTE !== "1" || signal.action === "hold") process.exit(0);

if (signal.action === "open") {
  if (position) {
    console.error("Refusing a second position in the same symbol.");
    process.exit(1);
  }
  const mark = Number(market.mark_price ?? candles.at(-1)?.close ?? 0);
  const quantity = Math.max(0.001, Math.floor(200 / mark / 0.001) * 0.001);
  await client.setLeverage(symbol, 3);
  const order = await client.placeOrder({
    symbol,
    side: signal.side,
    orderType: "MARKET",
    quantity,
  });
  console.log(JSON.stringify({ executed: "open", quantity, order }, null, 2));
} else if (signal.action === "close") {
  const order = await client.closePosition(symbol);
  console.log(JSON.stringify({ executed: "close", order }, null, 2));
}
