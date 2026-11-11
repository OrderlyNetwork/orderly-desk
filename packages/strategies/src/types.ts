export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketRow {
  symbol: string;
  mark_price?: number;
  "24h_open"?: number;
}

export interface PositionRow {
  symbol: string;
  position_qty: number;
  average_open_price: number;
  mark_price?: number;
  unsettled_pnl?: number;
  leverage?: number;
  margin_mode?: string;
}

export type Bias = "long" | "short" | "flat";
export type Action = "open" | "close" | "hold";

export interface StrategyResult {
  action: Action;
  side?: "BUY" | "SELL";
  bias: Bias;
  reason: string;
  indicators: Record<string, number | null>;
}

export interface StrategyContext {
  strategy: string;
  candles: Candle[];
  market: MarketRow;
  position: PositionRow | null;
}
