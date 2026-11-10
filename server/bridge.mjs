#!/usr/bin/env node
/**
 * The Orderly Desk bridge.
 *
 * A local-only, read-only HTTP server that shells out to the `orderly` CLI so the
 * dashboard can show the demo account without any key material reaching the
 * browser. Nothing here signs orders; every command is a read.
 */
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT ?? 8791);
const NETWORK = process.env.ORDERLY_NETWORK ?? "testnet";
const CACHE_MS = 2_000;
const CLI_TIMEOUT_MS = 8_000;

const binaryCandidates = [
  process.env.ORDERLY_BIN,
  path.resolve(here, "../../cli/target/release/orderly"),
  path.resolve(here, "../node_modules/.bin/orderly"),
  "orderly",
].filter(Boolean);

const BIN = binaryCandidates.find((candidate) => candidate === "orderly" || existsSync(candidate));

if (!BIN) {
  console.error("Could not find the orderly CLI. Set ORDERLY_BIN to its path.");
  process.exit(1);
}

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

let account = process.env.ORDERLY_ACCOUNT ?? null;
let accountCheckedAt = 0;

async function run(args) {
  const { stdout } = await execFileAsync(BIN, args, {
    timeout: CLI_TIMEOUT_MS,
    maxBuffer: 2_000_000,
    env: process.env,
  });
  const text = stdout.trim();
  if (!text) throw new Error(`orderly ${args[0]} returned no output`);
  return JSON.parse(text);
}

async function resolveAccount() {
  if (account) return account;
  if (Date.now() - accountCheckedAt < 60_000) return account;

  accountCheckedAt = Date.now();
  const list = await run(["auth-list", "--network", NETWORK]);
  if (Array.isArray(list) && list.length) {
    const preferred = list.find((entry) => entry.network === NETWORK && entry.walletType === "EVM");
    account = (preferred ?? list[0]).accountId;
  }
  return account;
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mask(value) {
  if (!value || value.length < 14) return value ?? "";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

async function safeRun(args) {
  try {
    return await run(args);
  } catch {
    return null;
  }
}

async function buildSnapshot() {
  const accountId = await resolveAccount();
  if (!accountId) {
    throw new Error("No testnet account found. Run `orderly auth-list --network testnet`.");
  }

  const base = ["--account", accountId, "--network", NETWORK];
  const [balance, perp, binary, orders, fills] = await Promise.all([
    safeRun(["account-balance", ...base]),
    safeRun(["positions-list", "--product-type", "PERP", ...base]),
    safeRun(["positions-list", "--product-type", "BINARY", ...base]),
    safeRun(["order-list", "--status", "NEW", ...base]),
    safeRun(["trades", "--size", "10", ...base]),
  ]);

  const usdc = Array.isArray(balance?.holding)
    ? balance.holding.find((holding) => holding.token === "USDC")
    : null;

  const rawPositions = [
    ...(Array.isArray(perp?.rows) ? perp.rows.map((row) => ({ row, kind: "PERP" })) : []),
    ...(Array.isArray(binary?.rows) ? binary.rows.map((row) => ({ row, kind: "BINARY" })) : []),
  ];

  const positions = rawPositions
    .map(({ row, kind }) => {
      const quantity = number(row.position_qty);
      const explicitEntry = number(row.average_open_price);
      const cost = number(row.cost_position);
      const upEntry =
        explicitEntry > 0
          ? explicitEntry
          : quantity !== 0 && cost > 0
            ? Math.abs(cost / quantity)
            : 0;
      const upMark = number(row.mark_price);
      const binary = kind === "BINARY";

      return {
        symbol: String(row.symbol ?? ""),
        kind,
        side: binary
          ? quantity >= 0
            ? "UP"
            : "DOWN"
          : quantity >= 0
            ? "LONG"
            : "SHORT",
        quantity: Math.abs(quantity),
        entryPrice: binary && quantity < 0 ? 1 - upEntry : upEntry,
        markPrice: binary && quantity < 0 ? 1 - upMark : upMark,
        unrealizedPnl: number(row.unsettled_pnl),
        leverage: number(row.leverage, 1),
      };
    })
    .filter((position) => position.quantity > 0);

  const mappedOrders = (Array.isArray(orders?.rows) ? orders.rows : []).map((order) => ({
    id: String(order.order_id ?? ""),
    symbol: String(order.symbol ?? ""),
    side: order.side === "SELL" ? "SELL" : "BUY",
    type: String(order.type ?? ""),
    price: number(order.price),
    quantity: number(order.quantity),
    filled: number(order.total_executed_quantity),
    status: String(order.status ?? ""),
    createdAt: number(order.created_time),
  }));

  const mappedFills = (Array.isArray(fills?.rows) ? fills.rows : []).map((fill) => ({
    id: String(fill.id ?? ""),
    symbol: String(fill.symbol ?? ""),
    side: fill.side === "SELL" ? "SELL" : "BUY",
    price: number(fill.executed_price),
    quantity: number(fill.executed_quantity),
    fee: number(fill.fee),
    ts: number(fill.executed_timestamp),
  }));

  return {
    capturedAt: new Date().toISOString(),
    account: accountId,
    network: NETWORK,
    balance: number(usdc?.holding),
    equity: number(perp?.account_value, number(perp?.total_collateral_value, number(usdc?.holding))),
    freeCollateral: perp?.free_collateral == null ? null : number(perp.free_collateral),
    unrealizedPnl: positions.reduce((total, position) => total + position.unrealizedPnl, 0),
    positions,
    orders: mappedOrders,
    fills: mappedFills,
  };
}

let cache = { at: 0, data: null, promise: null };

function getSnapshot(force = false) {
  if (!force && cache.data && Date.now() - cache.at < CACHE_MS) {
    return Promise.resolve(cache.data);
  }
  if (cache.promise) return cache.promise;
  cache.promise = buildSnapshot()
    .then((data) => {
      cache = { at: Date.now(), data, promise: null };
      return data;
    })
    .catch((error) => {
      cache.promise = null;
      throw error;
    });
  return cache.promise;
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(body);
}

function applyCors(request, response) {
  const origin = request.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader("access-control-allow-origin", origin);
    response.setHeader("access-control-allow-methods", "GET, OPTIONS");
    response.setHeader("access-control-allow-headers", "content-type");
    response.setHeader("vary", "origin");
  }
}

const server = createServer(async (request, response) => {
  applyCors(request, response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { error: "GET only" });
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  try {
    if (url.pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        network: NETWORK,
        account: mask(account),
        cli: BIN,
        snapshot: Boolean(cache.data),
      });
      return;
    }

    if (url.pathname === "/api/desk") {
      const snapshot = await getSnapshot(url.searchParams.get("fresh") === "1");
      sendJson(response, 200, snapshot);
      return;
    }

    sendJson(response, 404, { error: "not found" });
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "bridge error",
    });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`The Orderly Desk bridge · http://127.0.0.1:${PORT}`);
  console.log(`network: ${NETWORK} · cli: ${BIN}`);
  if (account) console.log(`account: ${mask(account)}`);
  else console.log("account: auto-resolve from `orderly auth-list`");
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
