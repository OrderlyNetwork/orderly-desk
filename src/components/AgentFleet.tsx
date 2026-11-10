import { cn, fmtSignedUsd, fmtUsd, pnlTone, timeAgo } from "../lib/format";
import type { AgentState } from "../lib/agentTypes";
import AgentCard from "./AgentCard";
import { Skeleton } from "./ui";

export default function AgentFleet({
  agents,
  loading,
  error,
  configured,
  updatedAt,
  compact = false,
  selectedId = null,
  onSelect,
}: {
  agents: AgentState[];
  loading: boolean;
  error: string | null;
  configured: boolean;
  updatedAt: number | null;
  compact?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const equity = agents.reduce((sum, agent) => sum + (agent.sleeveEquity ?? agent.equity ?? 0), 0);
  const pnl = agents.reduce((sum, agent) => sum + (agent.pnl ?? 0), 0);
  const reserve = agents.reduce((sum, agent) => sum + (agent.reserve ?? 0), 0);
  const open = agents.filter((agent) => agent.position).length;

  return (
    <section className={cn("rounded-[16px] border border-white/10 bg-panel/35", compact ? "p-4" : "p-5")}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">
            <span className="live-dot" aria-hidden="true" />
            Live agents
          </div>
          <h2 className={cn("mt-2 font-[620] tracking-[-0.035em]", compact ? "text-[22px]" : "text-[28px]")}>
            Three strategies. One testnet book.
          </h2>
          {!compact ? (
            <p className="mt-2 max-w-[620px] text-[13px] leading-relaxed text-muted">
              Workers run the schedules, sign testnet orders, and write every decision to D1.
              The browser is read-only; each action can be reproduced with the CLI.
              {onSelect ? " Select a card to focus the desk on one agent." : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.08em] text-dim">
          <span>{agents.length || 3} agents</span>
          <span>{open} in position</span>
          <span className="text-ink">{fmtUsd(equity)} allocated</span>
          <span className={pnlTone(pnl)}>{fmtSignedUsd(pnl)}</span>
          {reserve > 0.5 ? <span>{fmtUsd(reserve)} reserve</span> : null}
          <span className="rounded-full border border-white/10 px-2 py-1">read-only</span>
        </div>
      </div>

      {!configured ? (
        <div className="mt-5 rounded-xl border border-dashed border-white/15 px-4 py-6 font-mono text-[11px] leading-relaxed text-dim">
          Agent API is not configured. Set <span className="text-muted">VITE_AGENTS_API</span> to
          the Worker URL, or run <span className="text-muted">pnpm worker:dev</span> locally.
        </div>
      ) : error && !agents.length ? (
        <div className="mt-5 rounded-xl border border-loss/25 bg-loss/[0.05] px-4 py-6 font-mono text-[11px] leading-relaxed text-loss">
          Agent API offline: {error}. Start the Worker or check its CORS origin.
        </div>
      ) : loading && !agents.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-[280px] w-full rounded-[14px]" />
          ))}
        </div>
      ) : (
        <div className={cn("mt-5 grid gap-3", compact ? "md:grid-cols-3" : "lg:grid-cols-3")}>
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              selected={selectedId === agent.id}
              dimmed={Boolean(selectedId && selectedId !== agent.id)}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.07em] text-dim">
        <span>testnet demo · no real funds · $1,000 allocated per agent</span>
        <span>{updatedAt ? `dashboard updated ${timeAgo(updatedAt)}` : "waiting for the fleet"}</span>
      </div>
    </section>
  );
}
