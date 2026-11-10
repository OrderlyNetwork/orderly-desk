import type { ReactNode } from "react";
import { cn } from "../lib/format";
import CopyButton from "./CopyButton";

export default function CommandBlock({
  command,
  output,
  children,
  className,
  label = "shell · testnet",
  prompt = true,
}: {
  command: string;
  output?: string;
  children?: ReactNode;
  className?: string;
  label?: string;
  prompt?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/10 bg-[#0c0d11] shadow-[0_20px_50px_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.015] px-3 py-2">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-dim">
          {label}
        </span>
        <CopyButton text={command} label="copy command" />
      </div>
      <div className="overflow-x-auto px-4 py-3 font-mono text-[12px] leading-[1.7]">
        <div className="flex gap-2 whitespace-pre-wrap break-words">
          {prompt ? (
            <span className="select-none text-accent" aria-hidden="true">
              $
            </span>
          ) : null}
          <code className="break-words text-ink">{command}</code>
        </div>
        {output ? (
          <pre className="mt-2 whitespace-pre-wrap break-words pl-5 font-mono text-[11.5px] leading-[1.7] text-[#8b93a1]">
            {output}
          </pre>
        ) : null}
        {children}
      </div>
    </div>
  );
}
