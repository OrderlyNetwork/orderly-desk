export interface Env {
  DB: D1Database;
  AI?: {
    run: (model: string, input: unknown) => Promise<unknown>;
  };
  ORDERLY_NETWORK: string;
  ORDERLY_API_BASE: string;
  SITE_ORIGIN?: string;
  AGENTS_ENABLED?: string;
  AGENTS_CONFIG_B64?: string;
  AGENTS_CONFIG?: string;
}

export interface AgentAccount {
  id: string;
  name: string;
  strategy: string;
  symbol: string;
  description: string;
  address?: string;
  accountId: string;
  publicKey: string;
  apiSecretBase64: string;
}

export interface AgentsConfig {
  broker: string;
  chainId: number;
  accounts: AgentAccount[];
}

export interface MarketRow {
  symbol: string;
  mark_price?: number;
  index_price?: number;
  "24h_open"?: number;
  "24h_high"?: number;
  "24h_low"?: number;
  "24h_volume"?: number;
  "24h_amount"?: number;
  est_funding_rate?: number;
  open_interest?: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PositionRow {
  symbol: string;
  position_qty: number;
  average_open_price: number;
  mark_price: number;
  unsettled_pnl: number;
  leverage: number;
  margin_mode: string;
}

export interface PositionsPayload {
  account_value?: number;
  total_collateral_value?: number;
  free_collateral?: number;
  rows?: PositionRow[];
  total_pnl_24_h?: number;
}

export interface HoldingRow {
  token: string;
  holding: number;
  frozen: number;
}

export interface AgentState {
  id: string;
  name: string;
  strategy: string;
  symbol: string;
  description: string;
  accountId: string;
  address?: string;
  enabled: boolean;
  intervalMinutes: number;
  equity: number | null;
  balance: number | null;
  initialEquity: number | null;
  pnl: number | null;
  position: {
    side: "LONG" | "SHORT";
    quantity: number;
    entryPrice: number;
    markPrice: number;
    unrealizedPnl: number;
    leverage: number;
  } | null;
  lastRunAt: number | null;
  lastAction: string | null;
  lastReason: string | null;
  lastOrderId: string | null;
  nextRunAt: number | null;
  error?: string;
}

export interface DecisionRow {
  id: number;
  agent_id: string;
  agent_name?: string;
  created_at: number;
  action: string;
  symbol: string;
  price: number | null;
  quantity: number | null;
  order_id: string | null;
  reason: string | null;
  source: string | null;
  indicators_json: string | null;
}

export interface AgentRow {
  id: string;
  name: string;
  strategy: string;
  symbol: string;
  description: string;
  enabled: number;
  interval_minutes: number;
  initial_equity: number | null;
  last_run_at: number | null;
  locked_until: number | null;
  last_action: string | null;
  last_reason: string | null;
  last_order_id: string | null;
  created_at: number;
}
