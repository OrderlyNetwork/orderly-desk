import { Link } from "react-router-dom";
import { changePct, cn, fmtPrice, fmtSigned, marketLabel } from "../lib/format";
import { useMarkets } from "../lib/useMarketData";

export default function TickerStrip() {
  const { options, loading, error } = useMarkets("mainnet");
  const tickers = options.slice(0, 4);

  return (
    <div className="border-b border-white/10 bg-bg-soft/40">
      <div className="shell flex items-center gap-5 overflow-x-auto py-3">
        <span className="flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
          <span className="h-1.5 w-1.5 rounded-full bg-gain animate-live" aria-hidden="true" />
          reference markets · mainnet
        </span>

        {error ? (
          <span className="font-mono text-[10px] text-dim">market feed unavailable</span>
        ) : loading && !tickers.length ? (
          <span className="font-mono text-[10px] text-dim">connecting…</span>
        ) : (
          <div className="flex items-center gap-6">
            {tickers.map((market) => {
              const price = Number(market.mark_price ?? market.index_price ?? 0);
              const change = changePct(Number(market["24h_open"] ?? 0), price);
              return (
                <Link
                  key={market.symbol}
                  to={`/dashboard?market=${encodeURIComponent(market.symbol)}`}
                  className="flex shrink-0 items-baseline gap-2.5 font-mono text-[11px] transition hover:opacity-80"
                >
                  <span className="text-muted">{marketLabel(market.symbol)}</span>
                  <span className="text-ink">{fmtPrice(price)}</span>
                  <span className={change == null ? "text-dim" : change >= 0 ? "text-gain" : "text-loss"}>
                    {change == null ? "—" : `${fmtSigned(change * 100)}%`}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        <Link
          to="/dashboard"
          className={cn(
            "ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-accent transition hover:text-[#b9a0ff]",
          )}
        >
          open agents →
        </Link>
      </div>
    </div>
  );
}
