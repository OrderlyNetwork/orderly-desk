export type Network = "testnet" | "mainnet";

export interface MarketRow {
  symbol: string;
  display_symbol_name?: string;
  broker_id?: string | null;
  status?: string;
  index_price?: number;
  mark_price?: number;
  est_funding_rate?: number;
  last_funding_rate?: number;
  next_funding_time?: number;
  open_interest?: number;
  "24h_open"?: number;
  "24h_close"?: number;
  "24h_high"?: number;
  "24h_low"?: number;
  "24h_volume"?: number;
  "24h_amount"?: number;
}

export interface BookLevel {
  price: number;
  quantity: number;
}

export interface Orderbook {
  symbol: string;
  asks: BookLevel[];
  bids: BookLevel[];
  updatedAt: number;
}

export interface Trade {
  id: string;
  symbol: string;
  price: number;
  size: number;
  side: "BUY" | "SELL";
  ts: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Interval = "1m" | "5m" | "15m" | "1h";

export interface TvHistory {
  s: string;
  t?: number[];
  o?: Array<number | string>;
  h?: Array<number | string>;
  l?: Array<number | string>;
  c?: Array<number | string>;
  v?: Array<number | string>;
}

export interface BinaryRound {
  symbol: string;
  product_type: string;
  status: string;
  activated_at?: number;
  observation_start_at?: number;
  expire_at: number;
  index_price_symbol?: string;
  s0?: number | null;
  s1?: number | null;
  outcome?: string | null;
  settlement_price_per_share?: number | null;
}

export interface DeskPosition {
  symbol: string;
  kind?: "PERP" | "BINARY";
  side: "LONG" | "SHORT" | "UP" | "DOWN";
  quantity: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  leverage?: number;
}

export interface DeskOrder {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: string;
  price: number;
  quantity: number;
  filled: number;
  status: string;
  createdAt: number;
}

export interface DeskFill {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
  fee: number;
  ts: number;
}

export interface DeskSnapshot {
  capturedAt: string;
  account: string;
  network: string;
  balance: number;
  equity: number;
  freeCollateral: number | null;
  unrealizedPnl: number | null;
  positions: DeskPosition[];
  orders: DeskOrder[];
  fills: DeskFill[];
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}

export interface MarketsPayload {
  rows: MarketRow[];
}

export interface TradesPayload {
  rows: Array<{
    symbol: string;
    side: "BUY" | "SELL";
    executed_price: number;
    executed_quantity: number;
    executed_timestamp: number;
  }>;
}

export interface BinaryPayload {
  rows: BinaryRound[];
}
