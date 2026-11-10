import { INTERVAL_SECONDS, NETWORKS, TV_RESOLUTION } from "./network";
import type {
  ApiEnvelope,
  BinaryPayload,
  BinaryRound,
  Candle,
  DeskSnapshot,
  Interval,
  MarketRow,
  MarketsPayload,
  Network,
  Trade,
  TradesPayload,
  TvHistory,
} from "./types";

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const clean = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
    throw new Error(`${response.status} ${response.statusText}${clean ? ` · ${clean}` : ""}`);
  }

  return (await response.json()) as T;
}

export function apiUrl(network: Network, path: string): string {
  return `${NETWORKS[network].api}${path}`;
}

export async function fetchMarkets(network: Network, signal?: AbortSignal): Promise<MarketRow[]> {
  const payload = await getJson<ApiEnvelope<MarketsPayload>>(
    apiUrl(network, "/v1/public/futures"),
    signal,
  );
  if (!payload.success) throw new Error(payload.message ?? "Could not load markets");
  return payload.data.rows;
}

export async function fetchCandles(
  network: Network,
  symbol: string,
  interval: Interval,
  count = 220,
  signal?: AbortSignal,
): Promise<Candle[]> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - count * INTERVAL_SECONDS[interval];
  const resolution = TV_RESOLUTION[interval];
  const payload = await getJson<TvHistory>(
    apiUrl(
      network,
      `/v1/tv/history?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}`,
    ),
    signal,
  );

  if (payload.s !== "ok" || !payload.t?.length) return [];

  return payload.t.map((time, index) => ({
    time,
    open: Number(payload.o?.[index] ?? 0),
    high: Number(payload.h?.[index] ?? 0),
    low: Number(payload.l?.[index] ?? 0),
    close: Number(payload.c?.[index] ?? 0),
    volume: Number(payload.v?.[index] ?? 0),
  }));
}

export async function fetchMarketTrades(
  network: Network,
  symbol: string,
  limit = 50,
  signal?: AbortSignal,
): Promise<Trade[]> {
  const payload = await getJson<ApiEnvelope<TradesPayload>>(
    apiUrl(
      network,
      `/v1/public/market_trades?symbol=${encodeURIComponent(symbol)}&limit=${limit}`,
    ),
    signal,
  );
  if (!payload.success) throw new Error(payload.message ?? "Could not load trades");

  return payload.data.rows.map((row) => ({
    id: `${row.executed_timestamp}-${row.executed_price}-${row.executed_quantity}-${row.side}`,
    symbol: row.symbol,
    price: Number(row.executed_price),
    size: Number(row.executed_quantity),
    side: row.side,
    ts: Number(row.executed_timestamp),
  }));
}

export async function fetchBinaryRounds(
  network: Network,
  signal?: AbortSignal,
): Promise<BinaryRound[]> {
  const payload = await getJson<ApiEnvelope<BinaryPayload>>(
    apiUrl(network, "/v1/public/binary/info"),
    signal,
  );
  if (!payload.success) throw new Error(payload.message ?? "Could not load Predict rounds");
  return payload.data.rows;
}

export async function fetchDesk(signal?: AbortSignal): Promise<DeskSnapshot> {
  return getJson<DeskSnapshot>("/api/desk", signal);
}

export async function bridgeAvailable(signal?: AbortSignal): Promise<boolean> {
  // The bridge is a local-only companion. Never probe it from a deployed site:
  // static hosts would answer /api/health with the SPA fallback.
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(host)) return false;

  try {
    const response = await fetch("/api/health", { signal });
    if (!response.ok) return false;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return false;
    const payload = (await response.json()) as { ok?: boolean };
    return payload.ok === true;
  } catch {
    return false;
  }
}
