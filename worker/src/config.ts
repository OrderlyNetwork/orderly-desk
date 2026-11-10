import type { AgentAccount, AgentsConfig, Env } from "./types";

export const AGENT_INTERVALS: Record<string, number> = {
  momentum: 4,
  "mean-reversion": 6,
  breakout: 8,
};

export const MAX_NOTIONAL_USDC = 200;
export const MIN_QUANTITY = 0.001;
export const QUANTITY_STEP = 0.001;
export const DEFAULT_INTERVAL_MINUTES = 6;

export function parseAgents(env: Env): AgentsConfig {
  const raw = env.AGENTS_CONFIG_B64
    ? decodeBase64(env.AGENTS_CONFIG_B64)
    : env.AGENTS_CONFIG;

  if (!raw) {
    return { broker: "demo", chainId: 421614, accounts: [] };
  }

  const parsed = JSON.parse(raw) as AgentsConfig;
  return {
    broker: parsed.broker ?? "demo",
    chainId: Number(parsed.chainId ?? 421614),
    accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
  };
}

export function accountById(config: AgentsConfig, id: string): AgentAccount | undefined {
  return config.accounts.find((account) => account.id === id);
}

export function decodeBase64(value: string): string {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
