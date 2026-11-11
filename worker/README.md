# Orderly Desk Agents

Cloudflare Worker that runs three autonomous testnet BTC-perp agents, writes decisions
to D1, and exposes a read-only API for the dashboard.

## Runtime

```
cron (*/2 * * * *)
  → due agents (intervals 4 / 6 / 8 minutes)
  → market data from Orderly public REST
  → deterministic strategy (@orderly-desk/strategies)
  → AI risk veto
  → WASM SDK (CLI Rust core) signed order (testnet)
  → D1: runs, decisions, snapshots, recaps
  → GET /agents, /decisions, /runs, /recaps, /desk
```

The Worker does not reimplement signing. It imports `@orderly.network/orderly`,
generated from the CLI's `bindings/js` crate and compiled with `wasm-bindgen`.
It does not execute the CLI binary; Workers cannot spawn native processes.
The CLI remains the local control plane and the reference implementation.

## API

| Route | Purpose |
| --- | --- |
| `GET /health` | network, account count, AI/trading flags |
| `GET /agents` | live fleet state and positions |
| `GET /desk` | aggregated fleet account view |
| `GET /decisions?limit=` | action log with reasons and CLI equivalents |
| `GET /runs?limit=` | every scheduled check, including holds/errors |
| `GET /recaps?limit=` | AI-written daily desk recaps |

All routes are read-only. There is no order-entry endpoint.

## Local

```bash
# From the repository root:
pnpm setup:agents       # 3 testnet accounts + API keys + faucet
pnpm worker:db:local    # apply worker/migrations/0001_init.sql
pnpm worker:dev         # http://127.0.0.1:8788, --test-scheduled

# Trigger one scheduled pass:
curl "http://127.0.0.1:8788/__scheduled?cron=*/2+*+*+*+*"

# Or keep a local cron running from the repository root:
pnpm worker:tick
```

Secrets are in `worker/.dev.vars` (gitignored). `AGENTS_CONFIG_B64` contains the three
testnet account IDs and Ed25519 secrets. Never commit it.

## Strategies

All three agents trade `PERP_BTC_USDC` on separate accounts.

| Agent | Logic | Interval |
| --- | --- | --- |
| Momentum | EMA 9/21 spread, RSI filter, 1.6 ATR stop | 4 min |
| Mean Reversion | Bollinger 20/2 fade, RSI filter, midline exit | 6 min |
| Breakout | 20-bar range breakout, ATR filter, EMA20 exit | 8 min |

Risk limits: one position per account, `MAX_NOTIONAL_USDC = 200`, minimum quantity
`0.001 BTC`, leverage set to 3x before entries, no trading if the account balance is
below 50 USDC. Every run is serialized with a D1 lock. The dashboard shows a $1,000
sleeve per agent; extra faucet balance is treated as unallocated reserve.

## AI risk veto and daily recap

The production environment enables Workers AI and uses DeepSeek V4.1 Flash
(`@cf/deepseek-ai/deepseek-v4.1-flash-1017`):

```toml
[env.production.ai]
binding = "AI"
```

Two jobs, both outside trade selection:

1. **Risk veto** — when a strategy proposes an entry, the model receives the side,
   quantity, market snapshot, indicators, rule reason, and current position. It must
   return strict JSON `{ "approve": boolean, "reason": string }`. A rejection is stored
   as a `VETO LONG` / `VETO SHORT` decision and no order is signed. If the model errors
   or returns invalid JSON, the entry is blocked (fail closed).
2. **Daily recap** — after UTC midnight the cron generates one recap for the previous
   day from D1 decisions and equity snapshots. It is stored in `recaps` and served on
   `/recaps`.

Close orders are not vetoed; they reduce risk. Commentary still runs on opens and
closes after approval. Without the `AI` binding, entries follow the rules and the
dashboard labels the source as `rules`. V4.1 Flash is a paid-plan model; local dev
intentionally omits the AI binding so it does not require a remote session.

## Deploy

```bash
pnpm dlx wrangler login
pnpm dlx wrangler d1 create orderly-desk-agents
# Put the returned id in both [[d1_databases]] blocks in worker/wrangler.toml.
pnpm worker:db:remote
pnpm exec wrangler secret put AGENTS_CONFIG_B64 --config worker/wrangler.toml --env production
pnpm worker:deploy
pnpm worker:tail
```

Set `SITE_ORIGIN` in `worker/wrangler.toml` to the Pages origin. The current value
includes localhost, the Vite preview, and `https://orderly-desk.pages.dev`.

## Safety

- Testnet only: `ORDERLY_NETWORK=testnet` and the API base is testnet.
- Keys are testnet-only Worker secrets; the browser never receives them.
- No withdraw, transfer, or wallet-management commands in the Worker.
- No public write endpoint. Manual intervention uses the CLI.
- Orderly testnet can return 502; a failed run is recorded and the next cron retries.
