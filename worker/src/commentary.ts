import type { AgentAccount, Env, MarketRow } from "./types";
import type { StrategyResult } from "./strategies";

const MODEL = "@cf/meta/llama-3.2-3b-instruct";

export interface Commentary {
  text: string;
  source: "workers-ai" | "rules";
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
    const response = (await env.AI.run(MODEL, {
      messages: [
        {
          role: "system",
          content:
            "You are a concise trading risk commentator. You explain a pre-decided testnet action. Never change the action. No financial advice.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 90,
      temperature: 0.3,
    })) as { response?: string };

    const text = response?.response?.trim();
    if (!text) return { text: fallback, source: "rules" };
    return { text: text.slice(0, 260), source: "workers-ai" };
  } catch (error) {
    console.error("Workers AI commentary failed; using rules", error);
    return { text: fallback, source: "rules" };
  }
}

function change(market: MarketRow): string {
  const open = Number(market["24h_open"] ?? 0);
  const mark = Number(market.mark_price ?? 0);
  if (!open || !mark) return "n/a";
  return `${(((mark - open) / open) * 100).toFixed(2)}%`;
}
