import type { AgentAccount, Env, MarketRow, PositionRow } from "./types";
import type { StrategyResult } from "./strategies";

export const AI_MODEL = "@cf/deepseek-ai/deepseek-v4.1-flash-1017";

export interface Commentary {
  text: string;
  source: "workers-ai" | "rules";
}

export interface VetoResult {
  approved: boolean;
  reason: string;
  source: "workers-ai" | "rules";
}

interface AiTextResult {
  response?: string;
  choices?: Array<{ message?: { content?: string } }>;
}

function textFrom(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const payload = result as AiTextResult;
  if (typeof payload.response === "string") return payload.response.trim();
  const content = payload.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}

export async function runAiText(
  env: Env,
  messages: Array<{ role: "system" | "user"; content: string }>,
  options: {
    reasoningEffort: "none" | "low" | "high" | "max";
    maxCompletionTokens: number;
    temperature: number;
    json?: boolean;
  },
): Promise<string | null> {
  if (!env.AI) return null;
  const response = await env.AI.run(AI_MODEL, {
    messages,
    reasoning_effort: options.reasoningEffort,
    max_completion_tokens: options.maxCompletionTokens,
    temperature: options.temperature,
    ...(options.json ? { response_format: { type: "json_object" } } : {}),
  });
  return textFrom(response) || null;
}

export async function generateCommentary(
  env: Env,
  account: AgentAccount,
  result: StrategyResult,
  market: MarketRow,
): Promise<Commentary> {
  const fallback = result.reason;
  if (!env.AI || result.action === "hold") {
    return { text: fallback, source: "rules" };
  }

  const prompt = [
    `Agent: ${account.name} (${account.strategy}) on ${account.symbol}.`,
    `Market: mark ${market.mark_price ?? "n/a"}, 24h change ${change(market)}, funding ${market.est_funding_rate ?? "n/a"}.`,
    `Action already decided by the strategy: ${result.action.toUpperCase()} ${result.side ?? ""}.`,
    `Indicators: ${JSON.stringify(result.indicators)}.`,
    `Rule reason: ${result.reason}`,
    "Write one concise sentence (max 30 words) explaining why this action follows from the data. Do not recommend a different action. Do not give financial advice.",
  ].join("\n");

  try {
    const text = await runAiText(
      env,
      [
        {
          role: "system",
          content:
            "You are a concise trading risk commentator. You explain a pre-decided testnet action. Never change the action. No financial advice.",
        },
        { role: "user", content: prompt },
      ],
      { reasoningEffort: "low", maxCompletionTokens: 140, temperature: 0.2 },
    );
    if (!text) return { text: fallback, source: "rules" };
    return { text: text.slice(0, 260), source: "workers-ai" };
  } catch (error) {
    console.error("Workers AI commentary failed; using rules", error);
    return { text: fallback, source: "rules" };
  }
}

export async function reviewEntry(
  env: Env,
  account: AgentAccount,
  result: StrategyResult,
  market: MarketRow,
  position: PositionRow | null,
  quantity: number,
): Promise<VetoResult> {
  if (!env.AI) {
    return {
      approved: true,
      reason: "AI veto not configured; deterministic rules only.",
      source: "rules",
    };
  }

  const mark = Number(market.mark_price ?? 0);
  const prompt = [
    `Agent: ${account.name} (${account.strategy}) on ${account.symbol}.`,
    `Proposed entry: ${result.side} ${quantity} ${account.symbol} at market (~${(quantity * mark).toFixed(2)} USDC notional).`,
    `Market: mark ${mark || "n/a"}, 24h change ${change(market)}, funding ${market.est_funding_rate ?? "n/a"}.`,
    `Indicators: ${JSON.stringify(result.indicators)}.`,
    `Deterministic rule reason: ${result.reason}`,
    `Current position: ${position ? `${position.position_qty} @ ${position.average_open_price}` : "flat"}.`,
    "Risk policy: testnet only; one position; max 200 USDC notional; 3x leverage; ATR stop managed by the strategy.",
    "Decide whether to allow this entry. Approve if it is consistent with the rule reason and risk policy. Reject if the data is contradictory, stale, or the risk is excessive.",
    'Return JSON only: {"approve": true|false, "reason": "one short sentence"}.',
  ].join("\n");

  try {
    const text = await runAiText(
      env,
      [
        {
          role: "system",
          content:
            "You are a conservative testnet trading risk officer. You can only approve or reject a pre-computed entry. Return strict JSON. Do not invent prices. Do not give financial advice.",
        },
        { role: "user", content: prompt },
      ],
      {
        reasoningEffort: "low",
        maxCompletionTokens: 220,
        temperature: 0,
        json: true,
      },
    );

    if (!text) {
      return { approved: false, reason: "AI veto returned no decision; entry blocked.", source: "rules" };
    }

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const parsed = start >= 0 && end > start ? JSON.parse(text.slice(start, end + 1)) : null;
    if (!parsed || typeof parsed.approve !== "boolean") {
      return { approved: false, reason: "AI veto returned invalid JSON; entry blocked.", source: "workers-ai" };
    }

    const reason = typeof parsed.reason === "string" ? parsed.reason.slice(0, 220) : "";
    return {
      approved: parsed.approve,
      reason: reason || (parsed.approve ? "Entry approved by AI risk review." : "Entry rejected by AI risk review."),
      source: "workers-ai",
    };
  } catch (error) {
    console.error("Workers AI veto failed; entry blocked", error);
    return { approved: false, reason: "AI veto unavailable; entry blocked.", source: "rules" };
  }
}

function change(market: MarketRow): string {
  const open = Number(market["24h_open"] ?? 0);
  const mark = Number(market.mark_price ?? 0);
  if (!open || !mark) return "n/a";
  return `${(((mark - open) / open) * 100).toFixed(2)}%`;
}

