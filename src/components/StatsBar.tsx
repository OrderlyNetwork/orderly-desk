import { changePct, cn, fmtCompact, fmtCountdown, fmtPercent, fmtPrice, fmtSigned, marketLabel } from "../lib/format";
import type { MarketRow, Network } from "../lib/types";
import { useNow } from "../lib/useNow";
import { NETWORKS } from "../lib/network";
import { Skeleton } from "./ui";

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-dim">{label}</div>
      <div className={cn("mt-1 font-mono text-[13px] text-ink", tone)}>{value}</div>
    </div>
  );
}

export default function StatsBar({
  market,
  network,
}: {
  market: MarketRow | null;
  network: Network;
}) {
  const now = useNow(1_000);

  if (!market) {
    return (
      <div className="rounded-[14px] border border-white/10 bg-panel/60 p-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-10 w-48" />
        <div className="mt-6 grid grid-cols-3 gap-4">
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
        </div>
      </div>
    );
  }

  const last = Number(market.mark_price ?? market.index_price ?? 0);
  const change = changePct(Number(market["24h_open"] ?? 0), last);
  const funding = Number(market.est_funding_rate ?? 0);
  const fundingIn = Number(market.next_funding_time ?? 0) - now;
  const volume = Number(market["24h_amount"] ?? 0) || Number(market["24h_volume"] ?? 0);
  const volumeLabel = Number(market["24h_amount"] ?? 0) > 0 ? "24h amount" : "24h volume";

  return (
    <div className="rounded-[14px] border border-white/10 bg-panel/60 p-5">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
              {marketLabel(market.symbol)}
            </span>
            <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-dim">
              perp
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-dim">
              {NETWORKS[network].label}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-[34px] leading-none tracking-[-0.03em] text-ink md:text-[42px]">
              {fmtPrice(last)}
            </span>
            <span
              className={cn(
                "font-mono text-[13px]",
                change == null ? "text-dim" : change >= 0 ? "text-gain" : "text-loss",
              )}
            >
              {change == null ? "—" : `${fmtSigned(change * 100)}%`}
            </span>
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
            mark price
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-7 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="24h high" value={fmtPrice(Number(market["24h_high"] ?? 0))} />
          <Stat label="24h low" value={fmtPrice(Number(market["24h_low"] ?? 0))} />
          <Stat label={volumeLabel} value={`${fmtCompact(volume)}`} />
          <Stat label="open interest" value={fmtCompact(Number(market.open_interest ?? 0))} />
          <Stat
            label="funding"
            value={`${fmtPercent(funding, 4)} · ${fmtCountdown(fundingIn)}`}
            tone={funding >= 0 ? "text-gain" : "text-loss"}
          />
        </div>
      </div>
    </div>
  );
}
