import type { DailyRecap } from "../lib/agentTypes";
import { timeAgo } from "../lib/format";
import { Panel, Skeleton } from "./ui";

function dayLabel(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function modelLabel(model: string): string {
  if (model.includes("deepseek-v4.1-flash")) return "DeepSeek V4.1 Flash";
  return model.replace("@cf/", "") || "Workers AI";
}

export default function DailyRecapPanel({
  recaps,
  loading,
}: {
  recaps: DailyRecap[];
  loading: boolean;
}) {
  const latest = recaps[0];
  const older = recaps.slice(1);

  return (
    <Panel
      title="Daily desk recap"
      action={
        latest ? (
          <span className="rounded-full border border-accent/30 bg-accent/[0.08] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.07em] text-accent">
            {latest.source === "workers-ai" ? "AI written" : "rules"}
          </span>
        ) : null
      }
      bodyClassName="px-4 py-4"
    >
      {loading && !latest ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : !latest ? (
        <p className="text-[13px] leading-relaxed text-muted">
          The first recap is written after the next UTC midnight, from the decision log and
          equity snapshots in D1.
        </p>
      ) : (
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-dim">
            <span className="text-muted">UTC {dayLabel(latest.day)}</span>
            <span>{modelLabel(latest.model)}</span>
            <span className="ml-auto normal-case tracking-normal">
              written {timeAgo(latest.createdAt)}
            </span>
          </div>
          <p className="mt-3 max-w-[900px] text-[14px] leading-[1.75] text-ink/90">
            {latest.text}
          </p>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.07em] text-dim">
            Generated from D1 decisions and snapshots. The model summarizes; it cannot trade.
          </p>

          {older.length ? (
            <details className="mt-3 border-t border-white/[0.06] pt-2">
              <summary className="cursor-pointer select-none font-mono text-[9.5px] uppercase tracking-[0.08em] text-dim hover:text-muted">
                Earlier recaps ({older.length})
              </summary>
              <div className="mt-2 space-y-3">
                {older.map((recap) => (
                  <div key={recap.day}>
                    <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-dim">
                      {dayLabel(recap.day)} · {recap.source === "workers-ai" ? "AI" : "rules"}
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{recap.text}</p>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
        </div>
      )}
    </Panel>
  );
}
