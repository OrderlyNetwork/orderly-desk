import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/format";

export default function CopyButton({
  text,
  label = "copy",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current != null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1_600);
    } catch {
      // Clipboard access can be denied; leave the button in its default state.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "rounded border border-white/10 px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-dim transition hover:border-white/20 hover:text-muted",
        className,
      )}
      aria-label={copied ? "Copied" : `Copy ${label}`}
    >
      {copied ? "copied" : label}
    </button>
  );
}
