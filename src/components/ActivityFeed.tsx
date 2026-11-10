import type { AgentState, Decision } from "../lib/agentTypes";
import { cn, fmtClock, fmtPrice, fmtQty, timeAgo } from "../lib/format";
import CopyButton from "./CopyButton";
import { EmptyState, Panel, Skeleton } from "./ui";

function cliCommand(decision: Decision, agent: AgentState | undefined): string | null {
  if (!agent || decision.quantity == null) return null;
  const account = agent.accountId;
  const symbol = decision.symbol;

  if (decision.action.startsWith("OPEN")) {
    const side = decision.action.includes("LONG") ? "BUY" : "SELL";
    return [
      `orderly leverage ${symbol} 3 --account ${account} --network testnet`,
      `orderly order-place ${symbol} ${side} MARKET ${decision.quantity} --account ${account} --network testnet`,
    ].join("\n");
  }

  if (decision.action.startsWith("CLOSE")) {
    return `orderly positions-close ${symbol} --quantity ${decision.quantity} --account ${account} --network testnet`;
  }

  return null;
}

export default function ActivityFeed({
  decisions,
  agents,
  loading,
}: {
  decisions: Decision[];
  agents: AgentState[];
  loading: boolean;
}) {
  return (
    <Panel
      title="Live activity"
      action={
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-dim">read-only</span>
      }
      bodyClassName="px-4 pb-2 pt-2"
    >
      {loading && !decisions.length ? (
        <div className="space-y-3 py-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : !decisions.length ? (
        <EmptyState>No trades yet. The agents check the 5m BTC book on a schedule.</EmptyState>
      ) : (
        <div className="max-h-[480px] overflow-y-auto">
          {decisions.map((decision) => {
            const agent = agents.find((item) => item.id === decision.agent_id);
            const command = cliCommand(decision, agent);
            return (
              <article
                key={decision.id}
                className="border-b border-white/[0.06] py-3 last:border-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.07em]">
                    <span className="text-accent">{decision.agent_name ?? decision.agent_id}</span>
                    <span className="text-dim">{timeAgo(decision.created_at)}</span>
                  </div>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em]",
                      decision.action.startsWith("OPEN")
                        ? "bg-accent/10 text-accent"
                        : "bg-white/[0.06] text-dim",
                    )}
                  >
                    {decision.source === "workers-ai" ? "AI commentary" : "rules"}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-[12px] text-ink">{decision.action}</span>
                  {decision.price != null ? (
                    <span className="font-mono text-[10px] text-dim">
                      mark {fmtPrice(decision.price)}
                    </span>
                  ) : null}
                  {decision.quantity != null ? (
                    <span className="font-mono text-[10px] text-dim">
                      {fmtQty(decision.quantity)} BTC
                    </span>
                  ) : null}
                  <span className="ml-auto font-mono text-[9px] text-dim">
                    {fmtClock(decision.created_at)}
                  </span>
                </div>

                {decision.reason ? (
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">{decision.reason}</p>
                ) : null}

                {command ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer select-none font-mono text-[9.5px] uppercase tracking-[0.08em] text-dim hover:text-muted">
                      CLI equivalent
                    </summary>
                    <div className="mt-1.5 flex items-start justify-between gap-2 rounded-md bg-black/25 px-2.5 py-2">
                      <code className="whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed text-[#9aa1ae]">
                        {command}
                      </code>
                      <CopyButton text={command} label="copy" className="shrink-0" />
                    </div>
                  </details>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
