import {
  MemorySigner,
  OrderlyApiError,
  OrderlyClient,
  type Resolution,
} from "@orderly.network/orderly";
import type {
  AgentAccount,
  Candle,
  Env,
  HoldingRow,
  MarketRow,
  PositionRow,
  PositionsPayload,
} from "./types";

/** Backwards-compatible name used by the agent runner. */
export { OrderlyApiError as OrderlyError };

const RESOLUTIONS: Record<string, Resolution> = {
  "1": "1m",
  "5": "5m",
  "15": "15m",
  "60": "1h",
};

let publicClient: { key: string; client: OrderlyClient } | null = null;
const accountClients = new Map<string, OrderlyClient>();

function network(env: Env): "mainnet" | "testnet" {
  return env.ORDERLY_NETWORK === "mainnet" ? "mainnet" : "testnet";
}

function publicClientFor(env: Env): OrderlyClient {
  const key = `${network(env)}|${env.ORDERLY_API_BASE}`;
  if (!publicClient || publicClient.key !== key) {
    publicClient = {
      key,
      client: new OrderlyClient({
        network: network(env),
        baseUrl: env.ORDERLY_API_BASE,
      }),
    };
  }
  return publicClient.client;
}

function accountClient(env: Env, account: AgentAccount): OrderlyClient {
  const key = `${network(env)}|${env.ORDERLY_API_BASE}|${account.id}|${account.accountId}`;
  let client = accountClients.get(key);
  if (!client) {
    client = new OrderlyClient({
      network: network(env),
      baseUrl: env.ORDERLY_API_BASE,
      signer: new MemorySigner({
        accountId: account.accountId,
        privateKey: account.apiSecretBase64,
      }),
    });
    accountClients.set(key, client);
  }
  return client;
}

export async function fetchMarket(env: Env, symbol: string): Promise<MarketRow> {
  const rows = (await publicClientFor(env).market()) as unknown as MarketRow[];
  const row = rows.find((market) => market.symbol === symbol);
  if (!row) throw new Error(`market ${symbol} not found`);
  return row;
}

export async function fetchCandles(
  env: Env,
  symbol: string,
  resolution: string,
  count: number,
): Promise<Candle[]> {
  return publicClientFor(env).klines(
    symbol,
    RESOLUTIONS[resolution] ?? "5m",
    count,
  );
}

export async function fetchHolding(
  env: Env,
  account: AgentAccount,
): Promise<HoldingRow[]> {
  return (await accountClient(env, account).balance()) as unknown as HoldingRow[];
}

export async function fetchPositions(
  env: Env,
  account: AgentAccount,
): Promise<PositionsPayload> {
  return (await accountClient(env, account).positionsPayload(
    "PERP",
  )) as unknown as PositionsPayload;
}

export async function fetchOrders(
  env: Env,
  account: AgentAccount,
): Promise<Array<Record<string, unknown>>> {
  return accountClient(env, account).orders({ status: "INCOMPLETE" });
}

export async function fetchTrades(
  env: Env,
  account: AgentAccount,
  limit = 10,
): Promise<Array<Record<string, unknown>>> {
  return accountClient(env, account).trades({ size: limit });
}

export async function setLeverage(
  env: Env,
  account: AgentAccount,
  symbol: string,
  leverage: number,
): Promise<Record<string, unknown>> {
  return accountClient(env, account).setLeverage(symbol, leverage);
}

export async function placeOrder(
  env: Env,
  account: AgentAccount,
  order: {
    symbol: string;
    side: "BUY" | "SELL";
    orderType: "MARKET" | "LIMIT";
    quantity: number;
    price?: number;
    reduceOnly?: boolean;
    clientOrderId?: string;
  },
): Promise<Record<string, unknown>> {
  return accountClient(env, account).placeOrder(order);
}

export async function closePosition(
  env: Env,
  account: AgentAccount,
  symbol: string,
): Promise<{
  quantity: number;
  side: "BUY" | "SELL";
  response: Record<string, unknown>;
} | null> {
  const positions = await fetchPositions(env, account);
  const position = positions.rows?.find((row) => row.symbol === symbol);
  if (!position || Number(position.position_qty) === 0) return null;

  const quantity = Math.abs(Number(position.position_qty));
  const side: "BUY" | "SELL" = Number(position.position_qty) > 0 ? "SELL" : "BUY";
  const response = await placeOrder(env, account, {
    symbol,
    side,
    orderType: "MARKET",
    quantity,
    reduceOnly: true,
  });
  return { quantity, side, response };
}

export function findPosition(
  positions: PositionsPayload,
  symbol: string,
): PositionRow | null {
  const row = positions.rows?.find((entry) => entry.symbol === symbol);
  if (!row || Number(row.position_qty) === 0) return null;
  return row;
}
