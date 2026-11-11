import assert from "node:assert/strict";
import test from "node:test";
import { evaluateStrategy } from "../dist/index.js";

function candles(closes) {
  return closes.map((close, index) => {
    const previous = index ? closes[index - 1] : close;
    return {
      time: index,
      open: previous,
      high: Math.max(previous, close) + 0.4,
      low: Math.min(previous, close) - 0.4,
      close,
      volume: 0.01,
    };
  });
}

function context(strategy, closes, position = null, mark = closes.at(-1)) {
  return {
    strategy,
    candles: candles(closes),
    market: { symbol: "PERP_BTC_USDC", mark_price: mark },
    position,
  };
}

test("holds until there are enough closed candles", () => {
  const result = evaluateStrategy(context("momentum", Array(10).fill(100)));
  assert.equal(result.action, "hold");
  assert.equal(result.reason, "Not enough closed candles yet.");
});

test("momentum opens long on a rising EMA spread", () => {
  const closes = Array.from(
    { length: 60 },
    (_, index) => 100 + index * 0.05 + Math.sin(index / 1.5) * 1.5,
  );
  closes.push(closes.at(-1));
  const result = evaluateStrategy(context("momentum", closes));
  assert.equal(result.action, "open");
  assert.equal(result.side, "BUY");
  assert.ok(Number(result.indicators.ema9) > Number(result.indicators.ema21));
});

test("mean reversion buys a close below the lower band", () => {
  const closes = [
    ...Array.from({ length: 39 }, (_, index) => 100 + Math.sin(index / 3) * 0.3),
    98.5,
    97.2,
    95.8,
  ];
  const result = evaluateStrategy(context("mean-reversion", closes));
  assert.equal(result.action, "open");
  assert.equal(result.side, "BUY");
  assert.ok(Number(result.indicators.lower) > 95.8);
});

test("breakout buys above the prior 20-bar high", () => {
  const closes = [
    ...Array.from({ length: 39 }, (_, index) => 100 + Math.sin(index / 2) * 0.3),
    105,
    105,
  ];
  const result = evaluateStrategy(context("breakout", closes));
  assert.equal(result.action, "open");
  assert.equal(result.side, "BUY");
  assert.ok(Number(result.indicators.priorHigh) < 105);
});

test("ATR stop closes an existing long", () => {
  const closes = Array.from({ length: 40 }, (_, index) => 100 + Math.sin(index / 2) * 0.2);
  const result = evaluateStrategy(
    context(
      "momentum",
      closes,
      {
        symbol: "PERP_BTC_USDC",
        position_qty: 1,
        average_open_price: 100,
      },
      50,
    ),
  );
  assert.equal(result.action, "close");
  assert.equal(result.side, "SELL");
  assert.match(result.reason, /ATR stop hit/);
});
