#!/usr/bin/env bash
#
# A small, explicit testnet sequence for a live demo. It places real (but
# worthless) testnet orders. Nothing here touches mainnet.
#
#   CONFIRM=1 ORDERLY_ACCOUNT=0x... pnpm demo:trade
#   CONFIRM=1 DRY_RUN=1 ORDERLY_ACCOUNT=0x... pnpm demo:trade   # print only
#   CONFIRM=1 CLOSE=1 ORDERLY_ACCOUNT=0x... pnpm demo:trade     # clean up after
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_BIN="$SCRIPT_DIR/../../cli/target/release/orderly"
if [ -x "$DEFAULT_BIN" ]; then
  DEFAULT_BIN="$(realpath "$DEFAULT_BIN")"
fi
BIN="${ORDERLY_BIN:-$DEFAULT_BIN}"
if [ ! -x "$BIN" ]; then
  BIN="orderly"
fi

NETWORK="${ORDERLY_NETWORK:-testnet}"
SYMBOL="${SYMBOL:-PERP_ETH_USDC}"
SIZE="${SIZE:-0.01}"
ACCOUNT="${ORDERLY_ACCOUNT:-}"
DRY_RUN="${DRY_RUN:-0}"
CLOSE="${CLOSE:-0}"

if [ "${CONFIRM:-}" != "1" ]; then
  cat >&2 <<'EOF'
This places real testnet orders. Set CONFIRM=1 to continue:

  CONFIRM=1 ORDERLY_ACCOUNT=0x... pnpm demo:trade

Use DRY_RUN=1 to print the commands without sending them.
EOF
  exit 1
fi

if [ -z "$ACCOUNT" ]; then
  echo "ORDERLY_ACCOUNT is required (run: orderly auth-list --network $NETWORK)." >&2
  exit 1
fi

if [ "$NETWORK" != "testnet" ]; then
  echo "Only testnet is supported by this demo script." >&2
  exit 1
fi

run() {
  printf '\n$ %s\n' "$*"
  if [ "$DRY_RUN" != "1" ]; then
    "$@"
  fi
}

read_mark() {
  "$BIN" market-price "$SYMBOL" --network "$NETWORK" | jq -r '.mark_price'
}

MARK="${MARKET_PRICE:-}"
if [ -z "$MARK" ]; then
  MARK="$(read_mark)"
fi

LIMIT_PRICE="$(jq -n --argjson mark "$MARK" '($mark * 0.97 * 100 | round) / 100')"
TP_PRICE="$(jq -n --argjson mark "$MARK" '($mark * 1.04 * 100 | round) / 100')"
SL_PRICE="$(jq -n --argjson mark "$MARK" '($mark * 0.96 * 100 | round) / 100')"

echo "The Orderly Desk · demo sequence"
echo "network=$NETWORK symbol=$SYMBOL size=$SIZE"
echo "mark=$MARK limit=$LIMIT_PRICE tp=$TP_PRICE sl=$SL_PRICE"
if [ "$DRY_RUN" = "1" ]; then
  echo "mode=dry-run (no orders will be sent)"
fi

run "$BIN" market-price "$SYMBOL" --network "$NETWORK"
run "$BIN" leverage "$SYMBOL" 3 --account "$ACCOUNT" --network "$NETWORK"
run "$BIN" order-place "$SYMBOL" BUY LIMIT "$SIZE" --price "$LIMIT_PRICE" --account "$ACCOUNT" --network "$NETWORK"
run "$BIN" order-list --status NEW --account "$ACCOUNT" --network "$NETWORK"
run "$BIN" order-place "$SYMBOL" BUY MARKET "$SIZE" --account "$ACCOUNT" --network "$NETWORK"
run "$BIN" positions-list --account "$ACCOUNT" --network "$NETWORK"
run "$BIN" algo-order-place "$SYMBOL" SELL TP_SL "$SIZE" --tp-trigger-price "$TP_PRICE" --sl-trigger-price "$SL_PRICE" --reduce-only --account "$ACCOUNT" --network "$NETWORK"
run "$BIN" algo-order-list --account "$ACCOUNT" --network "$NETWORK"

if [ "$DRY_RUN" != "1" ]; then
  sleep 2
fi

if [ "$CLOSE" = "1" ]; then
  run "$BIN" positions-close "$SYMBOL" --account "$ACCOUNT" --network "$NETWORK"
  run "$BIN" order-cancel-all --symbol "$SYMBOL" --account "$ACCOUNT" --network "$NETWORK"
fi

echo
echo "Done. Open the desk to watch the account: http://localhost:5173/dashboard"
