import { cn, fmtDate, fmtPrice, fmtQty, fmtSignedUsd, fmtTime, fmtUsd, marketLabel, pnlTone } from "../lib/format";
import type { DeskSnapshot } from "../lib/types";
import { EmptyState, Panel, Skeleton } from "./ui";

function shortAddress(address: string): string {
  if (address.length < 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function positionLabel(position: DeskSnapshot["positions"][number]): string {
  if (position.kind === "BINARY") {
    const underlying = position.symbol.replace(/^PERP_/, "").split("5M")[0];
    return `${underlying} 5m`;
  }
  return marketLabel(position.symbol);
}

function fillLabel(symbol: string): string {
  if (symbol.includes("5M")) {
    const underlying = symbol.replace(/^PERP_/, "").split("5M")[0];
    return `${underlying} 5m`;
  }
  return marketLabel(symbol);
}

export default function DeskPanel({
  snapshot,
  mode,
  loading,
  error,
}: {
  snapshot: DeskSnapshot | null;
  mode: "live" | "snapshot" | "unavailable";
  loading: boolean;
  error: string | null;
}) {
  return (
    <Panel
      title="Desk"
      action={
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em]",
            mode === "live" ? "text-gain" : "text-dim",
          )}
        >
          <span
            className={cn("h-1.5 w-1.5 rounded-full", mode === "live" ? "bg-gain animate-live" : "bg-dim")}
            aria-hidden="true"
          />
          {mode === "live" ? "live CLI" : mode === "snapshot" ? "snapshot" : "offline"}
        </span>
      }
      bodyClassName="px-4 pb-4 pt-3"
    >
      {loading && !snapshot ? (
        <div className="space-y-3 py-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !snapshot ? (
        <div>
          <EmptyState>
            {error ? `bridge error · ${error}` : "the live desk bridge is not running"}
          </EmptyState>
          <div className="rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2 font-mono text-[10px] leading-relaxed text-dim">
            <div className="text-muted"># locally, next to this site</div>
            <div>pnpm bridge</div>
            <div className="mt-1 text-[9px]">Read-only. Keys stay in the OS keychain.</div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-dim">
              {snapshot.account ? shortAddress(snapshot.account) : "demo account"}
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-dim">
              {snapshot.network || "testnet"}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2">
              <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-dim">balance</div>
              <div className="mt-0.5 font-mono text-[15px] text-ink">{fmtUsd(snapshot.balance)}</div>
            </div>
            <div className="rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2">
              <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-dim">equity</div>
              <div className="mt-0.5 font-mono text-[15px] text-ink">{fmtUsd(snapshot.equity)}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-1.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-dim">
              <span>positions</span>
              <span>{snapshot.positions.length}</span>
            </div>
            {snapshot.positions.length ? (
              <div className="divide-y divide-white/[0.04]">
                {snapshot.positions.slice(0, 4).map((position) => (
                  <div key={position.symbol} className="py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-mono text-[11px] text-ink">
                        {positionLabel(position)}
                        {position.kind === "BINARY" ? (
                          <span className="rounded border border-white/10 px-1 py-0.5 font-mono text-[8px] uppercase tracking-[0.06em] text-dim">
                            predict
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em]",
                          position.side === "LONG" || position.side === "UP"
                            ? "bg-gain/10 text-gain"
                            : "bg-loss/10 text-loss",
                        )}
                      >
                        {position.side}
                      </span>
                    </div>
                    <div className="mt-1 grid grid-cols-3 gap-2 font-mono text-[10px] tabular-nums text-dim">
                      <span>{fmtQty(position.quantity)} @ {fmtPrice(position.entryPrice)}</span>
                      <span className="text-right">mark {fmtPrice(position.markPrice)}</span>
                      <span className={cn("text-right", pnlTone(position.unrealizedPnl))}>
                        {fmtSignedUsd(position.unrealizedPnl)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-3 font-mono text-[10px] text-dim">no open positions</div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <div className="border-b border-white/[0.07] pb-1.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-dim">
                open orders · {snapshot.orders.length}
              </div>
              {snapshot.orders.length ? (
                snapshot.orders.slice(0, 2).map((order) => (
                  <div key={order.id} className="mt-1.5 font-mono text-[10px] text-dim">
                    <span className={order.side === "BUY" ? "text-gain" : "text-loss"}>
                      {order.side}
                    </span>{" "}
                    {fmtQty(order.quantity)} @ {fmtPrice(order.price)}
                  </div>
                ))
              ) : (
                <div className="mt-1.5 font-mono text-[10px] text-dim">none</div>
              )}
            </div>
            <div>
              <div className="border-b border-white/[0.07] pb-1.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-dim">
                recent fills
              </div>
              {snapshot.fills.length ? (
                snapshot.fills.slice(0, 2).map((fill) => (
                  <div key={fill.id} className="mt-1.5 font-mono text-[10px] text-dim">
                    <span className={fill.side === "BUY" ? "text-gain" : "text-loss"}>
                      {fill.side}
                    </span>{" "}
                    {fmtQty(fill.quantity)} @ {fmtPrice(fill.price)}
                    <span className="ml-1 text-[9px]">
                      {fillLabel(fill.symbol)} · {fmtTime(fill.ts)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="mt-1.5 font-mono text-[10px] text-dim">none</div>
              )}
            </div>
          </div>

          <div className="mt-3 border-t border-white/[0.07] pt-2.5 font-mono text-[9px] leading-relaxed text-dim">
            {mode === "live" ? (
              <>read-only via the orderly CLI · this panel never signs</>
            ) : (
              <>
                captured {snapshot.capturedAt ? fmtDate(Date.parse(snapshot.capturedAt)) : "demo"} · run{" "}
                <span className="text-muted">pnpm bridge</span> for live data
              </>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}
