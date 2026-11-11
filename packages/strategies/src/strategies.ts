import { atr, bollinger, ema, highest, last, lowest, rsi } from "./indicators.js";
import type {
  Bias,
  Candle,
  PositionRow,
  StrategyContext,
  StrategyResult,
} from "./types.js";

function positionBias(position: PositionRow | null): Bias {
  if (!position) return "flat";
  return Number(position.position_qty) > 0 ? "long" : "short";
}

function stopHit(
  position: PositionRow | null,
  mark: number,
  averageTrueRange: number | null,
): boolean {
  if (!position || !averageTrueRange) return false;
  const entry = Number(position.average_open_price);
  const quantity = Number(position.position_qty);
  if (quantity > 0) return mark <= entry - 1.6 * averageTrueRange;
  if (quantity < 0) return mark >= entry + 1.6 * averageTrueRange;
  return false;
}

function closeSide(position: PositionRow | null): "BUY" | "SELL" {
  return Number(position?.position_qty ?? 0) > 0 ? "SELL" : "BUY";
}

function decide(
  context: StrategyContext,
  bias: Bias,
  exit: boolean,
  reason: string,
  indicators: Record<string, number | null>,
): StrategyResult {
  const current = positionBias(context.position);
  const mark = Number(
    context.market.mark_price ??
      last(context.candles.map((candle) => candle.close)) ??
      0,
  );
  const currentAtr = indicators.atr ?? null;

  if (context.position) {
    if (stopHit(context.position, mark, currentAtr)) {
      return {
        action: "close",
        side: closeSide(context.position),
        bias,
        reason: `ATR stop hit at ${mark.toFixed(2)}. ${reason}`,
        indicators,
      };
    }
    if (exit || (bias !== "flat" && bias !== current)) {
      return {
        action: "close",
        side: closeSide(context.position),
        bias,
        reason: `Closing ${current}: ${reason}`,
        indicators,
      };
    }
    return {
      action: "hold",
      bias,
      reason: `Holding ${current}. ${reason}`,
      indicators,
    };
  }

  if (bias === "flat") {
    return { action: "hold", bias, reason, indicators };
  }

  return {
    action: "open",
    side: bias === "long" ? "BUY" : "SELL",
    bias,
    reason,
    indicators,
  };
}

export function evaluateStrategy(context: StrategyContext): StrategyResult {
  const candles =
    context.candles.length > 5 ? context.candles.slice(0, -1) : context.candles;
  if (candles.length < 30) {
    return {
      action: "hold",
      bias: "flat",
      reason: "Not enough closed candles yet.",
      indicators: {},
    };
  }

  const closes = candles.map((candle) => candle.close);
  const highs = candles.map((candle) => candle.high);
  const lows = candles.map((candle) => candle.low);
  const close = last(closes) ?? 0;
  const currentRsi = rsi(closes, 14);
  const currentAtr = atr(highs, lows, closes, 14);

  const common = {
    close: round(close),
    rsi: round(currentRsi),
    atr: round(currentAtr),
  };

  if (context.strategy === "momentum") {
    const fast = last(ema(closes, 9)) ?? close;
    const slow = last(ema(closes, 21)) ?? close;
    const spread = (fast - slow) / close;
    let bias: Bias = "flat";
    if (spread > 0.0004 && (currentRsi ?? 50) < 72) bias = "long";
    if (spread < -0.0004 && (currentRsi ?? 50) > 28) bias = "short";
    const exit =
      (positionBias(context.position) === "long" && fast < slow) ||
      (positionBias(context.position) === "short" && fast > slow);
    return decide(
      context,
      bias,
      exit,
      `EMA9 ${fast.toFixed(2)} vs EMA21 ${slow.toFixed(2)} (${(spread * 100).toFixed(3)}%), RSI ${currentRsi?.toFixed(1) ?? "n/a"}.`,
      { ...common, ema9: round(fast), ema21: round(slow), spread: round(spread) },
    );
  }

  if (context.strategy === "mean-reversion") {
    const bands = bollinger(closes, 20, 2);
    let bias: Bias = "flat";
    let exit = false;
    if (bands) {
      if (close < bands.lower && (currentRsi ?? 50) < 38) bias = "long";
      if (close > bands.upper && (currentRsi ?? 50) > 62) bias = "short";
      exit =
        (positionBias(context.position) === "long" && close >= bands.middle) ||
        (positionBias(context.position) === "short" && close <= bands.middle);
    }
    return decide(
      context,
      bias,
      exit,
      `Close ${close.toFixed(2)} vs bands ${bands ? `${bands.lower.toFixed(2)} / ${bands.upper.toFixed(2)}` : "n/a"}, RSI ${currentRsi?.toFixed(1) ?? "n/a"}.`,
      {
        ...common,
        middle: round(bands?.middle ?? null),
        upper: round(bands?.upper ?? null),
        lower: round(bands?.lower ?? null),
      },
    );
  }

  const priorHigh = highest(highs.slice(0, -1), 20);
  const priorLow = lowest(lows.slice(0, -1), 20);
  const trend = last(ema(closes, 20)) ?? close;
  let bias: Bias = "flat";
  if (priorHigh !== null && close > priorHigh + 0.1 * (currentAtr ?? 0)) bias = "long";
  if (priorLow !== null && close < priorLow - 0.1 * (currentAtr ?? 0)) bias = "short";
  const exit =
    (positionBias(context.position) === "long" && close < trend) ||
    (positionBias(context.position) === "short" && close > trend);
  return decide(
    context,
    bias,
    exit,
    `Close ${close.toFixed(2)} vs 20-bar ${priorLow?.toFixed(2) ?? "n/a"} / ${priorHigh?.toFixed(2) ?? "n/a"}, EMA20 ${trend.toFixed(2)}.`,
    {
      ...common,
      priorHigh: round(priorHigh),
      priorLow: round(priorLow),
      ema20: round(trend),
    },
  );
}

function round(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(Number(value) * 1000) / 1000;
}
