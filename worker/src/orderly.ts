import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";
import { base58 } from "@scure/base";
import type {
  AgentAccount,
  Candle,
  Env,
  HoldingRow,
  MarketRow,
  PositionRow,
  PositionsPayload,
} from "./types";

ed.hashes.sha512 = sha512;

export class OrderlyError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`Orderly ${status}: ${body.slice(0, 300)}`);
    this.status = status;
    this.body = body;
  }
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function publicKeyBase58(seed: Uint8Array): string {
  return base58.encode(ed.getPublicKey(seed));
}

function signatureHeaders(
  account: AgentAccount,
  method: string,
  path: string,
  body: string,
): Record<string, string> {
  const seed = decodeBase64(account.apiSecretBase64);
  const timestamp = Date.now();
  const message = `${timestamp}${method.toUpperCase()}${path}${body}`;
  const signature = ed.sign(new TextEncoder().encode(message), seed);

  return {
    "content-type": "application/json",
    "orderly-timestamp": String(timestamp),
    "orderly-account-id": account.accountId,
    "orderly-key": `ed25519:${publicKeyBase58(seed)}`,
    "orderly-signature": base64Url(signature),
  };
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (record.success === false) {
      throw new OrderlyError(400, JSON.stringify(payload));
    }
    if ("data" in record) return record.data as T;
  }
  return payload as T;
}

async function request<T>(
  env: Env,
  account: AgentAccount | null,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const bodyString = body === undefined ? "" : JSON.stringify(body);
  const headers = account
    ? signatureHeaders(account, method, path, bodyString)
    : { "content-type": "application/json" };

  const response = await fetch(`${env.ORDERLY_API_BASE}${path}`, {
    method,
    headers,
    body: method === "POST" ? bodyString : undefined,
  });

  const text = await response.text();
  if (!response.ok) throw new OrderlyError(response.status, text);

  const payload = text ? JSON.parse(text) : null;
  return unwrap<T>(payload);
}

export async function fetchMarket(env: Env, symbol: string): Promise<MarketRow> {
  const data = await request<{ rows: MarketRow[] }>(env, null, "GET", "/v1/public/futures");
  const row = data.rows.find((market) => market.symbol === symbol);
  if (!row) throw new Error(`market ${symbol} not found`);
  return row;
}

export async function fetchCandles(
  env: Env,
  symbol: string,
  resolution: string,
  count: number,
): Promise<Candle[]> {
  const to = Math.floor(Date.now() / 1000);
  const seconds =
    resolution === "1" ? 60 : resolution === "5" ? 300 : resolution === "15" ? 900 : 3600;
  const from = to - count * seconds;
  const path = `/v1/tv/history?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}`;
  const data = await request<{
    s: string;
    t?: number[];
    o?: Array<number | string>;
    h?: Array<number | string>;
    l?: Array<number | string>;
    c?: Array<number | string>;
    v?: Array<number | string>;
  }>(env, null, "GET", path);

  if (data.s !== "ok" || !data.t?.length) return [];

  return data.t.map((time, index) => ({
    time,
    open: Number(data.o?.[index] ?? 0),
    high: Number(data.h?.[index] ?? 0),
    low: Number(data.l?.[index] ?? 0),
    close: Number(data.c?.[index] ?? 0),
    volume: Number(data.v?.[index] ?? 0),
  }));
}

export async function fetchHolding(env: Env, account: AgentAccount): Promise<HoldingRow[]> {
  const data = await request<{ holding?: HoldingRow[] }>(
    env,
    account,
    "GET",
    "/v1/client/holding",
  );
  return data.holding ?? [];
}

export async function fetchPositions(
  env: Env,
  account: AgentAccount,
): Promise<PositionsPayload> {
  return request<PositionsPayload>(
    env,
    account,
    "GET",
    "/v1/positions?product_type=PERP",
  );
}

export async function fetchOrders(
  env: Env,
  account: AgentAccount,
): Promise<Array<Record<string, unknown>>> {
  const data = await request<{ rows?: Array<Record<string, unknown>> }>(
    env,
    account,
    "GET",
    "/v1/orders?status=INCOMPLETE",
  );
  return data.rows ?? [];
}

export async function fetchTrades(
  env: Env,
  account: AgentAccount,
  limit = 10,
): Promise<Array<Record<string, unknown>>> {
  const data = await request<{ rows?: Array<Record<string, unknown>> }>(
    env,
    account,
    "GET",
    `/v1/trades?size=${limit}`,
  );
  return data.rows ?? [];
}

export async function setLeverage(
  env: Env,
  account: AgentAccount,
  symbol: string,
  leverage: number,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(env, account, "POST", "/v1/client/leverage", {
    symbol,
    leverage,
  });
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
  const body: Record<string, unknown> = {
    symbol: order.symbol,
    order_type: order.orderType,
    side: order.side,
    order_quantity: String(order.quantity),
  };
  if (order.price !== undefined) body.order_price = String(order.price);
  if (order.reduceOnly) body.reduce_only = true;
  if (order.clientOrderId) body.client_order_id = order.clientOrderId;

  return request<Record<string, unknown>>(env, account, "POST", "/v1/order", body);
}

export async function closePosition(
  env: Env,
  account: AgentAccount,
  symbol: string,
): Promise<{ quantity: number; side: "BUY" | "SELL"; response: Record<string, unknown> } | null> {
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
