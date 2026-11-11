export interface AgentPosition {
  side: "LONG" | "SHORT";
  quantity: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  leverage: number;
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
  allocation: number;
  sleeveEquity: number | null;
  reserve: number | null;
  pnl: number | null;
  brokerId?: string;
  userId?: number | null;
  dashboardUrl: string | null;
  position: AgentPosition | null;
  lastRunAt: number | null;
  lastAction: string | null;
  lastReason: string | null;
  lastOrderId: string | null;
  nextRunAt: number | null;
  error?: string;
}

export interface Decision {
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

export interface AgentHealth {
  ok: boolean;
  network: string;
  accounts: number;
  hasAI: boolean;
  aiModel?: string;
  signing?: string;
  tradingEnabled: boolean;
  time: string;
}

export interface DailyRecap {
  day: string;
  createdAt: number;
  text: string;
  source: "workers-ai" | "rules";
  model: string;
}
