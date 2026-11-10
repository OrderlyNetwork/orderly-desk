import { cn, fmtCountdown, fmtPrice, fmtQty, fmtSignedUsd, fmtUsd, pnlTone, timeAgo } from "../lib/format";
import type { AgentState } from "../lib/agentTypes";
import { useNow } from "../lib/useNow";

const strategyLabel: Record<string, string> = {
  momentum: "Momentum",
  "mean-reversion": "Mean reversion",
  breakout: "Breakout",
};

function shortId(value: string): string {
  return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}

export default function AgentCard({
  agent,
  selected = false,
  dimmed = false,
  onSelect,
}: {
  agent: AgentState;
  selected?: boolean;
  dimmed?: boolean;
  onSelect?: (id: string) => void;
}) {
  const now = useNow(1_000);
  const nextRun = agent.nextRunAt ? Math.max(0, agent.nextRunAt - now) : 0;
  const due = Boolean(agent.nextRunAt && nextRun <= 0);
  const running = agent.enabled && !agent.error && agent.lastAction !== "ERROR";
  const reasonText = (agent.error ?? agent.lastReason ?? "The first scheduled check will appear here.")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  const displayEquity = agent.sleeveEquity ?? agent.equity;

  const select = () => onSelect?.(agent.id);

  return (
    <article
      onClick={select}
      onKeyDown={(event) => {
        if (!onSelect || event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      }}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={onSelect ? selected : undefined}
      className={cn(
        "relative flex min-h-[280px] flex-col rounded-[14px] border bg-gradient-to-b from-panel-2/70 to-panel/70 p-4 transition",
        onSelect && "cursor-pointer",
        selected
          ? "border-accent/60 ring-1 ring-accent/25"
          : "border-white/10 hover:border-accent/35",
        dimmed && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                running ? "bg-gain animate-live" : "bg-loss",
              )}
              aria-hidden="true"
            />
            <h3 className="text-[15px] font-[580] tracking-[-0.01em] text-ink">{agent.name}</h3>
          </div>
          <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-dim">
            {strategyLabel[agent.strategy] ?? agent.strategy} · {agent.symbol.replace(/^PERP_/, "").replace(/_USDC$/, "")}
          </div>
        </div>
        <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-dim">
          testnet
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-dim">
            allocated equity
          </div>
          <div className="mt-0.5 font-mono text-[22px] leading-none text-ink">
            {fmtUsd(displayEquity)}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-dim">pnl</div>
          <div className={cn("mt-0.5 font-mono text-[15px]", pnlTone(agent.pnl))}>
            {fmtSignedUsd(agent.pnl)}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2.5">
        {agent.position ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em]",
                  agent.position.side === "LONG" ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss",
                )}
              >
                {agent.position.side}
              </span>
              <span className="font-mono text-[10px] text-muted">
                {agent.position.leverage}x · {fmtQty(agent.position.quantity)} BTC
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[10px] text-dim">
              <span>entry {fmtPrice(agent.position.entryPrice)}</span>
              <span className="text-center">mark {fmtPrice(agent.position.markPrice)}</span>
              <span className={cn("text-right", pnlTone(agent.position.unrealizedPnl))}>
                {fmtSignedUsd(agent.position.unrealizedPnl)}
              </span>
            </div>
          </>
        ) : (
          <div className="font-mono text-[10px] text-dim">flat · waiting for a signal</div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-dim">
          <span>last action</span>
          <span>{agent.lastRunAt ? timeAgo(agent.lastRunAt) : "not run yet"}</span>
        </div>
        <div className="mt-1 font-mono text-[11px] text-ink">{agent.lastAction ?? "warming up"}</div>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
          {reasonText}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/[0.06] pt-2.5 font-mono text-[9px] uppercase tracking-[0.07em] text-dim">
        <span>next check</span>
        <span className={cn(due ? "text-warn" : nextRun < 30_000 ? "text-warn" : "text-muted")}>
          {due ? "due" : fmtCountdown(nextRun)}
        </span>
        <span title={agent.accountId}>{shortId(agent.accountId)}</span>
      </div>

      {agent.dashboardUrl ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <a
            href={agent.dashboardUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            className="font-mono text-[9px] uppercase tracking-[0.08em] text-accent transition hover:text-[#b9a0ff]"
          >
            Orderly dashboard ↗
          </a>
          <span className="font-mono text-[9px] text-dim">
            {agent.userId ? `user ${agent.userId}` : ""}
          </span>
        </div>
      ) : null}
    </article>
  );
}
