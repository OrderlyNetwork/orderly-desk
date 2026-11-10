import type { AgentHealth, AgentState, Decision } from "./agentTypes";

const configuredBase = (import.meta.env.VITE_AGENTS_API ?? "").replace(/\/$/, "");

export const AGENTS_API =
  configuredBase || (import.meta.env.DEV ? "http://127.0.0.1:8788" : "");
export const agentsApiConfigured = Boolean(AGENTS_API);

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!AGENTS_API) throw new Error("Agent API is not configured");
  const response = await fetch(`${AGENTS_API}${path}`, {
    signal,
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export async function fetchAgents(signal?: AbortSignal): Promise<AgentState[]> {
  const payload = await getJson<{ agents: AgentState[] }>("/agents", signal);
  return payload.agents ?? [];
}

export async function fetchDecisions(limit = 40, signal?: AbortSignal): Promise<Decision[]> {
  const payload = await getJson<{ decisions: Decision[] }>(
    `/decisions?limit=${limit}`,
    signal,
  );
  return payload.decisions ?? [];
}

export async function fetchAgentHealth(signal?: AbortSignal): Promise<AgentHealth> {
  return getJson<AgentHealth>("/health", signal);
}
