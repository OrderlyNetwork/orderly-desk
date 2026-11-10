import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/format";

export function Chapter({
  id,
  number,
  title,
  lede,
  children,
}: {
  id: string;
  number: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/10 pt-10 first:border-0 first:pt-0">
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
        <span>{number}</span>
        <span className="h-px w-8 bg-accent/40" aria-hidden="true" />
      </div>
      <h2 className="mt-3 text-[clamp(26px,3.4vw,38px)] font-[620] leading-[1.1] tracking-[-0.035em]">
        {title}
      </h2>
      <p className="mt-3 max-w-[720px] text-[15px] leading-[1.7] text-muted">{lede}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-[760px] space-y-4 text-[14.5px] leading-[1.75] text-muted">{children}</div>;
}

export function SubHead({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-[16px] font-[580] tracking-[-0.015em] text-ink">{children}</h3>;
}

const tones = {
  note: {
    box: "border-accent/25 bg-accent/[0.06]",
    label: "text-accent",
  },
  gotcha: {
    box: "border-warn/25 bg-warn/[0.05]",
    label: "text-warn",
  },
  verified: {
    box: "border-gain/20 bg-gain/[0.05]",
    label: "text-gain",
  },
} as const;

export function Callout({
  tone = "note",
  label,
  children,
}: {
  tone?: keyof typeof tones;
  label: string;
  children: ReactNode;
}) {
  const style = tones[tone];
  return (
    <div className={cn("max-w-[760px] rounded-xl border px-4 py-3.5", style.box)}>
      <div className={cn("font-mono text-[9.5px] uppercase tracking-[0.1em]", style.label)}>
        {label}
      </div>
      <div className="mt-1.5 text-[13.5px] leading-[1.7] text-muted">{children}</div>
    </div>
  );
}

export function NextLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 pt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-accent transition hover:text-[#b9a0ff]"
    >
      {label} <span aria-hidden="true">→</span>
    </Link>
  );
}
