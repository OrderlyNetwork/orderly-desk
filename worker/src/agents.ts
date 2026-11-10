import { generateCommentary } from "./commentary";
import {
  accountById,
  AGENT_INTERVALS,
  DEFAULT_INTERVAL_MINUTES,
  MAX_NOTIONAL_USDC,
  MIN_QUANTITY,
  parseAgents,
  QUANTITY_STEP,
} from "./config";
import {
  closePosition,
  fetchCandles,
  fetchHolding,
  fetchMarket,
  fetchPositions,
  findPosition,
  OrderlyError,
  placeOrder,
  setLeverage,
} from "./orderly";
import { evaluateStrategy } from "./strategies";
import type {
  AgentAccount,
  AgentRow,
  AgentState,
  DecisionRow,
  Env,
  PositionRow,
} from "./types";

const LOCK_MINUTES = 5;
const MIN_BALANCE_USDC = 50;

let stateCache: { at: number; data: AgentState[] } | null = null;

function cleanError(error: unknown): string {
  if (error instanceof OrderlyError) {
    return `Orderly API ${error.status}`;
  }
  const raw = error instanceof Error ? error.message : String(error);
  const text = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.slice(0, 180) || "upstream error";
}

export async function ensureAgents(env: Env) {
  const config = parseAgents(env);
  if (!config.accounts.length) return;

  const now = Date.now();
  const statements = config.accounts.map((account) =>
    env.DB.prepare(
      `INSERT INTO agents
        (id, name, strategy, symbol, description, enabled, interval_minutes, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         strategy = excluded.strategy,
         symbol = excluded.symbol,
         description = excluded.description,
         interval_minutes = excluded.interval_minutes`,
    ).bind(
      account.id,
      account.name,
      account.strategy,
      account.symbol,
      account.description,
      AGENT_INTERVALS[account.strategy] ?? DEFAULT_INTERVAL_MINUTES,
      now,
    ),
  );

  await env.DB.batch(statements);
}

export async function runDueAgents(env: Env): Promise<number> {
  if (env.ORDERLY_NETWORK !== "testnet") return 0;
  if (env.AGENTS_ENABLED === "0") return 0;

  const config = parseAgents(env);
  if (!config.accounts.length) return 0;

  await ensureAgents(env);

  const now = Date.now();
  const due = await env.DB.prepare(
    `SELECT * FROM agents
     WHERE enabled = 1
       AND (last_run_at IS NULL OR last_run_at + interval_minutes * 60000 <= ?)
       AND (locked_until IS NULL OR locked_until < ?)
     ORDER BY COALESCE(last_run_at, 0) ASC
     LIMIT 3`,
  )
    .bind(now, now)
    .all<AgentRow>();

  let completed = 0;

  for (const agent of due.results ?? []) {
    const account = accountById(config, agent.id);
    if (!account) continue;

    const lock = await env.DB.prepare(
      `UPDATE agents SET locked_until = ?
       WHERE id = ? AND (locked_until IS NULL OR locked_until < ?)`,
    )
      .bind(now + LOCK_MINUTES * 60_000, agent.id, now)
      .run();

    if (Number(lock.meta.changes ?? 0) !== 1) continue;

    try {
      await runAgent(env, account, agent);
      completed += 1;
    } catch (error) {
      const message = cleanError(error);
      await env.DB.prepare(
        `UPDATE agents SET locked_until = NULL, last_run_at = ?, last_action = ?, last_reason = ?
         WHERE id = ?`,
      )
        .bind(Date.now(), "ERROR", message, agent.id)
        .run();
      console.error(`agent ${agent.id} failed`, message);
    }
  }

  stateCache = null;
  return completed;
}

