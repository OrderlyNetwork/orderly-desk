import { agentsApiConfigured, fetchAgents, fetchDecisions } from "./agentsApi";
import { usePoll } from "./usePoll";

export function useAgentFleet() {
  const poll = usePoll(
    `agents:${agentsApiConfigured ? "configured" : "offline"}`,
    (signal) => (agentsApiConfigured ? fetchAgents(signal) : Promise.resolve([])),
    10_000,
  );
  return { ...poll, configured: agentsApiConfigured };
}

export function useAgentDecisions(limit = 40) {
  const poll = usePoll(
    `decisions:${agentsApiConfigured ? "configured" : "offline"}:${limit}`,
    (signal) => (agentsApiConfigured ? fetchDecisions(limit, signal) : Promise.resolve([])),
    10_000,
  );
  return { ...poll, configured: agentsApiConfigured };
}
