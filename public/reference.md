# Orderly CLI reference

Generated from `orderly schema` v2.1.2. Orderly Network CLI.

This file is generated from `src/data/commands.json`; do not edit it by hand.

## Global flags

- `--network <network>` — Network: mainnet or testnet
- `--csv` — Output as CSV instead of JSON (for list data)
- `--pretty` — Pretty-print JSON output (2-space indent)

## Commands

### `account-balance`

Get account balances

- **Usage:** `orderly account-balance [--account <id>]`
- **Mutates:** no

**Flags:**

- `--account <id>` — Account ID (auto-resolves if single account)

### `account-info`

Get account information

- **Usage:** `orderly account-info [--account <id>]`
- **Mutates:** no

**Flags:**

- `--account <id>` — Account ID (auto-resolves if single account)

### `account-limits`

Get margin requirements and position limits.
  imr_factor: per-symbol factor used in initial margin calculation — IMR_i = max(1/max_leverage, base_imr, imr_factor * |notional|^0.8)
  max_notional: max position size in USD per symbol
  base_imr / base_mmr: minimum initial/maintenance margin ratios (shown with --symbol)
  base_mmr: threshold for liquidation — MMR_i = max(base_mmr, (base_mmr/base_imr) * imr_factor * |notional|^0.8)

- **Usage:** `orderly account-limits [--symbol <symbol>] [--account <id>]`
- **Mutates:** no

**Flags:**

- `--symbol <symbol>` — Show limits for one symbol (includes base_imr, base_mmr, order rules)
- `--account <id>` — Account ID (auto-resolves if single account)

### `account-liquidations`

Get account liquidation history

- **Usage:** `orderly account-liquidations [--symbol <symbol>] [--page <n>] [--size <n>] [--account <id>]`
- **Mutates:** no

**Flags:**

- `--symbol <symbol>` — Filter by symbol
- `--page <n>` — Page number (default: 1)
- `--size <n>` — Page size (default: 25)
- `--account <id>` — Account ID (auto-resolves if single account)

### `account-statistics`

Get account trading statistics (volume, fees, days since registration)

- **Usage:** `orderly account-statistics [--account <id>]`
- **Mutates:** no

**Flags:**

- `--account <id>` — Account ID (auto-resolves if single account)

### `algo-order-cancel`

Cancel an algo order

- **Usage:** `orderly algo-order-cancel <order-id> [--symbol <symbol>] [--dry-run] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `order_id` (required)
- `--symbol <symbol>` — Symbol of the order (auto-fetched if not provided)
- `--dry-run` — Print the request payload without signing or sending it
- `--account <id>` — Account ID (auto-resolves if single account)

### `algo-order-cancel-all`

Cancel all algo orders

- **Usage:** `orderly algo-order-cancel-all [--symbol <symbol>] [--algo-type <type>] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `--symbol <symbol>` — Filter by symbol (optional)
- `--algo-type <type>` — Filter by algo type: STOP, TP_SL, TRAILING_STOP, BRACKET
- `--account <id>` — Account ID (auto-resolves if single account)

### `algo-order-cancel-by-client-id`

Cancel an algo order by client order ID

- **Usage:** `orderly algo-order-cancel-by-client-id <client-order-id> <symbol> [--account <id>]`
- **Mutates:** yes

**Flags:**

- `client_order_id` (required)
- `symbol` (required)
- `--account <id>` — Account ID (auto-resolves if single account)

### `algo-order-edit`

Edit a pending algo order (only specify what to change: price, quantity, trigger-price, callback-rate)

