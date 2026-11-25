# The Orderly Desk — agent walkthrough

> Testnet demo. The CLI runs on mainnet or testnet; this file uses testnet. It is the
> agent-oriented version of the `/walkthrough` page, generated from
> `src/content/agent-walkthrough.md`. Do not edit the copy in `public/` by hand.

- CLI: **orderly 2.2.4** (verified with 2.1.2)
- Live fleet: three hosted testnet agents on Workers; see `/dashboard`
- MCP alternative: **@orderly.network/trading-mcp 0.2.4**
- Last checked: 2026-11-25

## Live fleet

The showcase runs three autonomous BTC perp agents on Cloudflare Workers. Each has its
own testnet account and its own D1 decision log. The Worker uses the CLI's Rust
signing/request core compiled to WebAssembly. The dashboard is read-only. This file
is the manual CLI path: every agent action can be reproduced with the commands below,
and the same testnet key can be imported into the CLI for manual control.

## Rules

1. This demo trades testnet. The CLI supports mainnet; do not run these examples on
   mainnet without changing the network deliberately.
2. Hex account IDs must be quoted in a shell.
3. Pass `--account` explicitly; there is no default account.
4. Preview mutations with `--dry-run` before sending them.
5. Keep order sizes small. Check the symbol's minimum notional first.
6. The dashboard is read-only. It never signs or submits an order.

## Install and verify

```sh
curl -fsSL https://raw.githubusercontent.com/OrderlyNetwork/cli/master/install.sh | sh
orderly --version
# orderly 2.2.4
```

Output is compact JSON by default. Add `--pretty` for humans or `--csv` for
tables. `orderly schema` describes every command, including whether it mutates.

## Account setup

Skip this if `orderly auth-list --network testnet` already shows the account you
want to use.

```sh
orderly wallet-create --type EVM --network testnet

orderly wallet-register \
  --address <wallet-address> \
  --broker-id demo \
  --network testnet

orderly faucet-usdc <wallet-address> \
  --broker-id demo \
  --chain-id 421614 \
  --network testnet

orderly wallet-add-key \
  --address <wallet-address> \
  --broker-id demo \
  --scope read,trading \
  --network testnet

orderly auth-list --network testnet
```

The faucet is asynchronous. Use `orderly faucet-account --wait` for an existing
account, or check `account-balance` again after a few minutes.

```sh
export ACCOUNT=$(orderly auth-list --network testnet | jq -r '.[0].accountId')
orderly account-balance --account "$ACCOUNT" --network testnet
```

`auth-list` may contain more than one account. Select the intended `accountId`.

## Read the market

```sh
orderly symbols
orderly market-price PERP_ETH_USDC --network testnet
orderly market-orderbook PERP_ETH_USDC --network testnet
orderly market-trades PERP_ETH_USDC --network testnet
orderly kline PERP_ETH_USDC 1h --network testnet
orderly funding-rates --network testnet
orderly open-interest --network testnet
orderly system-status
```

Useful fields:

- `mark_price`, `index_price`
- `24h_open`, `24h_high`, `24h_low`, `24h_volume`
- `est_funding_rate`, `next_funding_time`
- `open_interest`

Testnet is thin. Wide spreads and long gaps between prints are normal.

## Trade with guardrails

```sh
orderly leverage PERP_ETH_USDC 3 --account "$ACCOUNT" --network testnet

# Preview first. This prints the exact signed body without sending it.
orderly order-place PERP_ETH_USDC BUY LIMIT 0.01 \
  --price 2100 \
  --dry-run \
  --account "$ACCOUNT" \
  --network testnet

# Rest a maker order.
orderly order-place PERP_ETH_USDC BUY LIMIT 0.01 \
  --price 2100 \
  --account "$ACCOUNT" \
  --network testnet

# Take liquidity.
orderly order-place PERP_ETH_USDC BUY MARKET 0.01 \
  --account "$ACCOUNT" \
  --network testnet

orderly order-list --status NEW --account "$ACCOUNT" --network testnet
orderly positions-list --account "$ACCOUNT" --network testnet
```

Attach a reduce-only TP/SL bracket. The triggers use the mark price:

```sh
orderly algo-order-place PERP_ETH_USDC SELL TP_SL 0.01 \
  --tp-trigger-price 2200 \
  --sl-trigger-price 2030 \
  --reduce-only \
  --account "$ACCOUNT" \
  --network testnet

orderly algo-order-list --account "$ACCOUNT" --network testnet
```

Close and clean up:

```sh
orderly positions-close PERP_ETH_USDC \
  --quantity 0.01 \
  --account "$ACCOUNT" \
  --network testnet

orderly order-cancel-all --symbol PERP_ETH_USDC \
  --account "$ACCOUNT" \
  --network testnet

orderly trades --size 5 --account "$ACCOUNT" --network testnet
```

If the position size changes, cancel and replace the TP/SL. An old bracket does
not automatically resize.

## Orderly Predict

Round symbols are permanent and generated per round. Always read the current
symbol; never construct or reuse one.

```sh
orderly predict-rounds --current --network testnet
SYM=$(orderly predict-rounds --current --network testnet | jq -r '.rows[0].symbol')

orderly predict-orderbook "$SYM" --network testnet
```

The matching engine holds the UP book. `down_asks` and `down_bids` are derived:
buying DOWN at `d` is a SELL of UP at `1 - d`.

```sh
# Buy five UP shares at the ask with an IOC order.
orderly predict-buy "$SYM" UP 5 \
  --price 0.53 \
  --type IOC \
  --account "$ACCOUNT" \
  --network testnet

orderly positions-list --product-type BINARY \
  --account "$ACCOUNT" \
  --network testnet

orderly predict-close "$SYM" --account "$ACCOUNT" --network testnet
orderly trades --product-type BINARY --size 5 \
  --account "$ACCOUNT" \
  --network testnet
```

Predict accepts LIMIT, IOC, and POST_ONLY only. There is no MARKET order. The
position is isolated margin. `average_open_price` can report `0` for an active
round; use the fill price from `trades` or `cost_position / quantity`. If you
hold to expiry, the round settles at 0 or 1 automatically.

## MCP alternative

If the agent client speaks MCP, use the typed wrapper instead of shelling out.
It is stdio-only, runs the CLI as a subprocess, and never sees the keys.

```sh
npm install -g @orderly.network/trading-mcp
orderly-trading-mcp doctor
```

Minimal client config:

```json
{
  "mcp": {
    "servers": {
      "orderly-trading": {
        "command": ["npx", "-y", "@orderly.network/trading-mcp"],
        "environment": {
          "ORDERLY_BIN": "/path/to/orderly",
          "ORDERLY_MCP_ACCOUNT": "<account-id>"
        }
      }
    }
  }
}
```

Profiles: `core` (16 tools), `predict` (22), `algo` (19), `all` (68), `full` (71).
Set `ORDERLY_MCP_READ_ONLY=1` to disable every mutation and
`ORDERLY_MCP_ALLOW_MAINNET=0` to block mainnet mutations.

Full guide: `mcp.md` next to this file. The published versions are in
`versions.json`; npm is the install source for the latest MCP release.

## More

- Human walkthrough: `/walkthrough`
- Generated CLI reference: `reference.md`
- Agent desk (read-only): `/dashboard`
- Version data: `versions.json`