async function runAgent(env: Env, account: AgentAccount, agent: AgentRow) {
  const startedAt = Date.now();
  const run = await env.DB.prepare(
    "INSERT INTO runs (agent_id, started_at, status) VALUES (?, ?, ?)",
  )
    .bind(agent.id, startedAt, "running")
    .run();
  const runId = Number(run.meta.last_row_id ?? 0);

  try {
    const [market, candles, positions, holding] = await Promise.all([
      fetchMarket(env, account.symbol),
      fetchCandles(env, account.symbol, "5", 200),
      fetchPositions(env, account),
      fetchHolding(env, account),
    ]);

    const position = findPosition(positions, account.symbol);
    const result = evaluateStrategy({
      strategy: account.strategy,
      candles,
      market,
      position,
    });

    const usdc = holding.find((row) => row.token === "USDC");
    const balance = Number(usdc?.holding ?? 0);
    const equity = Number(
      positions.account_value ?? positions.total_collateral_value ?? balance,
    );
    const mark = Number(market.mark_price ?? candles.at(-1)?.close ?? 0);

    if (result.action === "open" && balance < MIN_BALANCE_USDC) {
      result.action = "hold";
      result.reason = `Skipped: balance ${balance.toFixed(2)} USDC is below the ${MIN_BALANCE_USDC} USDC floor. ${result.reason}`;
    }

    let orderId: string | null = null;
    let quantity: number | null = null;
    let price: number | null = mark;
    let actionLabel = "HOLD";
    let reason = result.reason;
    let source = "rules";

    if (result.action === "open" && result.side && mark > 0) {
      const rawQuantity = MAX_NOTIONAL_USDC / mark;
      const stepped =
        Math.floor(rawQuantity / QUANTITY_STEP) * QUANTITY_STEP;
      quantity = Math.max(MIN_QUANTITY, Number(stepped.toFixed(3)));

      if (quantity * mark >= 10) {
        await setLeverage(env, account, account.symbol, 3);
        const commentary = await generateCommentary(env, account, result, market);
        reason = commentary.text;
        source = commentary.source;

        const order = await placeOrder(env, account, {
          symbol: account.symbol,
          side: result.side,
          orderType: "MARKET",
          quantity,
          clientOrderId: `${account.id}-${Date.now()}`,
        });
        orderId = order.order_id == null ? null : String(order.order_id);
        actionLabel = `OPEN ${result.side === "BUY" ? "LONG" : "SHORT"} ${quantity} @ market`;
        price = mark;
      } else {
        result.action = "hold";
        reason = `Skipped: ${quantity} ${account.symbol} is below the minimum notional.`;
      }
    } else if (result.action === "close") {
      const closed = await closePosition(env, account, account.symbol);
      if (closed) {
        quantity = closed.quantity;
        orderId =
          closed.response.order_id == null ? null : String(closed.response.order_id);
        actionLabel = `CLOSE ${position && Number(position.position_qty) > 0 ? "LONG" : "SHORT"} ${quantity} @ market`;
        const commentary = await generateCommentary(env, account, result, market);
        reason = commentary.text;
        source = commentary.source;
      } else {
        result.action = "hold";
        reason = "Close signal, but the position was already flat.";
      }
    }

    const finishedAt = Date.now();
    const indicatorsJson = JSON.stringify(result.indicators);

    await env.DB.prepare(
      `UPDATE runs SET finished_at = ?, status = ?, action = ?, reason = ?, indicators_json = ?
       WHERE id = ?`,
    )
      .bind(finishedAt, "ok", actionLabel, reason.slice(0, 500), indicatorsJson, runId)
      .run();

    if (result.action !== "hold") {
      await env.DB.prepare(
        `INSERT INTO decisions
          (agent_id, run_id, created_at, action, symbol, price, quantity, order_id, reason, source, indicators_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          account.id,
          runId,
          finishedAt,
          actionLabel,
          account.symbol,
          price,
          quantity,
          orderId,
          reason.slice(0, 500),
          source,
          indicatorsJson,
        )
        .run();
    }

    const positionQty = position ? Number(position.position_qty) : 0;
    await env.DB.prepare(
      `INSERT INTO snapshots
        (agent_id, ts, equity, balance, position_qty, entry_price, mark_price, unrealized_pnl, realized_pnl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        account.id,
        finishedAt,
        equity,
        balance,
        positionQty,
        position ? Number(position.average_open_price) : null,
        mark,
        position ? Number(position.unsettled_pnl) : null,
        null,
      )
      .run();

    await env.DB.prepare(
      `UPDATE agents SET
         initial_equity = COALESCE(initial_equity, ?),
         last_run_at = ?,
         locked_until = NULL,
         last_action = ?,
         last_reason = ?,
         last_order_id = ?
       WHERE id = ?`,
    )
      .bind(equity, finishedAt, actionLabel, reason.slice(0, 500), orderId, account.id)
      .run();
  } catch (error) {
    const message = cleanError(error);
    await env.DB.prepare(
      `UPDATE runs SET finished_at = ?, status = ?, error = ? WHERE id = ?`,
    )
      .bind(Date.now(), "error", message, runId)
      .run();
    throw error;
  }
}

export async function getAgentStates(env: Env, force = false): Promise<AgentState[]> {
  if (!force && stateCache && Date.now() - stateCache.at < 4_000) {
    return stateCache.data;
  }

  const config = parseAgents(env);
  if (!config.accounts.length) return [];

  await ensureAgents(env);
  const rows = await env.DB.prepare("SELECT * FROM agents ORDER BY created_at ASC").all<AgentRow>();
  const now = Date.now();

  const states = await Promise.all(
    (rows.results ?? []).map(async (agent): Promise<AgentState | null> => {
      const account = accountById(config, agent.id);
      if (!account) return null;

      try {
        const [positions, holding] = await Promise.all([
          fetchPositions(env, account),
          fetchHolding(env, account),
        ]);
        const usdc = holding.find((row) => row.token === "USDC");
        const balance = Number(usdc?.holding ?? 0);
        const equity = Number(
          positions.account_value ?? positions.total_collateral_value ?? balance,
        );
        const position: PositionRow | null = findPosition(positions, agent.symbol);
        const initial = agent.initial_equity;

        return {
          id: agent.id,
          name: agent.name,
          strategy: agent.strategy,
          symbol: agent.symbol,
          description: agent.description,
          accountId: account.accountId,
          address: account.address,
          enabled: agent.enabled === 1,
          intervalMinutes: agent.interval_minutes,
          equity,
          balance,
          initialEquity: initial,
          pnl: initial == null ? null : equity - initial,
          position: position
            ? {
                side: Number(position.position_qty) > 0 ? "LONG" : "SHORT",
                quantity: Math.abs(Number(position.position_qty)),
                entryPrice: Number(position.average_open_price),
                markPrice: Number(position.mark_price),
                unrealizedPnl: Number(position.unsettled_pnl),
                leverage: Number(position.leverage ?? 1),
              }
            : null,
          lastRunAt: agent.last_run_at,
          lastAction: agent.last_action,
          lastReason: agent.last_reason,
          lastOrderId: agent.last_order_id,
          nextRunAt: (agent.last_run_at ?? now) + agent.interval_minutes * 60_000,
        } satisfies AgentState;
      } catch (error) {
        return {
          id: agent.id,
          name: agent.name,
          strategy: agent.strategy,
          symbol: agent.symbol,
          description: agent.description,
          accountId: account.accountId,
          address: account.address,
          enabled: agent.enabled === 1,
          intervalMinutes: agent.interval_minutes,
          equity: null,
          balance: null,
          initialEquity: agent.initial_equity,
          pnl: null,
          position: null,
          lastRunAt: agent.last_run_at,
          lastAction: agent.last_action,
          lastReason: agent.last_reason,
          lastOrderId: agent.last_order_id,
          nextRunAt: (agent.last_run_at ?? now) + agent.interval_minutes * 60_000,
          error: cleanError(error),
        } satisfies AgentState;
      }
    }),
  );

  const data = states.filter((state): state is AgentState => state !== null);
  stateCache = { at: Date.now(), data };
  return data;
}

export async function getDecisions(env: Env, limit = 50): Promise<DecisionRow[]> {
  const result = await env.DB.prepare(
    `SELECT d.*, a.name AS agent_name
     FROM decisions d
     LEFT JOIN agents a ON a.id = d.agent_id
     ORDER BY d.created_at DESC
     LIMIT ?`,
  )
    .bind(Math.min(Math.max(limit, 1), 100))
    .all<DecisionRow>();
  return result.results ?? [];
}

export async function getRuns(env: Env, limit = 50) {
  const result = await env.DB.prepare(
    `SELECT r.*, a.name AS agent_name
     FROM runs r
     LEFT JOIN agents a ON a.id = r.agent_id
     ORDER BY r.started_at DESC
     LIMIT ?`,
  )
    .bind(Math.min(Math.max(limit, 1), 100))
    .all();
  return result.results ?? [];
}
