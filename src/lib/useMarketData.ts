import { useEffect, useRef, useState } from "react";
import { fetchBinaryRounds, fetchCandles, fetchDesk, fetchMarketTrades, fetchMarkets } from "./api";
import { PREFERRED_MARKETS } from "./network";
import { useOrderlyTopic, type SocketStatus } from "./useOrderlyTopic";
import { usePoll } from "./usePoll";
import type {
  BinaryRound,
  BookLevel,
  Candle,
  DeskSnapshot,
  Interval,
  MarketRow,
  Network,
  Orderbook,
  Trade,
} from "./types";

export function useMarkets(network: Network) {
  const poll = usePoll(
    `markets:${network}`,
    (signal) => fetchMarkets(network, signal),
    5_000,
  );

  const markets = (poll.data ?? []).filter(
    (market) => market.status === "ACTIVE" && !market.broker_id,
  );

  const preferred = PREFERRED_MARKETS.filter((symbol) =>
    markets.some((market) => market.symbol === symbol),
  );

  const byVolume = [...markets].sort(
    (a, b) => Number(b["24h_volume"] ?? 0) - Number(a["24h_volume"] ?? 0),
  );

  const options = [
    ...preferred.map((symbol) => markets.find((market) => market.symbol === symbol)!),
    ...byVolume.filter((market) => !preferred.includes(market.symbol)).slice(0, 8),
  ];

  return { ...poll, markets, options };
}

export function useCandles(network: Network, symbol: string, interval: Interval) {
  return usePoll(
    `candles:${network}:${symbol}:${interval}`,
    (signal) => fetchCandles(network, symbol, interval, 220, signal),
    15_000,
  );
}

function parseLevels(value: unknown): BookLevel[] {
  if (!Array.isArray(value)) return [];
  const levels: BookLevel[] = [];
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const price = Number(entry[0]);
    const quantity = Number(entry[1]);
    if (Number.isFinite(price) && Number.isFinite(quantity)) {
      levels.push({ price, quantity });
    }
  }
  return levels;
}

interface WireBook {
  symbol?: string;
  asks?: unknown;
  bids?: unknown;
}

export function useOrderbook(network: Network, symbol: string): {
  book: Orderbook | null;
  status: SocketStatus;
} {
  const [book, setBook] = useState<Orderbook | null>(null);
  const pending = useRef<Orderbook | null>(null);
  const frame = useRef<number | null>(null);

  const status = useOrderlyTopic(
    network,
    symbol ? `${symbol}@orderbook` : null,
    (data, ts) => {
      const wire = data as WireBook;
      const asks = parseLevels(wire.asks).sort((a, b) => a.price - b.price);
      const bids = parseLevels(wire.bids).sort((a, b) => b.price - a.price);
      if (!asks.length && !bids.length) return;
      pending.current = {
        symbol: wire.symbol ?? symbol,
        asks,
        bids,
        updatedAt: ts,
      };
      if (frame.current == null) {
        frame.current = window.requestAnimationFrame(() => {
          frame.current = null;
          if (pending.current) setBook(pending.current);
        });
      }
    },
  );

  useEffect(() => {
    setBook(null);
    pending.current = null;
  }, [network, symbol]);

  useEffect(
    () => () => {
      if (frame.current != null) window.cancelAnimationFrame(frame.current);
    },
    [],
  );

  return { book, status };
}

function mergeTrades(previous: Trade[], incoming: Trade[]): Trade[] {
  const seen = new Set<string>();
  return [...incoming, ...previous]
    .filter((trade) => {
      if (seen.has(trade.id)) return false;
      seen.add(trade.id);
      return true;
    })
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 60);
}

interface WireTrade {
  symbol?: string;
  price?: number;
  size?: number;
  side?: "BUY" | "SELL";
}

export function useTrades(network: Network, symbol: string): {
  trades: Trade[];
  status: SocketStatus;
} {
  const [trades, setTrades] = useState<Trade[]>([]);

  const status = useOrderlyTopic(
    network,
    symbol ? `${symbol}@trade` : null,
    (data, ts) => {
      const wire = data as WireTrade;
      const price = Number(wire.price);
      const size = Number(wire.size);
      if (!Number.isFinite(price) || !Number.isFinite(size)) return;
      const side = wire.side === "SELL" ? "SELL" : "BUY";
      const trade: Trade = {
        id: `${ts}-${price}-${size}-${side}`,
        symbol: wire.symbol ?? symbol,
        price,
        size,
        side,
        ts,
      };
      setTrades((previous) => mergeTrades(previous, [trade]));
    },
  );

  useEffect(() => {
    setTrades([]);
  }, [network, symbol]);

  useEffect(() => {
    if (status !== "live" || !symbol) return;
    let cancelled = false;
    const controller = new AbortController();
    fetchMarketTrades(network, symbol, 50, controller.signal)
      .then((recent) => {
        if (!cancelled) setTrades((previous) => mergeTrades(previous, recent));
      })
      .catch(() => {
        // The socket will fill the tape; a failed seed is not fatal.
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [status, network, symbol]);

  return { trades, status };
}

export function useBinaryRounds(network: Network) {
  return usePoll(
    `binary:${network}`,
    (signal) => fetchBinaryRounds(network, signal),
    5_000,
  );
}

export interface PredictQuote {
  bid: number | null;
  ask: number | null;
  downBid: number | null;
  downAsk: number | null;
}

export function usePredictQuote(network: Network, symbol: string | null): {
  quote: PredictQuote | null;
  status: SocketStatus;
} {
  const [quote, setQuote] = useState<PredictQuote | null>(null);

  const status = useOrderlyTopic(
    network,
    symbol ? `${symbol}@orderbook` : null,
    (data) => {
      const wire = data as {
        asks?: unknown;
        bids?: unknown;
        down_asks?: unknown;
        down_bids?: unknown;
      };
      const asks = parseLevels(wire.asks);
      const bids = parseLevels(wire.bids);
      const downAsks = parseLevels(wire.down_asks);
      const downBids = parseLevels(wire.down_bids);

      setQuote({
        bid: bids.length ? Math.max(...bids.map((level) => level.price)) : null,
        ask: asks.length ? Math.min(...asks.map((level) => level.price)) : null,
        downBid: downBids.length ? Math.max(...downBids.map((level) => level.price)) : null,
        downAsk: downAsks.length ? Math.min(...downAsks.map((level) => level.price)) : null,
      });
    },
  );

  useEffect(() => {
    setQuote(null);
  }, [network, symbol]);

  return { quote, status };
}

export function useDesk(enabled: boolean) {
  const poll = usePoll(
    `desk:${enabled}`,
    (signal) => {
      if (!enabled) return Promise.resolve(null as DeskSnapshot | null);
      return fetchDesk(signal);
    },
    3_000,
  );

  if (!enabled) {
    return { data: null as DeskSnapshot | null, error: null, loading: false, updatedAt: null };
  }
  return poll;
}

export function pickCurrentRound(rounds: BinaryRound[]): BinaryRound | null {
  const now = Date.now();
  return (
    rounds
      .filter((round) => round.status === "ACTIVE" && Number(round.expire_at) > now)
      .sort((a, b) => Number(a.expire_at) - Number(b.expire_at))[0] ?? null
  );
}

export function topMarkets(rows: MarketRow[]): MarketRow[] {
  return rows.filter((row) => row.status === "ACTIVE" && !row.broker_id);
}

export type { Candle };
