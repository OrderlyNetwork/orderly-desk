import { cn, fmtPrice, fmtQty, midPrice, spreadPct } from "../lib/format";
import type { BookLevel, Orderbook } from "../lib/types";
import type { SocketStatus } from "../lib/useOrderlyTopic";
import { Panel, Skeleton, StatusBadge } from "./ui";

const DEPTH = 9;

function cumulative(levels: BookLevel[]): Array<{ level: BookLevel; total: number }> {
  let total = 0;
  return levels.map((level) => {
    total += level.quantity;
    return { level, total };
  });
}

export default function OrderbookPanel({
  book,
  status,
}: {
  book: Orderbook | null;
  status: SocketStatus;
}) {
  const asks = book ? cumulative(book.asks.slice(0, DEPTH)) : [];
  const bids = book ? cumulative(book.bids.slice(0, DEPTH)) : [];
  const maxTotal = Math.max(
    asks.length ? asks[asks.length - 1].total : 0,
    bids.length ? bids[bids.length - 1].total : 0,
    1,
  );
  const mid = midPrice(book);
  const spread = spreadPct(book);
  const displayAsks = [...asks].reverse();

  return (
    <Panel
      title="Order book"
      action={<StatusBadge status={status} />}
      bodyClassName="px-4 pb-3 pt-2"
    >
      <div className="grid grid-cols-3 gap-2 border-b border-white/[0.06] pb-1.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-dim">
        <span>price</span>
        <span className="text-right">size</span>
        <span className="text-right">total</span>
      </div>

      {!book ? (
        <div className="space-y-2 py-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="pt-1">
            {displayAsks.map(({ level, total }) => (
              <div
                key={`ask-${level.price}`}
                className="relative grid grid-cols-3 gap-2 py-[3px] font-mono text-[11px] tabular-nums"
              >
                <span
                  className="absolute inset-y-0 right-0 rounded-l-sm bg-loss/[0.09]"
                  style={{ width: `${(total / maxTotal) * 100}%` }}
                  aria-hidden="true"
                />
                <span className="relative text-loss">{fmtPrice(level.price)}</span>
                <span className="relative text-right text-muted">{fmtQty(level.quantity)}</span>
                <span className="relative text-right text-dim">{fmtQty(total)}</span>
              </div>
            ))}
          </div>

          <div className="my-1.5 flex items-center justify-between border-y border-white/[0.07] py-1.5 font-mono text-[10px]">
            <span className="text-dim">mid</span>
            <span className="text-ink">{fmtPrice(mid)}</span>
            <span className={cn("text-dim", spread != null && spread < 0.001 && "text-gain")}>
              {spread == null ? "—" : `${(spread * 100).toFixed(3)}%`}
            </span>
          </div>

          <div>
            {bids.map(({ level, total }) => (
              <div
                key={`bid-${level.price}`}
                className="relative grid grid-cols-3 gap-2 py-[3px] font-mono text-[11px] tabular-nums"
              >
                <span
                  className="absolute inset-y-0 right-0 rounded-l-sm bg-gain/[0.09]"
                  style={{ width: `${(total / maxTotal) * 100}%` }}
                  aria-hidden="true"
                />
                <span className="relative text-gain">{fmtPrice(level.price)}</span>
                <span className="relative text-right text-muted">{fmtQty(level.quantity)}</span>
                <span className="relative text-right text-dim">{fmtQty(total)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
