import { AI_MODEL, runAiText } from "./commentary";
import type { Env } from "./types";

export interface DailyRecap {
  day: string;
  createdAt: number;
  text: string;
  source: "workers-ai" | "rules";
  model: string;
}

interface RecapRow {
  day: string;
  created_at: number;
  text: string;
  source: string;
  model: string;
}

interface AgentDay {
  id: string;
  name: string;
  opens: number;
  closes: number;
  vetoes: number;
  pnl: number | null;
}

function toRecap(row: RecapRow): DailyRecap {
  return {
    day: row.day,
    createdAt: row.created_at,
    text: row.text,
    source: row.source === "workers-ai" ? "workers-ai" : "rules",
    model: row.model,
  };
}

function previousDay(now: number): string {
  return new Date(now - 86_400_000).toISOString().slice(0, 10);
}

async function equityAt(env: Env, before: number): Promise<Map<string, number>> {
  const rows = await env.DB.prepare(
    `SELECT s.agent_id AS agent_id, s.equity AS equity
       FROM snapshots s
       JOIN (
         SELECT agent_id, MAX(ts) AS ts
           FROM snapshots
          WHERE ts <= ?
          GROUP BY agent_id
       ) last ON last.agent_id = s.agent_id AND last.ts = s.ts`,
  )
    .bind(before)
    .all<{ agent_id: string; equity: number | null }>();

  const values = new Map<string, number>();
  for (const row of rows.results ?? []) {
    if (row.equity != null) values.set(row.agent_id, Number(row.equity));
  }
  return values;
}

function fallbackText(day: string, agents: AgentDay[], total: number): string {
  const opens = agents.reduce((sum, agent) => sum + agent.opens, 0);
  const closes = agents.reduce((sum, agent) => sum + agent.closes, 0);
  const vetoes = agents.reduce((sum, agent) => sum + agent.vetoes, 0);
  const pnl = agents.reduce((sum, agent) => sum + (agent.pnl ?? 0), 0);
  const perAgent = agents
    .map(
      (agent) =>
        `${agent.name} logged ${agent.opens} opens and ${agent.closes} closes with ${agent.pnl == null ? "unreported" : `${agent.pnl >= 0 ? "+" : ""}${agent.pnl.toFixed(2)} USDC`} sleeve PnL.`,
    )
    .join(" ");

  return `On ${day} the desk recorded ${total} decisions: ${opens} opens, ${closes} closes, and ${vetoes} risk vetoes. ${perAgent} Net sleeve PnL was ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} USDC.`;
}

export async function listRecaps(env: Env, limit = 7): Promise<DailyRecap[]> {
  const rows = await env.DB.prepare(
    "SELECT day, created_at, text, source, model FROM recaps ORDER BY day DESC LIMIT ?",
  )
    .bind(Math.max(1, Math.min(30, limit)))
    .all<RecapRow>();
  return (rows.results ?? []).map(toRecap);
}

export async function ensureDailyRecap(
  env: Env,
  now = Date.now(),
): Promise<{ recap: DailyRecap; created: boolean } | null> {
  if (!env.DB) return null;
  const day = previousDay(now);
  const existing = await env.DB.prepare(
    "SELECT day, created_at, text, source, model FROM recaps WHERE day = ?",
  )
    .bind(day)
    .first<RecapRow>();
  if (existing) return { recap: toRecap(existing), created: false };

  const start = Date.parse(`${day}T00:00:00Z`);
  const end = start + 86_400_000;
  const [decisions, baseline, closing, agentRows] = await Promise.all([
    env.DB.prepare(
      `SELECT d.agent_id AS agent_id, a.name AS name, d.action AS action, d.reason AS reason
         FROM decisions d
         LEFT JOIN agents a ON a.id = d.agent_id
        WHERE d.created_at >= ? AND d.created_at < ?
        ORDER BY d.created_at ASC`,
    )
      .bind(start, end)
      .all<{ agent_id: string; name: string | null; action: string; reason: string | null }>(),
    equityAt(env, start),
    equityAt(env, end),
    env.DB.prepare("SELECT id, name FROM agents ORDER BY created_at ASC").all<{
      id: string;
      name: string;
    }>(),
  ]);

  const agents: AgentDay[] = (agentRows.results ?? []).map((agent) => {
    const from = baseline.get(agent.id);
    const to = closing.get(agent.id);
    return {
      id: agent.id,
      name: agent.name,
      opens: 0,
      closes: 0,
      vetoes: 0,
      pnl: from != null && to != null ? to - from : null,
    };
  });
  const byId = new Map(agents.map((agent) => [agent.id, agent]));

  for (const decision of decisions.results ?? []) {
    const agent = byId.get(decision.agent_id);
    if (!agent) continue;
    if (decision.action.startsWith("OPEN")) agent.opens += 1;
    else if (decision.action.startsWith("CLOSE")) agent.closes += 1;
    else if (decision.action.startsWith("VETO")) agent.vetoes += 1;
  }

  const total = (decisions.results ?? []).length;
  const agentLines = agents.map(
    (agent) =>
      `${agent.name}: ${agent.opens} opens, ${agent.closes} closes, ${agent.vetoes} vetoes, sleeve PnL ${agent.pnl == null ? "n/a" : `${agent.pnl >= 0 ? "+" : ""}${agent.pnl.toFixed(2)} USDC`}.`,
  );
  const logLines = (decisions.results ?? [])
    .slice(-12)
    .map(
      (decision) =>
        `${decision.name ?? decision.agent_id}: ${decision.action} — ${(decision.reason ?? "").slice(0, 120)}`,
    );

  const fallback = fallbackText(day, agents, total);
  let text = fallback;
  let source: DailyRecap["source"] = "rules";

  try {
    const aiText = await runAiText(
      env,
      [
        {
          role: "system",
          content:
            "You are the desk analyst for a testnet crypto trading showcase. Write concise, factual daily recaps. Use only the supplied numbers. No financial advice, no predictions, no invented trades.",
        },
        {
          role: "user",
          content: [
            `UTC day: ${day}`,
            `Fleet totals: ${total} decisions, ${agents.reduce((sum, agent) => sum + agent.opens, 0)} opens, ${agents.reduce((sum, agent) => sum + agent.closes, 0)} closes, ${agents.reduce((sum, agent) => sum + agent.vetoes, 0)} AI risk vetoes.`,
            ...agentLines,
            "Decision log:",
            ...(logLines.length ? logLines : ["No decisions recorded."]),
            "Write a daily desk recap in 3-4 sentences (max 110 words). Say what the strategies did, note any risk vetoes, and report the PnL. Do not give financial advice.",
          ].join("\n"),
        },
      ],
      { reasoningEffort: "none", maxCompletionTokens: 400, temperature: 0.3 },
    );
    if (aiText) {
      text = aiText.replace(/\s+/g, " ").trim().slice(0, 900);
      source = "workers-ai";
    }
  } catch (error) {
    console.error("Workers AI recap failed; using rules", error);
  }

  const recap: DailyRecap = {
    day,
    createdAt: Date.now(),
    text,
    source,
    model: AI_MODEL,
  };

  await env.DB.prepare(
    `INSERT OR REPLACE INTO recaps (day, created_at, text, source, model)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(recap.day, recap.createdAt, recap.text, recap.source, recap.model)
    .run();

  return { recap, created: true };
}