- **Usage:** `orderly algo-order-edit <order-id> [--symbol <symbol>] [--price <price>] [--quantity <quantity>] [--trigger-price <price>] [--callback-rate <rate>] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `order_id` (required)
- `--symbol <symbol>` — Symbol of the order (auto-fetched if not provided)
- `--price <price>` — New order price
- `--quantity <quantity>` — New order quantity
- `--trigger-price <price>` — New trigger price
- `--callback-rate <rate>` — New callback rate: 1-15 for percentage, or 0.01-0.15 as decimal
- `--account <id>` — Account ID (auto-resolves if single account)

### `algo-order-get`

Get details for a specific algo order

- **Usage:** `orderly algo-order-get <order-id> [--symbol <symbol>] [--account <id>]`
- **Mutates:** no

**Flags:**

- `order_id` (required)
- `--symbol <symbol>` — Symbol of the order (auto-fetched if not provided)
- `--account <id>` — Account ID (auto-resolves if single account)

### `algo-order-list`

List algo orders (defaults to open/active orders)

- **Usage:** `orderly algo-order-list [--symbol <symbol>] [--status <status>] [--all] [--algo-type <type>] [--page <n>] [--size <n>] [--account <id>]`
- **Mutates:** no

**Flags:**

- `--symbol <symbol>` — Filter by symbol
- `--status <status>` — Filter by status. Default: INCOMPLETE
- `--all` — Show all orders (overrides default INCOMPLETE filter)
- `--algo-type <type>` — Filter by algo type: STOP, TP_SL, POSITIONAL_TP_SL, TRAILING_STOP, BRACKET
- `--page <n>` — Page number (default: 1)
- `--size <n>` — Page size (default: 25, max: 500)
- `--account <id>` — Account ID (auto-resolves if single account)

### `algo-order-place`

Place an algo order.

Valid algoTypes and their required flags:
  STOP             --trigger-price
  TP_SL            --tp-trigger-price and/or --sl-trigger-price
  POSITIONAL_TP_SL --tp-trigger-price and/or --sl-trigger-price (quantity must be 0)
  TRAILING_STOP    --callback-rate (1-15%)
  BRACKET          --trigger-price + --tp-trigger-price and/or --sl-trigger-price

Valid sides: BUY, SELL

- **Usage:** `orderly algo-order-place <symbol> <side> <algoType> <quantity> [--trigger-price <price>] [--callback-rate <rate>] [--price <price>] [--tp-trigger-price <price>] [--tp-price <price>] [--sl-trigger-price <price>] [--sl-price <price>] [--reduce-only] [--client-order-id <id>] [--dry-run] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `symbol` (required)
- `side` (required)
- `algo_type` (required)
- `quantity` (required)
- `--trigger-price <price>` — Trigger price (required for STOP and BRACKET)
- `--callback-rate <rate>` — Trailing callback rate: 1-15 for percentage, or 0.01-0.15 as decimal. Required for TRAILING_STOP
- `--price <price>` — Order price (for limit orders)
- `--tp-trigger-price <price>` — Take-profit trigger price (for TP_SL/POSITIONAL_TP_SL/BRACKET)
- `--tp-price <price>` — Take-profit order price (optional, MARKET if not set)
- `--sl-trigger-price <price>` — Stop-loss trigger price (for TP_SL/POSITIONAL_TP_SL/BRACKET)
- `--sl-price <price>` — Stop-loss order price (optional, MARKET if not set)
- `--reduce-only` — Reduce-only order (can only reduce existing position, not open new)
- `--client-order-id <id>` — Custom client order ID (optional)
- `--dry-run` — Print the request payload without signing or sending it
- `--account <id>` — Account ID (auto-resolves if single account)

### `algo-order-trades`

Get trades for a specific algo order

- **Usage:** `orderly algo-order-trades <order-id> [--symbol <symbol>] [--account <id>]`
- **Mutates:** no

**Flags:**

- `order_id` (required)
- `--symbol <symbol>` — Symbol of the order (auto-fetched if not provided)
- `--account <id>` — Account ID (auto-resolves if single account)

### `asset-history`

Get asset deposit/withdraw history

- **Usage:** `orderly asset-history [--token <token>] [--side <side>] [--status <status>] [--page <n>] [--size <n>] [--account <id>]`
- **Mutates:** no

**Flags:**

- `--token <token>` — Filter by token
- `--side <side>` — Filter by side: DEPOSIT or WITHDRAW
- `--status <status>` — Filter by status: NEW, CONFIRM, PROCESSING, COMPLETED, FAILED, PENDING_REBALANCE
- `--page <n>` — Page number (default: 1)
- `--size <n>` — Page size (default: 25)
- `--account <id>` — Account ID (auto-resolves if single account)

### `auth-cleanup`

Remove all stored API keys for a network

