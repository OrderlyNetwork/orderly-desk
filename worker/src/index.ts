import { getAgentStates, getDecisions, getRuns, runDueAgents } from "./agents";
import { parseAgents } from "./config";
import { AI_MODEL } from "./commentary";
import { ensureDailyRecap, listRecaps } from "./recap";
import type { AgentState, Env } from "./types";

function allowedOrigins(env: Env): string[] {
  return (env.SITE_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function cors(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get("Origin");
  if (!origin) return {};
  const allowed = allowedOrigins(env);
  if (!allowed.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "600",
    vary: "Origin",
  };
}

function json(request: Request, env: Env, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...cors(request, env),
    },
  });
}

function desk(states: AgentState[]) {
  const positions = states.flatMap((state) =>
    state.position
      ? [
          {
            symbol: state.symbol,
            kind: "PERP",
            side: state.position.side,
            quantity: state.position.quantity,
            entryPrice: state.position.entryPrice,
            markPrice: state.position.markPrice,
            unrealizedPnl: state.position.unrealizedPnl,
            leverage: state.position.leverage,
            agent: state.name,
            agentId: state.id,
          },
        ]
      : [],
  );
  const balance = states.reduce((sum, state) => sum + (state.balance ?? 0), 0);
  const equity = states.reduce((sum, state) => sum + (state.equity ?? 0), 0);
  const unrealizedPnl = positions.reduce((sum, position) => sum + position.unrealizedPnl, 0);

  return {
    capturedAt: new Date().toISOString(),
    account: "testnet agent fleet",
    network: "testnet",
    balance,
    equity,
    freeCollateral: null,
    unrealizedPnl,
    positions,
    orders: [],
    fills: [],
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(request, env) });
    }

    if (request.method !== "GET") {
      return json(request, env, { error: "GET only" }, 405);
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/health") {
        const config = parseAgents(env);
        return json(request, env, {
          ok: true,
          network: env.ORDERLY_NETWORK,
          accounts: config.accounts.length,
          hasAI: Boolean(env.AI),
          aiModel: AI_MODEL,
          signing: "cli-wasm",
          tradingEnabled: env.AGENTS_ENABLED !== "0" && env.ORDERLY_NETWORK === "testnet",
          time: new Date().toISOString(),
        });
      }

      if (url.pathname === "/agents") {
        return json(request, env, { agents: await getAgentStates(env, url.searchParams.get("fresh") === "1") });
      }

      if (url.pathname === "/desk") {
        return json(request, env, desk(await getAgentStates(env, url.searchParams.get("fresh") === "1")));
      }

      if (url.pathname === "/decisions") {
        const limit = Number(url.searchParams.get("limit") ?? 50);
        return json(request, env, { decisions: await getDecisions(env, Number.isFinite(limit) ? limit : 50) });
      }

      if (url.pathname === "/runs") {
        const limit = Number(url.searchParams.get("limit") ?? 50);
        return json(request, env, { runs: await getRuns(env, Number.isFinite(limit) ? limit : 50) });
      }

      if (url.pathname === "/recaps") {
        const limit = Number(url.searchParams.get("limit") ?? 7);
        return json(request, env, { recaps: await listRecaps(env, Number.isFinite(limit) ? limit : 7) });
      }

      return json(
        request,
        env,
        {
          name: "orderly-desk-agents",
          network: env.ORDERLY_NETWORK,
          routes: ["/health", "/agents", "/desk", "/decisions", "/runs", "/recaps"],
          readOnly: true,
        },
        200,
      );
    } catch (error) {
      console.error("worker request failed", error);
      return json(
        request,
        env,
        { error: error instanceof Error ? error.message : "worker error" },
        500,
      );
    }
  },

  async scheduled(_controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log("worker scheduled", new Date().toISOString());
    try {
      const count = await runDueAgents(env);
      if (count) console.log(`agents ran: ${count}`);
    } catch (error) {
      console.error("scheduled run failed", error);
    }

    try {
      const result = await ensureDailyRecap(env);
      if (result?.created) {
        console.log(`daily recap ready for ${result.recap.day} (${result.recap.source})`);
      }
    } catch (error) {
      console.error("daily recap failed", error);
    }
  },
} satisfies ExportedHandler<Env>;
