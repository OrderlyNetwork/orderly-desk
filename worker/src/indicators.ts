export function ema(values: number[], period: number): number[] {
  if (!values.length) return [];
  const k = 2 / (period + 1);
  const output = [values[0]];
  for (let index = 1; index < values.length; index += 1) {
    output.push(values[index] * k + output[index - 1] * (1 - k));
  }
  return output;
}

export function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / period;
}

export function rsi(values: number[], period = 14): number | null {
  if (values.length <= period) return null;
  let gain = 0;
  let loss = 0;
  for (let index = 1; index <= period; index += 1) {
    const delta = values[index] - values[index - 1];
    if (delta >= 0) gain += delta;
    else loss -= delta;
  }
  let averageGain = gain / period;
  let averageLoss = loss / period;

  for (let index = period + 1; index < values.length; index += 1) {
    const delta = values[index] - values[index - 1];
    const currentGain = Math.max(delta, 0);
    const currentLoss = Math.max(-delta, 0);
    averageGain = (averageGain * (period - 1) + currentGain) / period;
    averageLoss = (averageLoss * (period - 1) + currentLoss) / period;
  }

  if (averageLoss === 0) return 100;
  const rs = averageGain / averageLoss;
  return 100 - 100 / (1 + rs);
}

export function atr(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14,
): number | null {
  if (closes.length <= period) return null;
  const trueRanges: number[] = [];
  for (let index = 1; index < closes.length; index += 1) {
    const range = Math.max(
      highs[index] - lows[index],
      Math.abs(highs[index] - closes[index - 1]),
      Math.abs(lows[index] - closes[index - 1]),
    );
    trueRanges.push(range);
  }
  if (trueRanges.length < period) return null;
  let value = trueRanges.slice(0, period).reduce((sum, range) => sum + range, 0) / period;
  for (let index = period; index < trueRanges.length; index += 1) {
    value = (value * (period - 1) + trueRanges[index]) / period;
  }
  return value;
}

export function bollinger(
  values: number[],
  period = 20,
  mult = 2,
): { middle: number; upper: number; lower: number } | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  const middle = slice.reduce((sum, value) => sum + value, 0) / period;
  const variance =
    slice.reduce((sum, value) => sum + (value - middle) ** 2, 0) / period;
  const deviation = Math.sqrt(variance);
  return {
    middle,
    upper: middle + mult * deviation,
    lower: middle - mult * deviation,
  };
}

export function highest(values: number[], period: number): number | null {
  if (values.length < period) return null;
  return Math.max(...values.slice(-period));
}

export function lowest(values: number[], period: number): number | null {
  if (values.length < period) return null;
  return Math.min(...values.slice(-period));
}

export function last(values: number[]): number | null {
  return values.length ? values[values.length - 1] : null;
}

export function ratio(value: number, base: number): number {
  return base === 0 ? 0 : (value - base) / base;
}