- **Usage:** `orderly auth-cleanup`
- **Mutates:** yes

### `auth-export-key`

Export Ed25519 private key (requires interactive TTY)

- **Usage:** `orderly auth-export-key [account-id]`
- **Mutates:** no

**Flags:**

- `account_id` — Account ID (positional)

### `auth-import`

Import existing Ed25519 API key (for users who already have one)

- **Usage:** `orderly auth-import [private-key] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `private_key` — Ed25519 private key (positional)
- `--account <id>` — Account ID (auto-resolves if single account)

### `auth-list`

List all stored API keys (public keys only)

- **Usage:** `orderly auth-list [--ids]`
- **Mutates:** no

**Flags:**

- `--ids` — Output only account IDs, one per line (for scripting/piping)

### `auth-logout`

Remove API key from keychain

- **Usage:** `orderly auth-logout [account-id]`
- **Mutates:** yes

**Flags:**

- `account_id` — Account ID (positional)

### `auth-show`

Show public key for an account

- **Usage:** `orderly auth-show [--account <id>]`
- **Mutates:** no

**Flags:**

- `--account <id>` — Account ID (auto-resolves if single account)

### `batch-order-cancel`

Cancel multiple orders by IDs

- **Usage:** `orderly batch-order-cancel <order-ids> [--dry-run] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `order_ids` (required)
- `--dry-run` — Print the request payload without signing or sending it
- `--account <id>` — Account ID (auto-resolves if single account)

### `batch-order-cancel-by-client-id`

Cancel multiple orders by client order IDs (max 10)

- **Usage:** `orderly batch-order-cancel-by-client-id <client-order-ids> [--account <id>]`
- **Mutates:** yes

**Flags:**

- `client_order_ids` (required)
- `--account <id>` — Account ID (auto-resolves if single account)

### `batch-order-place`

Place multiple orders (max 10)

- **Usage:** `orderly batch-order-place <orders> [--dry-run] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `orders` (required) — JSON array of orders, or a path to a JSON file
- `--dry-run` — Print the request payload without signing or sending it
- `--account <id>` — Account ID (auto-resolves if single account)

### `broker-create`

Create a broker ID via Orderly One

- **Usage:** `orderly broker-create [broker-id] [--address <address>] [--tx-hash <hash>] [--chain <chain>] [--chain-id <id>] [--payment-type <type>] [--maker-fee <bps>] [--taker-fee <bps>] [--rwa-maker-fee <bps>] [--rwa-taker-fee <bps>]`
- **Mutates:** yes

**Flags:**

- `broker_id` — Desired broker ID
- `--address <address>` — EVM wallet address (prompts if not provided)
- `--tx-hash <hash>` — Payment tx hash (skip info, go straight to verify)
- `--chain <chain>` — Payment chain: ethereum, arbitrum, base
- `--chain-id <id>` — Chain ID: 1, 42161, 8453
- `--payment-type <type>` — Payment token: usdc, usdt, or order
- `--maker-fee <bps>` — Maker fee in basis points (-0.5 to 15)
- `--taker-fee <bps>` — Taker fee in basis points (3 to 15)
- `--rwa-maker-fee <bps>` — RWA maker fee in basis points (-0.5 to 15)
- `--rwa-taker-fee <bps>` — RWA taker fee in basis points (5 to 15)

### `broker-status`

Show your DEX/broker status (requires EVM wallet)

- **Usage:** `orderly broker-status [--address <address>]`
- **Mutates:** no

**Flags:**

- `--address <address>` — EVM wallet address (prompts if not provided)

### `chains`

List supported chains (no auth required)

- **Usage:** `orderly chains [--broker-id <id>] [--verbose]`
- **Mutates:** no

**Flags:**

- `--broker-id <id>` — Filter chains by broker ID
- `--verbose` — Include broker_ids array for each chain

### `deposit-info`

Get deposit info for a token

- **Usage:** `orderly deposit-info <token> <chain-id>`
- **Mutates:** no

**Flags:**

- `token` (required)
- `chain_id` (required)

### `distribution-history`

Get broker fee and referral rebate history

- **Usage:** `orderly distribution-history [--status <status>] [--type <type>] [--start-time <timestamp>] [--end-time <timestamp>] [--page <n>] [--size <n>] [--account <id>]`
- **Mutates:** no

**Flags:**

- `--status <status>` — Filter by status: CREATED, SPLIT, COMPLETED
- `--type <type>` — Filter by type: BROKER_FEE, REFEREE_REBATE, REFERRER_REBATE
- `--start-time <timestamp>` — Start timestamp (Unix ms)
- `--end-time <timestamp>` — End timestamp (Unix ms)
- `--page <n>` — Page number (default: 1)
- `--size <n>` — Page size (default: 25)
- `--account <id>` — Account ID (auto-resolves if single account)

### `faucet-account`

Request testnet USDC for a stored Orderly account

- **Usage:** `orderly faucet-account [--chain-id <id>] [--broker-id <id>] [--wait] [--timeout <seconds>] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `--chain-id <id>` — Destination chain ID for EVM (default: 421614, Arbitrum Sepolia)
- `--broker-id <id>` — Broker ID (auto-resolved from the account if omitted)
- `--wait` — Wait for the USDC to appear in the Orderly account balance
- `--timeout <seconds>` — Maximum seconds to wait for the balance (default: 120)
- `--account <id>` — Account ID (auto-resolves if single account)

