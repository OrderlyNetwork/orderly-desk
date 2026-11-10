# Orderly Trading MCP

> Generated from `src/content/agent-mcp.md`. The human-facing version is at
> `/walkthrough#automate`; the live dashboard is read-only and is not an MCP
> client.

`@orderly.network/trading-mcp` is a stdio MCP server that gives an AI client typed access to
the same trading surface as the `orderly` CLI.

```
MCP client ⇄ stdio ⇄ orderly-trading-mcp ⇄ execFile ⇄ orderly CLI ⇄ Orderly API
                                                        ↳ OS keychain
```

The MCP process never sees private keys and never signs. It discovers the CLI
schema, validates arguments, applies policy, and runs the CLI as a subprocess.

- npm: 0.2.3 — https://www.npmjs.com/package/@orderly.network/trading-mcp
- Official MCP registry: io.github.OrderlyNetwork/trading-mcp
  — listing 0.2.1 — https://registry.modelcontextprotocol.io/
- CLI: orderly 2.1.2 (this showcase was verified with 2.1.2)
- Last checked: 2026-11-10

The registry listing can lag npm. Install from npm for the latest release.

## Requirements

- Node.js >= 20
- Orderly CLI >= 2.0.1 (2.1.2 recommended)
- A wallet/API key already registered in the CLI (`orderly auth-list`)

The CLI binary must be discoverable. GUI MCP clients often start with a minimal
`PATH`, so set `ORDERLY_BIN` explicitly in the client config.

## Install

```sh
npm install -g @orderly.network/trading-mcp
orderly-trading-mcp doctor
```

`doctor` prints CLI candidates, the selected binary, the schema version, the
active profile, the network, and the accounts visible in the keychain. Set
`ORDERLY_BIN` if the selected binary is not the one you expect:

```sh
ORDERLY_BIN=/path/to/orderly orderly-trading-mcp doctor
```

## Client config

OpenCode (`opencode.json`, current `mcp.servers` form):

```json
{
  "mcp": {
    "servers": {
      "orderly-trading": {
        "command": ["npx", "-y", "@orderly.network/trading-mcp"],
        "environment": {
          "ORDERLY_BIN": "/path/to/orderly",
          "ORDERLY_MCP_ACCOUNT": "<account-id>",
          "ORDERLY_MCP_TIMEOUT_MS": "180000"
        },
        "timeout": { "execution": 190000 }
      }
    }
  }
}
```

Claude Code / Cursor (`.mcp.json` or `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "orderly-trading": {
      "command": "npx",
      "args": ["-y", "@orderly.network/trading-mcp"],
      "env": {
        "ORDERLY_BIN": "/path/to/orderly",
        "ORDERLY_MCP_ACCOUNT": "<account-id>"
      }
    }
  }
}
```

## Tools and profiles

The default `core` profile exposes 16 tools:

| Tool | Kind | Purpose |
| --- | --- | --- |
| `auth_list` | read | Stored accounts (public IDs only) |
| `account_balance` | read | Token holdings |
| `positions_list` | read | Positions, account value, margin |
| `order_list` | read | Working orders |
| `market_price` | read | Mark/index/24h stats |
| `market_orderbook` | read | Depth and best bid/ask |
| `kline` | read | Candles |
| `order_place` | write | Place a perpetual order |
| `order_cancel` | write | Cancel one order |
| `order_cancel_all` | write | Cancel all orders |
| `positions_close` | write | Reduce-only market close |
| `leverage_get` | read | Read current leverage |
| `leverage_set` | write | Change leverage |
| `orderly_commands` / `orderly_read` / `orderly_run` | meta | Full CLI coverage under policy |

Profiles:

| `ORDERLY_MCP_PROFILE` | Tools |
| --- | --- |
| `core` (default) | 16 |
| `predict` | 22 (adds all six Predict tools) |
| `algo` | 19 (adds TP/SL tools) |
| `all` | 68 (every reviewed read + allowed mutation) |
| `full` | 71 (`all` + withdraw/faucet) |

Everything else is reached through `orderly_commands` / `orderly_read` /
`orderly_run`. `orderly_run` can mutate and is annotated non-read-only; use
`orderly_read` for reads.

## Safety model

| Variable | Default | Effect |
| --- | --- | --- |
| `ORDERLY_BIN` | auto | Explicit CLI path; if set and invalid, no fallback |
| `ORDERLY_MCP_PROFILE` | `core` | Dedicated tool surface |
| `ORDERLY_MCP_READ_ONLY` | off | Set `1` to disable every mutation |
| `ORDERLY_MCP_NETWORK` | CLI config | Default network |
| `ORDERLY_MCP_ACCOUNT` | auto | Default account when a call omits `account` |
| `ORDERLY_MCP_ALLOW_MAINNET` | `true` | Set `0` to block mainnet mutations |
| `ORDERLY_MCP_ALLOW_UNKNOWN_READS` | off | Keep reads fail-closed |
| `ORDERLY_MCP_STRICT_PROFILE` | off | Restrict `orderly_run` to the profile |
| `ORDERLY_MCP_TIMEOUT_MS` | `30000` | Per-call timeout |
| `ORDERLY_MCP_MAX_OUTPUT` | `65536` | Max characters per call |
| `ORDERLY_MCP_DEBUG` | off | Log argv/timing to stderr |

Key rules:

- Wallet, auth, key-import/export, and `auth-export-key` commands are blocked in
  every profile, including `orderly_run`.
- Mutations are allowlisted and serialized.
- Reads are allowlisted; new read commands stay hidden until reviewed.
- No shell: the CLI is spawned with an argv array.
- No automatic retries for mutations.
- stdio only. There is no HTTP transport. Do not expose a trading MCP directly
  to the internet.

For a read-only agent, set both in the client config:

```sh
ORDERLY_MCP_READ_ONLY=1 ORDERLY_MCP_ALLOW_MAINNET=0 orderly-trading-mcp doctor
```

The `doctor` command is a one-shot diagnostic; the server itself stays on stdio.

## This showcase

The showcase runs three hosted testnet agents on Cloudflare Workers. They use direct
Orderly REST signing, not the MCP. The dashboard is a read-only view of the fleet and
public markets.

The MCP is the local path for an agent client that wants the CLI surface as typed
tools. It is not used by the hosted fleet. Every order in the manual walkthrough was
placed through the CLI.

More:

- npm: https://www.npmjs.com/package/@orderly.network/trading-mcp
- Registry: https://registry.modelcontextprotocol.io/
- Source: https://github.com/OrderlyNetwork/trading-mcp
- Agent walkthrough: `walkthrough.md`
- CLI reference: `reference.md`
