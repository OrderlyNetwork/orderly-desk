import { Link } from "react-router-dom";
import { fmtCountdown, fmtTime } from "../lib/format";
import type { BinaryRound, Network } from "../lib/types";
import type { PredictQuote } from "../lib/useMarketData";
import type { SocketStatus } from "../lib/useOrderlyTopic";
import { NETWORKS } from "../lib/network";
import { EmptyState, Panel, StatusBadge } from "./ui";

function mid(bid: number | null, ask: number | null): number | null {
  if (bid != null && ask != null) return (bid + ask) / 2;
  return bid ?? ask;
}

export default function PredictCard({
  round,
  quote,
  status,
  network,
  now,
}: {
  round: BinaryRound | null;
  quote: PredictQuote | null;
  status: SocketStatus;
  network: Network;
  now: number;
}) {
  const up = mid(quote?.bid ?? null, quote?.ask ?? null);
  const down = mid(quote?.downBid ?? null, quote?.downAsk ?? null) ?? (up == null ? null : 1 - up);
  const upPercent = up == null ? null : up * 100;
  const countdown = round ? Number(round.expire_at) - now : 0;

  return (
    <Panel
      title="Orderly Predict"
      action={
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-dim">
            BTC · 5m
          </span>
          <StatusBadge status={status} />
        </div>
      }
      bodyClassName="px-4 pb-4 pt-3"
    >
      {!round ? (
        <EmptyState>between rounds · the next one appears within seconds</EmptyState>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
                round closes in
              </div>
              <div className="mt-1 font-mono text-[30px] leading-none tracking-[-0.03em] text-ink">
                {fmtCountdown(countdown)}
              </div>
            </div>
            <div className="text-right font-mono text-[10px] leading-relaxed text-dim">
              <div>{fmtTime(round.observation_start_at)} → {fmtTime(round.expire_at)}</div>
              <div className="mt-0.5 max-w-[160px] truncate" title={round.symbol}>
                {round.symbol}
              </div>
              <div className="mt-0.5 text-[9px] uppercase tracking-[0.08em]">
                {NETWORKS[network].label}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-gain/20 bg-gain/[0.06] px-3 py-2.5">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em]">
                <span className="text-gain">UP</span>
                <span className="text-gain">{up == null ? "—" : `${upPercent?.toFixed(1)}%`}</span>
              </div>
              <div className="mt-1.5 font-mono text-[11px] text-muted">
                {quote?.bid != null ? quote.bid.toFixed(2) : "—"} /{" "}
                {quote?.ask != null ? quote.ask.toFixed(2) : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-loss/20 bg-loss/[0.06] px-3 py-2.5">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em]">
                <span className="text-loss">DOWN</span>
                <span className="text-loss">
                  {down == null ? "—" : `${(down * 100).toFixed(1)}%`}
                </span>
              </div>
              <div className="mt-1.5 font-mono text-[11px] text-muted">
                {quote?.downBid != null ? quote.downBid.toFixed(2) : "—"} /{" "}
                {quote?.downAsk != null ? quote.downAsk.toFixed(2) : "—"}
              </div>
            </div>
          </div>

          <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            {upPercent == null ? (
              <div className="w-full bg-white/[0.04]" />
            ) : (
              <>
                <div
                  className="bg-gain/80 transition-[width] duration-500"
                  style={{ width: `${upPercent}%` }}
                />
                <div className="flex-1 bg-loss/80" />
              </>
            )}
          </div>

          <p className="mt-3 font-mono text-[10px] leading-relaxed text-dim">
            {upPercent == null
              ? "the round's book is empty or waiting for an update."
              : "DOWN prices are derived from the UP book: buying DOWN at d is a SELL of UP at 1 − d."}
          </p>

          <div className="mt-3 border-t border-white/[0.07] pt-3">
            <Link
              to="/walkthrough#predict"
              className="font-mono text-[10px] uppercase tracking-[0.08em] text-accent transition hover:text-[#b9a0ff]"
            >
              how Predict works →
            </Link>
          </div>
        </>
      )}
    </Panel>
  );
}