### `faucet-usdc`

Get test USDC from faucet (testnet only)

- **Usage:** `orderly faucet-usdc <address> [--chain-id <id>] [--broker-id <id>]`
- **Mutates:** yes

**Flags:**

- `address` (required)
- `--chain-id <id>` — Required. EVM: 421614 (Arbitrum Sepolia), 84532 (Base Sepolia). SOL: 901901901 (Devnet)
- `--broker-id <id>` — Broker ID (default: demo)

### `fee-tier`

Get current fee rates (futures, RWA, default)

- **Usage:** `orderly fee-tier [--account <id>]`
- **Mutates:** no

**Flags:**

- `--account <id>` — Account ID (auto-resolves if single account)

### `funding-history`

Get funding fee history

- **Usage:** `orderly funding-history [--symbol <symbol>] [--start-time <timestamp>] [--end-time <timestamp>] [--page <n>] [--size <n>] [--account <id>]`
- **Mutates:** no

**Flags:**

- `--symbol <symbol>` — Filter by symbol
- `--start-time <timestamp>` — Start timestamp (Unix ms)
- `--end-time <timestamp>` — End timestamp (Unix ms)
- `--page <n>` — Page number (default: 1)
- `--size <n>` — Page size (default: 25)
- `--account <id>` — Account ID (auto-resolves if single account)

### `funding-rates`

Get public funding rates for all symbols (no auth required)

- **Usage:** `orderly funding-rates [--symbol <symbol>]`
- **Mutates:** no

**Flags:**

- `--symbol <symbol>` — Filter by symbol

### `key-info`

Get registered API key info and scopes

- **Usage:** `orderly key-info [--account <id>]`
- **Mutates:** no

**Flags:**

- `--account <id>` — Account ID (auto-resolves if single account)

### `kline`

Get candlestick/kline data. Valid intervals: 1m, 5m, 15m, 30m, 1h, 4h, 12h, 1d, 1w, 1mon

- **Usage:** `orderly kline <symbol> <type> [--size <n>]`
- **Mutates:** no

**Flags:**

- `symbol` (required)
- `type` (required)
- `--size <n>` — Number of candles (default: 100, max: 1000)

### `leverage`

Get or set leverage for a symbol

