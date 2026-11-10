import { useMemo, useState } from "react";
import CopyButton from "../components/CopyButton";
import { cn } from "../lib/format";
import { versions } from "../lib/versions";
import {
  CATEGORIES,
  categoryOf,
  commandUsage,
  type Category,
  type Schema,
  type SchemaCommand,
} from "../lib/schema";
import commandsJson from "../data/commands.json";

const schema = commandsJson as unknown as Schema;

function CommandCard({ command }: { command: SchemaCommand }) {
  const usage = commandUsage(command);
  return (
    <article className="group rounded-xl border border-white/[0.09] bg-panel/50 p-4 transition hover:border-white/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-mono text-[13px] text-ink">{command.path}</h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{command.about}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em]",
            command.mutates ? "bg-loss/10 text-loss" : "bg-white/[0.06] text-dim",
          )}
        >
          {command.mutates ? "write" : "read"}
        </span>
      </div>

      <div className="mt-3 flex items-start justify-between gap-2 rounded-md bg-black/25 px-2.5 py-2">
        <code className="break-all font-mono text-[10.5px] leading-relaxed text-[#9aa1ae]">
          {usage}
        </code>
        <CopyButton text={usage} label="copy" className="shrink-0" />
      </div>

      {command.args.length ? (
        <details className="mt-2.5">
          <summary className="cursor-pointer select-none font-mono text-[10px] uppercase tracking-[0.08em] text-dim transition hover:text-muted">
            {command.args.length} flag{command.args.length === 1 ? "" : "s"}
          </summary>
          <dl className="mt-2 space-y-1.5">
            {command.args.map((arg) => (
              <div key={`${command.path}-${arg.name}`} className="grid grid-cols-[120px_1fr] gap-2">
                <dt className="font-mono text-[10px] text-accent">
                  {arg.long ? `--${arg.long}` : arg.name}
                  {arg.required ? <span className="text-loss">*</span> : null}
                </dt>
                <dd className="text-[10.5px] leading-relaxed text-dim">
                  {arg.help || (arg.possibleValues.length ? arg.possibleValues.join(", ") : "—")}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
    </article>
  );
}

export default function Reference() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return schema.commands
      .filter((command) => category === "All" || categoryOf(command) === category)
      .filter((command) => {
        if (!needle) return true;
        return (
          command.path.toLowerCase().includes(needle) ||
          command.about.toLowerCase().includes(needle) ||
          command.args.some(
            (arg) =>
              arg.long?.toLowerCase().includes(needle) ||
              (arg.help ?? "").toLowerCase().includes(needle),
          )
        );
      })
      .sort((a, b) => a.path.localeCompare(b.path));
  }, [query, category]);

  const counts = useMemo(() => {
    const map = new Map<Category, number>();
    for (const command of schema.commands) {
      const key = categoryOf(command);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, []);

  return (
    <div className="shell pb-24 pt-10 md:pb-32 md:pt-14">
      <div className="eyebrow">Reference</div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-[clamp(38px,5vw,64px)] font-[640] leading-[1.02] tracking-[-0.05em]">
            Every command, one page.
          </h1>
          <p className="mt-4 max-w-[680px] text-[15px] leading-relaxed text-muted md:text-base">
            Generated from <span className="font-mono text-[0.85em] text-ink">orderly schema</span>,
            so the reference describes the binary instead of a stale README. Search a
            command, copy its usage, or expand the flags.
          </p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-dim">
          {schema.commands.length} commands · schema {schema.version}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-accent">
        <a href="/reference.md" className="transition hover:text-[#b9a0ff]">
          read as markdown
        </a>
        <a href="/llms.txt" className="transition hover:text-[#b9a0ff]">
          llms.txt
        </a>
        <a
          href={versions.cli.url}
          target="_blank"
          rel="noreferrer"
          className="text-dim transition hover:text-muted"
        >
          latest CLI {versions.cli.version}
        </a>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <label className="relative flex-1 basis-[280px]">
          <span className="sr-only">Search commands</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="search commands, flags, help text…"
            className="min-h-11 w-full rounded-lg border border-white/10 bg-panel px-4 font-mono text-[12px] text-ink placeholder:text-dim focus:border-accent/60 focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={cn(
                "min-h-9 rounded-lg border px-3 font-mono text-[10px] uppercase tracking-[0.07em] transition",
                category === item
                  ? "border-accent/40 bg-accent/10 text-ink"
                  : "border-white/10 text-dim hover:border-white/20 hover:text-muted",
              )}
            >
              {item}
              {item !== "All" && counts.get(item) ? (
                <span className="ml-1.5 text-[9px] text-dim">{counts.get(item)}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2 font-mono text-[10px] text-dim">
        <span className="uppercase tracking-[0.08em] text-muted">every authenticated command accepts</span>
        <span className="text-[#9aa1ae]">--account &lt;id&gt;</span>
        <span className="text-[#9aa1ae]">--network testnet|mainnet</span>
        <span className="text-[#9aa1ae]">--csv</span>
        <span className="text-[#9aa1ae]">--pretty</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {filtered.map((command) => (
          <CommandCard key={command.path} command={command} />
        ))}
      </div>

      {!filtered.length ? (
        <div className="mt-8 rounded-xl border border-dashed border-white/15 p-8 text-center font-mono text-[11px] text-dim">
          no commands match “{query}”
        </div>
      ) : null}
    </div>
  );
}
