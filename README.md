# The Orderly Desk

[![CLI release](https://img.shields.io/github/v/release/OrderlyNetwork/cli)](https://github.com/OrderlyNetwork/cli/releases)
[![trading-mcp](https://img.shields.io/npm/v/%40orderly.network%2Ftrading-mcp)](https://www.npmjs.com/package/@orderly.network/trading-mcp)

An agentic trading showcase for [Orderly Network](https://orderly.network), built around the [Orderly CLI](https://github.com/OrderlyNetwork/cli).

Three autonomous agents trade BTC perps on **testnet**. The agents run on Cloudflare Workers, sign Orderly REST requests directly, and write every decision to D1. The dashboard is read-only. The CLI is the control plane, and every agent action has a copyable CLI equivalent.

The CLI itself runs on **mainnet or testnet**. The demo chooses testnet only so the agents can trade without real funds.

## Live

- Site: https://orderly-desk.pages.dev
- Agents API: https://orderly-desk-agents.orderlynetwork.workers.dev
- Health: https://orderly-desk-agents.orderlynetwork.workers.dev/health

The production Worker cron runs every two minutes. The Pages build uses the Worker URL in `VITE_AGENTS_API`.

## What is in here

- **Live agent desk** — three Worker-run strategies, equity, positions, last decision, next run, and a read-only activity feed.
- **Perps dashboard** — live/mainnet reference candles, order book, trades, funding, open interest. No Predict card in the main dashboard.
- **CLI walkthrough** — setup, market reads, orders, TP/SL, Predict, automation, troubleshooting, from real testnet output.
- **Agent docs** — `/walkthrough.md`, `/mcp.md`, `/reference.md`, `/llms.txt`, `/versions.json`.
- **Trading MCP guide** — the local stdio path for AI clients that prefer typed tools over shelling out.

## Agent architecture

```
Cloudflare Cron (every 2m)
  → Worker strategy (momentum / mean-reversion / breakout)
  → Orderly REST (Ed25519 signed in the Worker)
  → D1 (runs, decisions, snapshots)
  → read-only Worker API
  → static dashboard
```

Each agent has its own testnet account, all trading `PERP_BTC_USDC`:

| Agent | Strategy | Interval | Account |
| --- | --- | --- | --- |
| Momentum | EMA 9/21 + RSI + ATR stop | 4 min | dedicated testnet |
| Mean Reversion | Bollinger 20/2 + RSI | 6 min | dedicated testnet |
| Breakout | 20-bar range + ATR filter | 8 min | dedicated testnet |

Each agent is displayed as a **$1,000 sleeve**. The extra faucet balance on the Momentum account is an unallocated reserve, shown separately in the fleet summary rather than making one agent look larger than the others. Clicking an agent card opens/focuses the desk, and the Orderly dashboard link deep-links to that account.

Signals are deterministic. Workers AI can add a one-sentence commentary/risk explanation when the `AI` binding is enabled; without it the rule text is used and the dashboard labels the source as `rules`. The agent never changes the pre-decided action based on the LLM.

Key custody is deliberately split:

- **Local CLI** — wallet and API keys in the OS keychain.
- **Hosted testnet agents** — dedicated testnet API keys in Worker secrets. The browser never sees them.
- **Manual control** — import the same testnet key into the CLI (`orderly auth-import`) for `positions-list`, `order-cancel-all`, `positions-close`, etc.

The hosted agents do **not** run the Rust CLI binary; Workers cannot exec native binaries. They implement the same Orderly signing protocol in TypeScript. The CLI remains the reference implementation and control plane.

## Stack

| Layer | Choice |
| --- | --- |
| UI | React 19 + TypeScript 5.9, Vite 7, Tailwind CSS 4 |
| Charts | TradingView `lightweight-charts` |
| Market data | Orderly public REST + WebSocket |
| Agents | Cloudflare Workers + D1 + cron |
| Signing | `@noble/ed25519`, `@scure/base` |
| Local desk | Node bridge → `orderly` CLI (read-only) |
| Deploy | Cloudflare Pages (site) + Workers (agents) |

## Requirements

- Node 22+ and pnpm 12+
- The latest Orderly CLI release (`orderly` on `PATH`, or a sibling checkout at `../cli`)
- `jq` for the demo script and walkthrough snippets
- Optional: Cloudflare account for deploying the Worker
- Optional: Workers AI binding for LLM commentary

## Run the site and agents locally

```bash
pnpm install

# 1. Provision three dedicated testnet accounts and fund them via faucet.
#    Writes .secrets/testnet-agents.json and .dev.vars (both gitignored).
pnpm setup:agents

# 2. Local D1 schema.
pnpm worker:db:local

# 3. Worker on :8788 with the test scheduled handler.
pnpm worker:dev

# 4. In another terminal, drive the local cron (Wrangler does not auto-run it).
pnpm worker:tick

# 5. Frontend on :5173.
pnpm dev
```

The frontend uses `http://127.0.0.1:8788` automatically in dev. `pnpm worker:tick` hits the dev scheduled route every two minutes; you can also trigger one pass manually:

```bash
curl "http://127.0.0.1:8788/__scheduled?cron=*/2+*+*+*+*"
```

The agents are live in the UI after a few seconds. The production Worker cron runs
every two minutes without the helper.

### Agent secrets

`pnpm setup:agents` creates three dedicated testnet accounts with broker `demo`, registers Ed25519 API keys, requests faucet USDC, and writes a base64-encoded `AGENTS_CONFIG_B64` secret to `.dev.vars` and `worker/.dev.vars`. Do not commit either file. The full provisioning record (including wallet keys) is in `.secrets/testnet-agents.json`, mode 0600.

To import one of the testnet keys into the CLI for manual control:

```bash
orderly auth-import <private-key> --account <account-id> --network testnet
orderly positions-list --account <account-id> --network testnet
orderly order-cancel-all --symbol PERP_BTC_USDC --account <account-id> --network testnet
```

Do not paste keys into chat or commit them. This is testnet-only; do not reuse these keys on mainnet.

## Local CLI bridge (optional)

The old read-only bridge still exists for local CLI checks:

```bash
export ORDERLY_ACCOUNT=0x...
pnpm bridge   # 127.0.0.1:8791
```

It only runs `account-balance`, `positions-list`, `order-list`, and `trades`. The public dashboard uses the Worker API, not this bridge.

## Demo sequence

```bash
CONFIRM=1 ORDERLY_ACCOUNT=0x... pnpm demo:trade
CONFIRM=1 DRY_RUN=1 ORDERLY_ACCOUNT=0x... pnpm demo:trade
CONFIRM=1 CLOSE=1 ORDERLY_ACCOUNT=0x... pnpm demo:trade
```

This is a manual CLI sequence, testnet-only and guarded by `CONFIRM=1`.

## Deploy

### Static site (Cloudflare Pages)

Build with the Worker URL:

```bash
VITE_AGENTS_API=https://orderly-desk-agents.<account>.workers.dev pnpm build
pnpm dlx wrangler pages deploy dist --project-name orderly-desk
```

Or connect the repo in the Pages dashboard:

- Build: `pnpm build`
- Output: `dist`
- Node: 22 (`.node-version`)
- pnpm: `12.18.0` if needed
- Env: `VITE_AGENTS_API=https://orderly-desk-agents.<account>.workers.dev`
- Optional: `SITE_URL=https://your-domain` for absolute `llms.txt` links

`public/_headers` allows `https://*.workers.dev` in `connect-src`. If you use a custom API domain, add it there. `_redirects` handles SPA routing. After the first deploy, point `og:image` in `index.html` at the absolute domain if link previews matter.

### Agents Worker

```bash
# Once, with Cloudflare auth
pnpm dlx wrangler login
pnpm dlx wrangler d1 create orderly-desk-agents
# Put the returned database_id into BOTH [[d1_databases]] blocks in worker/wrangler.toml.
pnpm worker:db:remote
pnpm exec wrangler secret put AGENTS_CONFIG_B64 --config worker/wrangler.toml --env production
# Paste the value from .dev.vars when prompted. It is never printed by the script.
pnpm worker:deploy
```

Set `SITE_ORIGIN` in `worker/wrangler.toml` to the Pages origin (it already includes `https://orderly-desk.pages.dev`; adjust if your project name differs).

The production environment already enables Workers AI (`[env.production.ai]`). If your
Cloudflare plan does not include Workers AI, remove that block; the agents fall back to
the deterministic rule text and the UI shows `rules`. Local dev intentionally has no AI
binding, so it does not need a remote session.

The Worker exposes only read endpoints: `/health`, `/agents`, `/desk`, `/decisions`, `/runs`. There is no write endpoint and no browser order entry.

## Agent-readable docs

Generated into `public/`:

| File | Purpose |
| --- | --- |
| `/walkthrough.md` | Agent quickstart for the CLI path |
| `/mcp.md` | Trading MCP guide |
| `/reference.md` | All 80 CLI commands from `orderly schema` |
| `/llms.txt` | Index, guardrails, versions |
| `/versions.json` | CLI, npm MCP, and registry versions |

```bash
pnpm sync:versions
pnpm gen:agent-docs
```

Both run as part of `pnpm build`, with committed fallbacks if the network is unavailable.

## Versions

| Value | Source |
| --- | --- |
| CLI | GitHub latest release |
| trading-mcp | npm dist-tag `latest` |
| MCP registry | official registry entry |
| verifiedWith | `src/data/commands.json` for the captured walkthrough |
| showcase | local `package.json` |

The UI shows the latest CLI/MCP versions; the walkthrough labels captured output with `verifiedWith`. The npm MCP and official registry can lag each other; install from npm for the latest package. The current registry listing may lag npm; both are shown in `/mcp.md` and `/versions.json`.

## Trading MCP

The MCP is the local stdio path for AI clients. It is not used by the hosted Worker fleet.

```bash
npm install -g @orderly.network/trading-mcp
orderly-trading-mcp doctor
```

The default `core` profile exposes 16 tools; `predict`, `algo`, `all`, and `full` widen the reviewed surface. `ORDERLY_MCP_READ_ONLY=1` disables mutations; `ORDERLY_MCP_ALLOW_MAINNET=0` blocks mainnet writes. See `/mcp.md`.

## Generated files and layout

```
src/                 React site (pages, components, lib, data)
worker/              Cloudflare Worker agents + D1 migrations
server/bridge.mjs    local read-only CLI bridge
scripts/             setup accounts, versions, agent docs, demo, tick, snapshot
public/              static assets + generated markdown
```

Generated: `src/data/commands.json`, `src/data/versions.json`, `src/data/desk-snapshot.json`, `public/*.md`, `public/llms.txt`, `public/versions.json`.

## Notes

- The testnet order book is thin and the testnet API occasionally returns 502. The dashboard defaults market data to mainnet reference and keeps the agent fleet on testnet; if testnet is down, agent cards show a short upstream error and retry on the next cron.
- The dashboard is read-only. It never signs or submits an order.
- Predict is no longer on the main dashboard; it remains a CLI walkthrough chapter.
- The public site is built with `VITE_AGENTS_API` pointing at the deployed Worker; rebuild if the Worker URL changes.
- The hosted agents use testnet-only keys in Worker secrets. Do not reuse them on mainnet.
- Chart rendering is by TradingView Lightweight Charts (Apache 2.0). The Orderly name and logo remain Orderly Network's brand assets.