- **Usage:** `orderly leverage <symbol> [value] [--dry-run] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `symbol` (required)
- `value`
- `--dry-run` — Print the request payload without signing or sending it
- `--account <id>` — Account ID (auto-resolves if single account)

### `liquidated-positions`

Get public liquidated positions (no auth required)

- **Usage:** `orderly liquidated-positions [--symbol <symbol>] [--page <n>] [--size <n>]`
- **Mutates:** no

**Flags:**

- `--symbol <symbol>` — Filter by symbol
- `--page <n>` — Page number (default: 1)
- `--size <n>` — Page size (default: 25)

### `market-orderbook`

Get orderbook snapshot

- **Usage:** `orderly market-orderbook <symbol> [--depth <n>]`
- **Mutates:** no

**Flags:**

- `symbol` (required)
- `--depth <n>` — Number of price levels per side (default: all)

### `market-price`

Get current market price

- **Usage:** `orderly market-price <symbol>`
- **Mutates:** no

**Flags:**

- `symbol` (required)

### `market-trades`

Get recent public trades

- **Usage:** `orderly market-trades <symbol> [--size <n>]`
- **Mutates:** no

**Flags:**

- `symbol` (required)
- `--size <n>` — Number of trades (default: 50)

### `notification-inbox`

List notification inbox messages

- **Usage:** `orderly notification-inbox [--type <type>] [--page <n>] [--size <n>] [--account <id>]`
- **Mutates:** no

**Flags:**

- `--type <type>` — Filter by type: TRADE or SYSTEM
- `--page <n>` — Page number (default: 1)
- `--size <n>` — Page size (default: 25)
- `--account <id>` — Account ID (auto-resolves if single account)

### `notification-unread`

Get unread notification count and messages

- **Usage:** `orderly notification-unread [--account <id>]`
- **Mutates:** no

**Flags:**

- `--account <id>` — Account ID (auto-resolves if single account)

### `open-interest`

Get long/short open interest for all symbols (no auth required)

- **Usage:** `orderly open-interest [--symbol <symbol>]`
- **Mutates:** no

**Flags:**

- `--symbol <symbol>` — Filter by symbol

### `order-cancel`

Cancel an order

- **Usage:** `orderly order-cancel <order-id> [--symbol <symbol>] [--dry-run] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `order_id` (required)
- `--symbol <symbol>` — Symbol of the order (auto-fetched if not provided)
- `--dry-run` — Print the request payload without signing or sending it
- `--account <id>` — Account ID (auto-resolves if single account)

### `order-cancel-all`

Cancel all orders

- **Usage:** `orderly order-cancel-all [--symbol <symbol>] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `--symbol <symbol>` — Filter by symbol (optional)
- `--account <id>` — Account ID (auto-resolves if single account)

### `order-cancel-by-client-id`

Cancel an order by client order ID

- **Usage:** `orderly order-cancel-by-client-id <client-order-id> <symbol> [--account <id>]`
- **Mutates:** yes

**Flags:**

- `client_order_id` (required)
- `symbol` (required)
- `--account <id>` — Account ID (auto-resolves if single account)

### `order-edit`

Edit a pending order (only specify what to change)

- **Usage:** `orderly order-edit <order-id> [--symbol <symbol>] [--price <price>] [--quantity <quantity>] [--dry-run] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `order_id` (required)
- `--symbol <symbol>` — Symbol of the order (auto-fetched if not provided)
- `--price <price>` — New order price
- `--quantity <quantity>` — New order quantity
- `--dry-run` — Print the request payload without signing or sending it
- `--account <id>` — Account ID (auto-resolves if single account)

### `order-get`

Get order details. Auto-detects numeric order ID vs client order ID

- **Usage:** `orderly order-get [order-id] [--client-order-id <id>] [--account <id>]`
- **Mutates:** no

**Flags:**

- `order_id`
- `--client-order-id <id>` — Explicitly look up by client order ID
- `--account <id>` — Account ID (auto-resolves if single account)

### `order-list`

List orders (defaults to open/active orders)

- **Usage:** `orderly order-list [--symbol <symbol>] [--status <status>] [--side <side>] [--order-type <type>] [--sort-by <sort>] [--page <n>] [--size <n>] [--product-type <type>] [--all] [--account <id>]`
- **Mutates:** no

**Flags:**

- `--symbol <symbol>` — Filter by symbol
- `--status <status>` — Filter by status. Individual: NEW, FILLED, CANCELLED, PARTIAL_FILLED, REJECTED. Bundled: INCOMPLETE, COMPLETED. Default: INCOMPLETE
- `--side <side>` — Filter by side: BUY, SELL
- `--order-type <type>` — Filter by type: LIMIT, MARKET
- `--sort-by <sort>` — Sort: CREATED_TIME_ASC, CREATED_TIME_DESC, UPDATED_TIME_ASC, UPDATED_TIME_DESC
- `--page <n>` — Page number (default: 1)
- `--size <n>` — Page size (default: 25, max: 500)
- `--product-type <type>` — Filter by product type: PERP or BINARY
- `--all` — Show all orders (overrides default INCOMPLETE filter)
- `--account <id>` — Account ID (auto-resolves if single account)

