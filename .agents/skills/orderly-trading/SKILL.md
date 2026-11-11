---
name: orderly-trading
description: Read Orderly perps and generate momentum, mean-reversion, or breakout signals through the local CLI.
version: 1.0.0
platforms: [macos, linux, windows]
metadata:
  tags: [trading, orderly, perps, cli]
  category: finance
  requires_toolsets: [terminal]
---

# Orderly Trading

Use the `orderly` CLI for every market read and every order. The helper scripts
only read data and print a signal; they never place, edit, or close an order.

## When to use

- The user wants to inspect or trade Orderly perps.
- The user asks for a momentum, mean-reversion, or breakout signal on
  `PERP_BTC_USDC` or another perps symbol.
- The user wants to automate a testnet strategy with an agent.

## Prerequisites

1. `orderly --version` succeeds.
2. The user has imported an API key:
   `orderly auth-list --network testnet`
3. Prefer `--network testnet` unless the user explicitly asks for mainnet.
4. Symbols are uppercase and use the perps format:
   `PERP_BTC_USDC`, not `BTC`.

## Procedure

1. Check the account and existing position.

   ```bash
   orderly auth-list --network testnet
   orderly positions-list --product-type PERP --network testnet
   ```

2. Generate a signal. This is read-only.

   ```bash
   node .agents/skills/orderly-trading/scripts/signal.mjs \
     --strategy momentum \
     --symbol PERP_BTC_USDC \
     --network testnet \
     --pretty
   ```

   Strategies: `momentum`, `mean-reversion`, `breakout`.

3. Read the JSON. It contains `signal`, `indicators`, `position`, and the exact
   CLI commands for an `open` or `close`.

4. Before any write, confirm with the user:
   - network,
   - symbol,
   - side,
   - quantity,
   - notional,
   - whether a position already exists.

5. Execute only through the CLI:

   ```bash
   orderly leverage PERP_BTC_USDC 3 --account <id> --network testnet
   orderly order-place PERP_BTC_USDC BUY MARKET 0.002 --account <id> --network testnet
   orderly positions-close PERP_BTC_USDC --account <id> --network testnet
   ```

6. Close the position or leave it intentionally. Do not leave orphaned orders.

## Risk rules

- Default to testnet. Mainnet requires explicit confirmation.
- One position per account.
- Keep notional at or below 200 USDC unless the user says otherwise.
- Use 3x leverage unless the user says otherwise.
- Never print API keys, private keys, or the contents of `.dev.vars`.
- Never use `orderly auth-export-key` in an agent session.
- If `positions-list` shows an existing position, do not open another one.

## Pitfalls

- Quote hex account IDs in a shell: `--account "0x..."`.
- Negative numbers look like flags; quote them or pass them as the final
  argument.
- Public market reads do not need `--account`; positions and orders do.
- The CLI uses the OS keychain. If it reports no key, the user must import one;
  do not ask for the key in chat.

## Verification

- `orderly positions-list --product-type PERP --network testnet` shows the
  expected position or no position.
- `orderly order-list --status NEW --account <id> --network testnet` shows any
  resting orders.
- The signal JSON was produced before the write, and the executed command
  matches the confirmed side and quantity.
