import { cn, fmtClock, fmtPrice, fmtQty } from "../lib/format";
import type { Trade } from "../lib/types";
import type { SocketStatus } from "../lib/useOrderlyTopic";
import { EmptyState, Panel, StatusBadge } from "./ui";

export default function TradeTape({
  trades,
  status,
}: {
  trades: Trade[];
  status: SocketStatus;
}) {
  return (
    <Panel
      title="Trades"
      action={<StatusBadge status={status} />}
      bodyClassName="px-4 pb-2 pt-2"
    >
      <div className="grid grid-cols-3 gap-2 border-b border-white/[0.06] pb-1.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-dim">
        <span>price</span>
        <span className="text-right">size</span>
        <span className="text-right">time</span>
      </div>

      {!trades.length ? (
        <EmptyState>waiting for the next fill…</EmptyState>
      ) : (
        <div className="max-h-[276px] overflow-y-auto">
          {trades.slice(0, 40).map((trade) => (
            <div
              key={trade.id}
              className="grid grid-cols-3 gap-2 border-b border-white/[0.025] py-[3px] font-mono text-[11px] tabular-nums last:border-0"
            >
              <span className={cn(trade.side === "BUY" ? "text-gain" : "text-loss")}>
                {fmtPrice(trade.price)}
              </span>
              <span className="text-right text-muted">{fmtQty(trade.size)}</span>
              <span className="text-right text-dim">{fmtClock(trade.ts)}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