### `order-place`

Place a new order

- **Usage:** `orderly order-place <symbol> <side> [type] [quantity] [--price <price>] [--client-order-id <id>] [--reduce-only] [--dry-run] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `symbol` (required)
- `side` (required)
- `type` — Order type (omitted for the short BID/ASK form)
- `quantity`
- `--price <price>` — Order price (required for LIMIT, IOC, FOK, POST_ONLY)
- `--client-order-id <id>` — Custom client order ID (optional)
- `--reduce-only` — Reduce-only order (can only reduce existing position, not open new)
- `--dry-run` — Print the request payload without signing or sending it
- `--account <id>` — Account ID (auto-resolves if single account)

### `order-trades`

Get trades for a specific order

- **Usage:** `orderly order-trades <order-id> [--symbol <symbol>] [--account <id>]`
- **Mutates:** no

**Flags:**

- `order_id` (required)
- `--symbol <symbol>` — Symbol of the order (auto-fetched if not provided)
- `--account <id>` — Account ID (auto-resolves if single account)

### `positions-close`

Close a position

- **Usage:** `orderly positions-close <symbol> [--quantity <n>] [--dry-run] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `symbol` (required)
- `--quantity <n>` — Partial close quantity (default: full position)
- `--dry-run` — Print the request payload without signing or sending it
- `--account <id>` — Account ID (auto-resolves if single account)

### `positions-history`

Get position history

- **Usage:** `orderly positions-history [--symbol <symbol>] [--start-time <timestamp>] [--end-time <timestamp>] [--page <n>] [--size <n>] [--product-type <type>] [--account <id>]`
- **Mutates:** no

**Flags:**

- `--symbol <symbol>` — Filter by symbol
- `--start-time <timestamp>` — Start timestamp (Unix ms)
- `--end-time <timestamp>` — End timestamp (Unix ms)
- `--page <n>` — Page number (default: 1)
- `--size <n>` — Page size (default: 25)
- `--product-type <type>` — Filter by product type: PERP or BINARY
- `--account <id>` — Account ID (auto-resolves if single account)

### `positions-list`

List open positions

- **Usage:** `orderly positions-list [--product-type <type>] [--account <id>]`
- **Mutates:** no

**Flags:**

- `--product-type <type>` — Filter by product type: PERP or BINARY
- `--account <id>` — Account ID (auto-resolves if single account)

### `predict-buy`

Buy UP or DOWN shares in a Predict round

- **Usage:** `orderly predict-buy <symbol> <direction> <shares> [--price <price>] [--type <type>] [--post-only-adjust] [--client-order-id <id>] [--dry-run] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `symbol` (required) — Round symbol
- `direction` (required) — Direction: UP or DOWN
- `shares` (required) — Number of shares
- `--price <price>` — Limit price in the selected direction (0.01-0.99)
- `--type <type>` — Order type: LIMIT, IOC, POST_ONLY (default: LIMIT)
- `--post-only-adjust` — Adjust a POST_ONLY price by one tick toward the best price
- `--client-order-id <id>` — Custom client order ID (optional)
- `--dry-run` — Print the request payload without signing or sending it
- `--account <id>` — Account ID (auto-resolves if single account)

### `predict-close`

Close (part of) a Predict position with a protected IOC order

- **Usage:** `orderly predict-close <symbol> [--shares <n>] [--protect-ticks <n>] [--dry-run] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `symbol` (required) — Round symbol
- `--shares <n>` — Shares to close (default: full position)
- `--protect-ticks <n>` — Price protection in ticks (default: 2)
- `--dry-run` — Print the request payload without signing or sending it
- `--account <id>` — Account ID (auto-resolves if single account)

### `predict-orderbook`

Show the UP and DOWN order books for a Predict round

- **Usage:** `orderly predict-orderbook [symbol] [--depth <n>]`
- **Mutates:** no

**Flags:**

- `symbol` — Round symbol (defaults to the current round)
- `--depth <n>` — Number of price levels per side (default: all)

