import type { ReactNode } from "react";
import { cn } from "../lib/format";
import { NETWORK_ORDER, NETWORKS } from "../lib/network";
import type { SocketStatus } from "../lib/useOrderlyTopic";
import type { Network } from "../lib/types";

export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[14px] border border-white/10 bg-panel/60",
        className,
      )}
    >
      <header className="flex min-h-[46px] items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{title}</h2>
        {action}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

const statusStyles: Record<SocketStatus, { label: string; dot: string; text: string }> = {
  live: { label: "live", dot: "bg-gain", text: "text-gain" },
  connecting: { label: "connecting", dot: "bg-warn", text: "text-warn" },
  reconnecting: { label: "reconnecting", dot: "bg-warn", text: "text-warn" },
  offline: { label: "offline", dot: "bg-dim", text: "text-dim" },
};

export function StatusBadge({ status }: { status: SocketStatus }) {
  const style = statusStyles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em]",
        style.text,
      )}
      title={`WebSocket ${status}`}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          style.dot,
          status === "live" && "animate-live",
        )}
        aria-hidden="true"
      />
      {style.label}
    </span>
  );
}

export function NetworkToggle({
  value,
  onChange,
}: {
  value: Network;
  onChange: (network: Network) => void;
}) {
  return (
    <div
      className="inline-flex rounded-lg border border-white/10 bg-panel p-0.5"
      role="group"
      aria-label="Market data network"
    >
      {NETWORK_ORDER.map((network) => {
        const active = value === network;
        return (
          <button
            key={network}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(network)}
            className={cn(
              "min-h-8 rounded-md px-3 font-mono text-[10.5px] uppercase tracking-[0.08em] transition",
              active
                ? "bg-white/10 text-ink shadow-[0_1px_0_rgba(255,255,255,0.06)_inset]"
                : "text-dim hover:text-muted",
            )}
          >
            {NETWORKS[network].shortLabel}
          </button>
        );
      })}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-white/[0.06]", className)} />;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-[90px] place-items-center px-4 py-6 text-center font-mono text-[11px] text-dim">
      {children}
    </div>
  );
}