### `predict-round`

Show a Predict round (defaults to the current round)

- **Usage:** `orderly predict-round [symbol]`
- **Mutates:** no

**Flags:**

- `symbol` — Round symbol (defaults to the current round)

### `predict-rounds`

List Orderly Predict rounds (5-minute BTC Up/Down)

- **Usage:** `orderly predict-rounds [--status <status>] [--current] [--limit <n>] [--all]`
- **Mutates:** no

**Flags:**

- `--status <status>` — Filter by status: ACTIVE, DELISTING, RECYCLING, DELISTED
- `--current` — Only show the round currently in its observation window
- `--limit <n>` — Maximum rows to print (default: 20, max: 300)
- `--all` — Print all rounds (overrides --limit)

### `predict-sell`

Sell (reduce) an existing Predict position

- **Usage:** `orderly predict-sell <symbol> <direction> <shares> [--price <price>] [--type <type>] [--post-only-adjust] [--client-order-id <id>] [--dry-run] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `symbol` (required) — Round symbol
- `direction` (required) — Direction: UP or DOWN
- `shares` (required) — Number of shares
- `--price <price>` — Limit price in the selected direction (0.01-0.99)
- `--type <type>` — Order type: LIMIT, IOC, POST_ONLY (default: LIMIT)
- `--post-only-adjust` — Adjust a POST_ONLY price by one tick toward the best price
- `--client-order-id <id>` — Custom client order ID (optional)
- `--dry-run` — Print the request payload without signing or sending it
- `--account <id>` — Account ID (auto-resolves if single account)

### `price-changes`

Get price changes for all symbols (5m, 30m, 1h, 24h, 7d, 30d) (no auth required)

- **Usage:** `orderly price-changes [--symbol <symbol>]`
- **Mutates:** no

**Flags:**

- `--symbol <symbol>` — Filter by symbol

### `referral-info`

Get referral information (referrer/referee stats and codes)

- **Usage:** `orderly referral-info [--account <id>]`
- **Mutates:** no

**Flags:**

- `--account <id>` — Account ID (auto-resolves if single account)

### `schema`

Print a machine-readable manifest of the entire CLI surface

- **Usage:** `orderly schema [--json]`
- **Mutates:** no

**Flags:**

- `--json` — Machine-readable JSON manifest (default output)

### `settle-pnl`

Settle unrealized PnL into account balance

- **Usage:** `orderly settle-pnl [--dry-run] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `--dry-run` — Print the request payload without signing or sending it
- `--account <id>` — Account ID (auto-resolves if single account)

### `settle-pnl-history`

Get on-chain PnL settlement history

- **Usage:** `orderly settle-pnl-history [--page <n>] [--size <n>] [--account <id>]`
- **Mutates:** no

**Flags:**

- `--page <n>` — Page number (default: 1)
- `--size <n>` — Page size (default: 25)
- `--account <id>` — Account ID (auto-resolves if single account)

### `symbols`

List trading symbols. Default: compact list (symbol, pair, prices). Use --info for full order rules (lot size, min notional, price tick, etc.)

- **Usage:** `orderly symbols [--info]`
- **Mutates:** no

**Flags:**

- `--info` — Show detailed per-symbol order rules instead of compact list

### `system-status`

Get Orderly system maintenance status (no auth required)

- **Usage:** `orderly system-status`
- **Mutates:** no

### `tokens`

List supported tokens (no auth required)

- **Usage:** `orderly tokens [--verbose]`
- **Mutates:** no

**Flags:**

- `--verbose` — Include chain_details array for each token

### `trades`

Get trade history

- **Usage:** `orderly trades [--symbol <symbol>] [--start-time <timestamp>] [--end-time <timestamp>] [--page <n>] [--size <n>] [--product-type <type>] [--account <id>]`
- **Mutates:** no

**Flags:**

- `--symbol <symbol>` — Filter by symbol
- `--start-time <timestamp>` — Start timestamp (Unix ms)
- `--end-time <timestamp>` — End timestamp (Unix ms)
- `--page <n>` — Page number (default: 1)
- `--size <n>` — Page size (default: 25)
- `--product-type <type>` — Filter by product type: PERP or BINARY
- `--account <id>` — Account ID (auto-resolves if single account)

### `volume-stats`

Get perp trading volume statistics (today, 1d, 7d, 30d, YTD, LTD)

- **Usage:** `orderly volume-stats [--account <id>]`
- **Mutates:** no

**Flags:**

- `--account <id>` — Account ID (auto-resolves if single account)

### `wallet-add-key`

Add Orderly API key for trading (Step 3 of setup)

- **Usage:** `orderly wallet-add-key [--address <address>] [--scope <scope>] [--broker-id <id>]`
- **Mutates:** yes

**Flags:**

- `--address <address>` — Wallet address (required for AI/scripts, prompts if omitted)
- `--scope <scope>` — Key scopes: read,trading,asset (default: read,trading)
- `--broker-id <id>` — Broker ID (required when no API key stored for wallet)

### `wallet-create`

Create a new EVM or SOL wallet

- **Usage:** `orderly wallet-create [--type <type>]`
- **Mutates:** yes

**Flags:**

- `--type <type>` — Wallet type: EVM or SOL (required in non-interactive mode)

### `wallet-import`

Import an existing wallet private key

- **Usage:** `orderly wallet-import [private-key] [--type <type>] [--address <address>] [--private-key <key>]`
- **Mutates:** yes

**Flags:**

- `private_key` — Private key (positional)
- `--type <type>` — Wallet type: EVM or SOL (required in non-interactive mode)
- `--address <address>` — Wallet address (optional, derived from key)
- `--private-key <key>` — Private key (alternative to positional arg, for non-interactive use)

### `wallet-list`

List all stored wallets

- **Usage:** `orderly wallet-list`
- **Mutates:** no

### `wallet-logout`

Remove wallet from keychain (alias for wallet-remove)

- **Usage:** `orderly wallet-logout [address]`
- **Mutates:** yes

**Flags:**

- `address` — Wallet address

### `wallet-register`

Register an Orderly account with your wallet (Step 2 of setup)

- **Usage:** `orderly wallet-register [--broker-id <id>] [--address <address>]`
- **Mutates:** yes

**Flags:**

- `--broker-id <id>` — Broker ID, e.g., "demo" (required for AI/scripts, prompts if omitted)
- `--address <address>` — Wallet address (required for AI/scripts, prompts if omitted)

### `wallet-remove`

Remove wallet private key from keychain. WARNING: can cause permanent loss of access to dependent accounts.

- **Usage:** `orderly wallet-remove [address] [--force]`
- **Mutates:** yes

**Flags:**

- `address` — Wallet address
- `--force` — Skip confirmation prompt (required in non-interactive mode)

### `wallet-revoke-key`

Revoke the current Orderly API key (server-side + local keychain removal).

WARNING: This permanently deactivates the key. You will lose ALL access
to the account via this key. Use wallet-add-key to generate a new one after.

- **Usage:** `orderly wallet-revoke-key [--account <id>] [--force]`
- **Mutates:** yes

**Flags:**

- `--account <id>` — Account ID (auto-resolves if single account)
- `--force` — Skip confirmation prompt (required in non-interactive mode)

### `wallet-show`

Show wallet info (address required for AI/scripts, prompts if omitted)

- **Usage:** `orderly wallet-show [address]`
- **Mutates:** no

**Flags:**

- `address` — Wallet address

### `withdraw`

Withdraw tokens (auto-signs with wallet key). Omit --receiver to withdraw to your own wallet address.

- **Usage:** `orderly withdraw <token> <chain-id> [--receiver <address>] [--amount <amount>] [--raw] [--allow-cross-chain] [--dry-run] [--account <id>]`
- **Mutates:** yes

**Flags:**

- `token` (required)
- `chain_id` (required)
- `--receiver <address>` — Destination address (defaults to your wallet address)
- `--amount <amount>` — Amount to withdraw (required, e.g. 10.5)
- `--raw` — Amount is in smallest units (default: false, use human-readable like 10.5)
- `--allow-cross-chain` — Allow cross-chain withdrawal (required when destination chain differs from deposit chain)
- `--dry-run` — Print the request payload without signing or sending it
- `--account <id>` — Account ID (auto-resolves if single account)
