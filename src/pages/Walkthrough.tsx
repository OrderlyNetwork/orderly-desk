import { Link } from "react-router-dom";
import CommandBlock from "../components/CommandBlock";
import { Callout, Chapter, NextLink, Prose, SubHead } from "../components/walkthrough";
import { versions } from "../lib/versions";

const toc = [
  { id: "setup", label: "Wallet to first balance" },
  { id: "markets", label: "Read the market" },
  { id: "first-trade", label: "First perp trade" },
  { id: "risk", label: "Risk controls" },
  { id: "predict", label: "Orderly Predict" },
  { id: "automate", label: "Automate the desk" },
  { id: "troubleshooting", label: "Troubleshooting" },
];

export default function Walkthrough() {
  return (
    <div className="shell pb-24 pt-10 md:pb-32 md:pt-14">
      <div className="eyebrow">Walkthrough · CLI</div>
      <h1 className="mt-4 max-w-[900px] text-[clamp(38px,5vw,64px)] font-[640] leading-[1.02] tracking-[-0.05em]">
        From empty keychain to a live position.
      </h1>
      <p className="mt-5 max-w-[720px] text-[16px] leading-[1.7] text-muted">
        A real testnet session, not a simulator. Every command below was run against
        <span className="font-mono text-[0.85em] text-ink"> testnet-api.orderly.org</span>, and
        the values are copied from the terminal. The CLI runs on mainnet or testnet; this
        walkthrough uses testnet for the demo. Long JSON is trimmed to the fields each
        chapter discusses; no values are replaced.
      </p>

      <div className="mt-6 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-dim">
        {[`orderly ${versions.cli.verifiedWith}`, "testnet", "verified 9 nov 2026", "6 chapters"].map(
          (item) => (
            <span key={item} className="rounded-full border border-white/10 px-2.5 py-1">
              {item}
            </span>
          ),
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-accent">
        <Link to="/dashboard" className="transition hover:text-[#b9a0ff]">
          watch the live fleet
        </Link>
        <a href="/walkthrough.md" className="transition hover:text-[#b9a0ff]">
          read as markdown
        </a>
        <a href="/llms.txt" className="transition hover:text-[#b9a0ff]">
          llms.txt
        </a>
        <a
          href={versions.cli.url}
          target="_blank"
          rel="noreferrer"
          className="text-dim transition hover:text-muted"
        >
          latest release {versions.cli.tag}
        </a>
      </div>

      <div className="mt-9 rounded-xl border border-white/10 bg-panel/40 p-5">
        <div className="eyebrow">Before you start</div>
        <p className="mt-3 max-w-[760px] text-[14.5px] leading-[1.7] text-muted">
          You need a terminal and the Orderly CLI. It is a single Rust binary; there
          is no Node runtime and no API key to paste into a file. Install it with the
          release script, then confirm the version.
        </p>
        <div className="mt-4 grid gap-3">
          <CommandBlock
            command="curl -fsSL https://raw.githubusercontent.com/OrderlyNetwork/cli/master/install.sh | sh"
            label="shell"
          />
          <CommandBlock
            command="orderly --version"
            output={`orderly ${versions.cli.verifiedWith}`}
          />
        </div>
        <p className="mt-3 font-mono text-[10px] leading-relaxed text-dim">
          Latest release:{" "}
          <a
            href={versions.cli.url}
            target="_blank"
            rel="noreferrer"
            className="text-muted underline decoration-white/20 underline-offset-4 hover:text-ink"
          >
            {versions.cli.tag}
          </a>
          . The captured output above is the version used for this walkthrough.
        </p>
        <p className="mt-3 font-mono text-[10px] leading-relaxed text-dim">
          On Linux the keychain uses the Secret Service (gnome-keyring or KWallet).
          If it is locked, auth commands will fail before any request is signed.
        </p>
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {toc.map((item, index) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 font-mono text-[10px] text-muted"
          >
            {String(index + 1).padStart(2, "0")} {item.label}
          </a>
        ))}
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
              On this page
            </div>
            <nav className="mt-3 flex flex-col gap-2.5 border-l border-white/10 pl-4">
              {toc.map((item, index) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="group flex gap-2.5 text-[12.5px] leading-snug text-muted transition hover:text-ink"
                >
                  <span className="font-mono text-[10px] text-dim group-hover:text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-7 rounded-lg border border-white/[0.07] bg-black/20 p-3">
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
                Demo account
              </div>
              <div className="mt-1 font-mono text-[10px] text-muted">0x6c80…ba17</div>
              <div className="mt-1 font-mono text-[9px] text-dim">testnet · pre-funded</div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-12">
          <Chapter
            id="setup"
            number="01"
            title="Wallet to first balance"
            lede="Two keys do two different jobs. The wallet key proves who you are when the account is registered; the Ed25519 API key signs every request after that. Both stay in the OS keychain."
          >
            <Prose>
              <p>
                Create a fresh EVM wallet. The command prints only the address,
                type, and network. The private key goes straight into the keychain;
                this command does not print it.
              </p>
            </Prose>
            <CommandBlock
              command="orderly wallet-create --type EVM --network testnet"
              output={`{"address":"0xdC137f84DF8AF19bB636F9f1f2545702d477f2A8","type":"EVM","network":"testnet"}`}
            />

            <Prose>
              <p>
                Register the account. The wallet signs an EIP-712 payload; this is
                an off-chain registration, not an on-chain transaction. Pass{" "}
                <code className="text-ink">--address</code> and{" "}
                <code className="text-ink">--broker-id</code> when you are scripting,
                because the interactive prompts need a TTY.
              </p>
            </Prose>
            <CommandBlock
              command="orderly wallet-register --address 0xdC137f84DF8AF19bB636F9f1f2545702d477f2A8 --broker-id demo --network testnet"
              output={`{"accountId":"0x3e91e4e91bd102a5b308c4b49188fd6a3f2cdb15f4a9ef072dbd3bb6b888d6db","address":"0xdC137f84DF8AF19bB636F9f1f2545702d477f2A8","network":"testnet"}`}
            />

            <Callout tone="note" label="What registration returns">
              The <span className="font-mono text-[0.85em] text-ink">accountId</span> is
              the identifier every authenticated command needs via{" "}
              <span className="font-mono text-[0.85em] text-ink">--account</span>. It is
              assigned when the wallet registers with a broker; keep the testnet and
              mainnet IDs separate.
            </Callout>

            <Prose>
              <p>
                Ask the testnet faucet for USDC. The operator faucet credits the
                trading account through a deposit, so there is no separate bridge
                step. Delivery is asynchronous.
              </p>
            </Prose>
            <CommandBlock
              command="orderly faucet-usdc 0xdC137f84DF8AF19bB636F9f1f2545702d477f2A8 --broker-id demo --chain-id 421614 --network testnet"
              output={`{"success":true,"timestamp":1794233872914}`}
            />

            <Prose>
              <p>
                Add the API key that will sign orders. The CLI generates the
                Ed25519 keypair locally, stores the private half in the keychain, and
                registers the public half with Orderly.
              </p>
            </Prose>
            <CommandBlock
              command="orderly wallet-add-key --address 0xdC137f84DF8AF19bB636F9f1f2545702d477f2A8 --broker-id demo --scope read,trading --network testnet"
              output={`{"accountId":"0x3e91e4e91bd102a5b308c4b49188fd6a3f2cdb15f4a9ef072dbd3bb6b888d6db","address":"0xdC137f84DF8AF19bB636F9f1f2545702d477f2A8","orderlyKey":"ed25519:6Q5vQ9xrFUdBaV8nPAsh7f99oRKwr6rDuK6WSssy94Ki","network":"testnet"}`}
            />

            <Callout tone="gotcha" label="The key in the output is public">
              <span className="font-mono text-[0.85em] text-ink">orderlyKey</span> is the
              public half. The secret half stays in the keychain and is not printed by
              setup or trading commands. The explicit export command requires an
              interactive TTY and a typed confirmation, which is why it is a poor fit
              for an agent.
            </Callout>

            <Prose>
              <p>
                The walkthrough switches to a pre-funded testnet account for the
                trading chapters, so we do not have to wait for faucet delivery.
                Confirm the account and its balance:
              </p>
            </Prose>
            <CommandBlock
              command="orderly auth-show --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"accountId":"0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17","address":"0xB98B2f22c7a9B5B371a7AD429016BADA4B673ba6","network":"testnet","walletType":"EVM","publicKey":"BFnfk4nqNyoq3S5UK51jyGmXi9UPs8tikvT5os6Yxhr7","brokerId":"shitzu"}`}
            />
            <CommandBlock
              command="orderly account-balance --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"holding":[{"updated_time":1794233774110,"token":"USDC","holding":3000.916763,"frozen":0,"pending_short":0,"isolated_margin":0,"isolated_order_frozen":0}]}`}
            />

            <Callout tone="verified" label="Verified on testnet">
              The fresh wallet was created, registered, funded, and keyed on 9 Nov
              2026. The funded account in the rest of the page is a separate testnet
              account with roughly 3,000 USDC.
            </Callout>

            <Prose>
              <p>
                One more piece of housekeeping: hex account IDs must be quoted in a
                shell. <code className="text-ink">--account 0x6c80…</code> without
                quotes can be parsed as a number.
              </p>
            </Prose>

            <NextLink to="/walkthrough#markets" label="Next: read the market" />
          </Chapter>

          <Chapter
            id="markets"
            number="02"
            title="Read the market before you touch it"
            lede="Every trading decision starts with a public request. The market commands are unauthenticated, cheap to poll, and return the same JSON an agent will parse."
          >
            <Prose>
              <p>
                A ticker is not just a price. The row carries the index price, mark
                price, funding, open interest, and rolling 24-hour stats.
              </p>
            </Prose>
            <CommandBlock
              command="orderly market-price PERP_ETH_USDC --network testnet"
              output={`{"symbol":"PERP_ETH_USDC","display_symbol_name":"ETH","broker_id":null,"status":"ACTIVE","index_price":2117.42,"mark_price":2117.41,"sum_unitary_funding":2607.05,"est_funding_rate":0.0001,"last_funding_rate":0.00010039,"next_funding_time":1794240000000,"open_interest":16107.231,"is_pretge":false,"24h_open":2238.63,"24h_close":2116.73,"24h_high":2238.63,"24h_low":2090.91,"24h_volume":3.907,"24h_amount":8273.624943}`}
            />

            <Prose>
              <p>
                The order book command subscribes to the WebSocket and returns the
                first snapshot it receives. Prices are in USDC, quantities are in the
                base asset. Here it is trimmed to three levels per side with{" "}
                <code className="text-ink">jq</code>:
              </p>
            </Prose>
            <CommandBlock
              command="orderly market-orderbook PERP_ETH_USDC | jq '{asks:(.asks[:3]),bids:(.bids[:3])}'"
              output={`{
  "asks": [
    { "price": 2119.16, "quantity": 0.1533 },
    { "price": 2119.21, "quantity": 0.1533 },
    { "price": 2119.26, "quantity": 0.1533 }
  ],
  "bids": [
    { "price": 2119.15, "quantity": 0.2005 },
    { "price": 2119.10, "quantity": 0.2005 },
    { "price": 2119.05, "quantity": 0.2005 }
  ]
}`}
            />

            <Prose>
              <p>
                Recent prints show the taker side, price, size, and timestamp. The
                command returns the public trades feed; the old README's{" "}
                <code className="text-ink">--limit</code> flag is not part of this
                binary. Check <code className="text-ink">--help</code> instead of
                trusting an old snippet.
              </p>
            </Prose>
            <CommandBlock
              command="orderly market-trades PERP_ETH_USDC | jq '{rows:(.rows[:3])}'"
              output={`{
  "rows": [
    { "symbol": "PERP_ETH_USDC", "side": "SELL", "executed_price": 2118.24, "executed_quantity": 0.01, "executed_timestamp": 1794233921866 },
    { "symbol": "PERP_ETH_USDC", "side": "BUY", "executed_price": 2116.89, "executed_quantity": 0.02, "executed_timestamp": 1794233649617 },
    { "symbol": "PERP_ETH_USDC", "side": "BUY", "executed_price": 2116.73, "executed_quantity": 0.0177, "executed_timestamp": 1794233407416 }
  ]
}`}
            />

            <Prose>
              <p>
                Candles come back as rows with <code className="text-ink">open</code>,{" "}
                <code className="text-ink">high</code>,{" "}
                <code className="text-ink">low</code>,{" "}
                <code className="text-ink">close</code>, and volume. The{" "}
                <code className="text-ink">type</code> argument is positional.
              </p>
            </Prose>
            <CommandBlock
              command="orderly kline PERP_ETH_USDC 1h | jq '{rows:(.rows[:2])}'"
              output={`{
  "rows": [
    { "open": 2416.11, "high": 2420.97, "low": 2414.45, "close": 2418.48, "volume": 0.0187, "amount": 45.18, "symbol": "PERP_ETH_USDC", "type": "1h", "start_timestamp": 1793876400000, "end_timestamp": 1793880000000 },
    { "open": 2418.48, "high": 2418.70, "low": 2385.44, "close": 2391.56, "volume": 0.0836, "amount": 199.64, "symbol": "PERP_ETH_USDC", "type": "1h", "start_timestamp": 1793880000000, "end_timestamp": 1793883600000 }
  ]
}`}
            />

            <Prose>
              <p>
                Funding history is a good example of why the CLI returns full
                objects instead of a table. One symbol expands into a window of
                rates:
              </p>
            </Prose>
            <CommandBlock
              command={'orderly funding-rates | jq \'.rows[] | select(.symbol=="PERP_ETH_USDC") | {symbol, funding: {last: .funding.last, "1d": .funding["1d"]}, data_start_time}\''}
              output={`{
  "symbol": "PERP_ETH_USDC",
  "funding": {
    "last": { "rate": 0.00010039, "positive": 1, "negative": 0 },
    "1d": { "rate": 0.00039571, "positive": 4, "negative": 0 }
  },
  "data_start_time": "2025-11-14 08:00:00"
}`}
            />

            <Prose>
              <p>
                Before sizing anything, check the venue. The status endpoint is a
                single read:
              </p>
            </Prose>
            <CommandBlock
              command="orderly system-status"
              output={`{"status":0,"msg":"System is functioning properly.","scheduled_maintenance":null}`}
            />

            <Callout tone="gotcha" label="Testnet is thin">
              The ETH book on testnet often has one or two cents of spread, long
              gaps between prints, and candles with zero volume. That is the venue,
              not a bug. The dashboard has a mainnet toggle if you want to see a
              deeper book; the trading in this walkthrough stays on testnet.
            </Callout>

            <NextLink to="/walkthrough#first-trade" label="Next: place the first order" />
          </Chapter>

          <Chapter
            id="first-trade"
            number="03"
            title="Your first perp trade"
            lede="A limit order rests. A market order crosses. A position is just the net of the fills. We will do all three, then close half so there is still something live on the desk."
          >
            <Prose>
              <p>
                Set leverage for the symbol. It is a client setting on the account,
                not a property of the order; changing it affects the margin the
                exchange reserves for the position.
              </p>
            </Prose>
            <CommandBlock
              command="orderly leverage PERP_ETH_USDC 3 --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"symbol":"PERP_ETH_USDC","leverage":3,"margin_mode":"CROSS"}`}
            />

            <Prose>
              <p>
                Rest a small bid below the market. At a mark near 2,117, a buy at
                2,050 is not going to fill immediately; it joins the book as a maker
                order.
              </p>
            </Prose>
            <CommandBlock
              command="orderly order-place PERP_ETH_USDC BUY LIMIT 0.02 --price 2050 --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"symbol":"PERP_ETH_USDC","status":"NEW","side":"BUY","order_id":3953559031,"user_id":294314,"price":2050,"type":"LIMIT","quantity":0.02,"visible":0.02,"visible_quantity":0.02,"executed":0,"total_executed_quantity":0,"total_fee":0,"fee_asset":"USDC","created_time":1794233648805,"average_executed_price":null,"reduce_only":null,"margin_mode":"CROSS"}`}
            />

            <Prose>
              <p>Confirm the order is working:</p>
            </Prose>
            <CommandBlock
              command="orderly order-list --status NEW --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"rows":[{"symbol":"PERP_ETH_USDC","status":"NEW","side":"BUY","order_id":3953559031,"price":2050,"type":"LIMIT","quantity":0.02,"total_executed_quantity":0,"fee_asset":"USDC","created_time":1794233648805,"margin_mode":"CROSS"}],"meta":{"total":1,"records_per_page":25,"current_page":1}}`}
            />

            <Prose>
              <p>
                Now take liquidity with a market order. The fill price is not the
                price you saw in the ticker; it is the average of the levels the
                order consumed. Fees are charged in USDC.
              </p>
            </Prose>
            <CommandBlock
              command="orderly order-place PERP_ETH_USDC BUY MARKET 0.02 --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"symbol":"PERP_ETH_USDC","status":"FILLED","side":"BUY","order_id":3953559032,"price":null,"type":"MARKET","quantity":0.02,"executed":0.02,"total_executed_quantity":0.02,"total_fee":0.025403,"fee_asset":"USDC","average_executed_price":2116.89,"margin_mode":"CROSS"}`}
            />

            <Prose>
              <p>
                The position view is the account-level risk picture: collateral,
                free margin, and the per-symbol row. The row is trimmed to the fields
                that matter for the story.
              </p>
            </Prose>
            <CommandBlock
              command="orderly positions-list --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"total_collateral_value":2998.937163,"free_collateral":2970.70262966,"account_value":2998.937163,"rows":[{"symbol":"PERP_ETH_USDC","position_qty":0.02,"average_open_price":2116.89,"mark_price":2117.59,"unsettled_pnl":-0.011403,"leverage":3,"margin_mode":"CROSS","imr":0.33333333,"mmr":0.006}],"total_pnl_24_h":0}`}
            />

            <Callout tone="note" label="Unsettled PnL is not a bank balance">
              It includes the current mark, accrued funding, and the exchange's
              settlement conventions. The number will move with the mark even when
              you have not touched the position.
            </Callout>

            <Prose>
              <p>
                Close half with a reduce-only market order. The CLI resolves the side
                from the live position, so you do not have to remember whether a long
                exits with a buy or a sell.
              </p>
            </Prose>
            <CommandBlock
              command="orderly positions-close PERP_ETH_USDC --quantity 0.01 --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"order_id":3953559289,"client_order_id":null,"order_type":"MARKET","order_price":null,"order_quantity":0.01,"order_amount":null}`}
            />

            <Prose>
              <p>
                The fill is in the trade history with a realized PnL and a fee. That
                is the auditable record; the position row only shows what is still
                open.
              </p>
            </Prose>
            <CommandBlock
              command="orderly trades --size 5 --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet | jq '{rows:[.rows[0]],meta}'"
              output={`{
  "rows": [
    {
      "id": 10378497343,
      "symbol": "PERP_ETH_USDC",
      "fee": 0.01271,
      "side": "SELL",
      "executed_timestamp": 1794233921866,
      "order_id": 3953559289,
      "executed_price": 2118.24,
      "executed_quantity": 0.01,
      "realized_pnl": 0.0135,
      "fee_asset": "USDC",
      "is_maker": 0
    }
  ],
  "meta": { "total": 4, "records_per_page": 5, "current_page": 1 }
}`}
            />

            <Callout tone="gotcha" label="The order and the position are different objects">
              A <span className="font-mono text-[0.85em] text-ink">FILLED</span> order
              can leave a position open; a closed position can still have orders and
              trade history around it. Read the object that answers your question.
            </Callout>

            <NextLink to="/walkthrough#risk" label="Next: put risk on the record" />
          </Chapter>

          <Chapter
            id="risk"
            number="04"
            title="Risk, on the record"
            lede="The useful part of a trading CLI is not placing an order. It is making the exit explicit, cancelling it when the plan changes, and being able to prove what happened."
          >
            <Prose>
              <p>
                Attach a take-profit and a stop-loss to the position as one algo
                order. Both legs are reduce-only and trigger on the mark price. The
                CLI expands the parent into two child orders.
              </p>
            </Prose>
            <CommandBlock
              command="orderly algo-order-place PERP_ETH_USDC SELL TP_SL 0.02 --tp-trigger-price 2230 --sl-trigger-price 2010 --reduce-only --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"rows":[{"order_id":91000319,"client_order_id":null,"algo_type":"TP_SL","order_quantity":0.02},{"order_id":91000320,"client_order_id":null,"algo_type":"TAKE_PROFIT","order_quantity":0.02},{"order_id":91000321,"client_order_id":null,"algo_type":"STOP_LOSS","order_quantity":0.02}]}`}
            />

            <Prose>
              <p>
                List the algo order to see the parent, the children, the trigger
                prices, and whether either leg has fired. This output is trimmed after
                the first child.
              </p>
            </Prose>
            <CommandBlock
              command="orderly algo-order-list --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"rows":[{"algo_order_id":91000319,"symbol":"PERP_ETH_USDC","algo_type":"TP_SL","side":"SELL","quantity":0.02,"is_triggered":false,"algo_status":"NEW","reduce_only":true,"is_activated":true,"child_orders":[{"algo_order_id":91000320,"algo_type":"TAKE_PROFIT","trigger_price":2230,"trigger_price_type":"MARK_PRICE","algo_status":"NEW"},{"algo_order_id":91000321,"algo_type":"STOP_LOSS","trigger_price":2010,"trigger_price_type":"MARK_PRICE","algo_status":"NEW"}]}],"meta":{"total":1}}`}
            />

            <Prose>
              <p>
                Cancel a single order with its ID and symbol. The response is a
                request acknowledgement, not a guarantee that the book has already
                changed; list again if you need certainty.
              </p>
            </Prose>
            <CommandBlock
              command="orderly order-cancel 3953559299 --symbol PERP_ETH_USDC --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"status":"CANCEL_SENT"}`}
            />

            <Prose>
              <p>
                <code className="text-ink">order-cancel-all</code> is the emergency
                brake. It is scoped to a symbol when you pass{" "}
                <code className="text-ink">--symbol</code>; without it, it cancels every
                open order on the account.
              </p>
            </Prose>
            <CommandBlock
              command="orderly order-cancel-all --symbol PERP_ETH_USDC --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"status":"CANCEL_ALL_SENT"}`}
            />

            <Callout tone="gotcha" label="Size changes invalidate the plan">
              The TP/SL above was sized for 0.02 ETH. After the partial close the
              position was 0.01, so the reduce-only legs can only reduce what is
              there. Cancel and replace the algo order whenever the position size
              changes; do not assume the old bracket still describes the new risk.
            </Callout>

            <Prose>
              <p>
                A dry run prints the exact request body without signing or sending
                it. It is the cheapest way to check an agent's intent before it
                touches the account.
              </p>
            </Prose>
            <CommandBlock
              command="orderly order-place PERP_ETH_USDC BUY LIMIT 0.01 --price 2100 --dry-run --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"dryRun":true,"method":"POST","path":"/v1/order","body":{"symbol":"PERP_ETH_USDC","order_type":"LIMIT","side":"BUY","order_quantity":"0.01","order_price":"2100"},"note":null,"requires":[]}`}
            />

            <Callout tone="verified" label="The live fleet">
              The dashboard runs three Worker-based BTC agents on testnet. This chapter is
              the manual path: the same repository contains the agent code, and every
              agent action has a CLI equivalent. Open the agent desk to watch the fleet.
            </Callout>

            <NextLink to="/walkthrough#predict" label="Next: trade a 5-minute round" />
          </Chapter>

          <Chapter
            id="predict"
            number="05"
            title="Orderly Predict is a different book"
            lede="Five-minute BTC Up/Down rounds. Shares are priced between 0 and 1 and settle at 0 or 1. The matching engine only holds the UP book; the CLI derives the DOWN side for you."
          >
            <Prose>
              <p>
                Read the current round first. The symbol is generated per round and
                is permanent. Never construct it, and never reuse the previous one.
                The field that matters is <code className="text-ink">expire_at</code>.
              </p>
            </Prose>
            <CommandBlock
              command={'orderly predict-rounds --current | jq \'{server_timestamp,rows:[.rows[0]|{symbol,product_type,status,observation_start_at,expire_at,index_price_symbol,s0,outcome,settlement_price_per_share}]}\''}
              output={`{
  "server_timestamp": 1794234200555,
  "rows": [
    {
      "symbol": "PERP_BTC5M2611091420_USDC",
      "product_type": "BINARY",
      "status": "ACTIVE",
      "observation_start_at": 1794234000000,
      "expire_at": 1794234300000,
      "index_price_symbol": "PERP_BTC_USDC",
      "s0": 74585.86,
      "outcome": null,
      "settlement_price_per_share": null
    }
  ]
}`}
            />

            <Prose>
              <p>
                The order book prints the UP asks and bids plus the derived DOWN
                side. Buying DOWN at <code className="text-ink">d</code> is a sell of
                UP at <code className="text-ink">1 − d</code>. Use{" "}
                <code className="text-ink">down_asks</code> to buy DOWN and{" "}
                <code className="text-ink">down_bids</code> to sell it.
              </p>
            </Prose>
            <CommandBlock
              command="orderly predict-orderbook PERP_BTC5M2611091415_USDC"
              output={`{"symbol":"PERP_BTC5M2611091415_USDC","best":{"up_bid":0.46,"up_ask":0.53,"down_bid":0.47,"down_ask":0.54},"asks":[{"price":0.53,"quantity":12.42},{"price":0.67,"quantity":21.39}],"bids":[{"price":0.46,"quantity":13.77},{"price":0.37,"quantity":16.76}],"down_asks":[{"price":0.54,"quantity":13.77},{"price":0.63,"quantity":16.76}],"down_bids":[{"price":0.47,"quantity":12.42},{"price":0.33,"quantity":21.39}]}`}
            />

            <Prose>
              <p>
                Buy five UP shares at the ask with an IOC order. Predict accepts
                LIMIT, IOC, and POST_ONLY only; there is no market order. The
                position is always isolated margin.
              </p>
            </Prose>
            <CommandBlock
              command="orderly predict-buy PERP_BTC5M2611091415_USDC UP 5 --price 0.57 --type IOC --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"order_id":3953559307,"client_order_id":null,"order_type":"IOC","order_price":0.57,"order_quantity":5,"order_amount":null,"direction":"UP","direction_price":"0.57","book_price":"0.57","reduce_only":false}`}
            />

            <Prose>
              <p>
                Filter the position list by product type. A Predict position is not
                a perp position; mixing them into one view hides the margin mode and
                the expiry.
              </p>
            </Prose>
            <CommandBlock
              command="orderly positions-list --product-type BINARY --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"rows":[{"symbol":"PERP_BTC5M2611091415_USDC","position_qty":5,"average_open_price":0,"mark_price":0.5,"unsettled_pnl":-0.42353}]}`}
            />

            <Callout tone="gotcha" label="Average open price can read zero">
              The public position payload for an active Predict round reported{" "}
              <span className="font-mono text-[0.85em] text-ink">average_open_price: 0</span>{" "}
              even though the fill was 0.57. Use the fill price from{" "}
              <span className="font-mono text-[0.85em] text-ink">trades</span> or{" "}
              <span className="font-mono text-[0.85em] text-ink">cost_position ÷ quantity</span>.
              This is a real edge in the API; do not build a PnL display that assumes
              the field is always populated.
            </Callout>

            <Prose>
              <p>
                Close with <code className="text-ink">predict-close</code>. It computes
                an IOC price two ticks beyond the best bid or ask, marks the order
                reduce-only, and sends it to the correct side of the UP book.
              </p>
            </Prose>
            <CommandBlock
              command="orderly predict-close PERP_BTC5M2611091415_USDC --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"order_id":3953559309,"client_order_id":null,"order_type":"IOC","order_price":0.41,"order_quantity":5,"order_amount":null,"direction":"UP","direction_price":"0.41","book_price":"0.41","reduce_only":true}`}
            />

            <Prose>
              <p>
                The result is two fills and a realized loss. That is the honest
                version of a probability trade: the book moved against the position
                before it could be closed.
              </p>
            </Prose>
            <CommandBlock
              command="orderly trades --product-type BINARY --size 2 --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`{"rows":[{"symbol":"PERP_BTC5M2611091415_USDC","side":"SELL","executed_price":0.43,"executed_quantity":5,"realized_pnl":-0.7,"fee":0.07353,"executed_timestamp":1794233950568},{"symbol":"PERP_BTC5M2611091415_USDC","side":"BUY","executed_price":0.57,"executed_quantity":5,"realized_pnl":0,"fee":0.07353,"executed_timestamp":1794233948552}]}`}
            />

            <Callout tone="note" label="If you hold to expiry">
              The round settles automatically at 0 or 1. You do not need to close;
              you just need to accept the binary outcome. Use{" "}
              <span className="font-mono text-[0.85em] text-ink">trades --product-type BINARY</span>{" "}
              and <span className="font-mono text-[0.85em] text-ink">positions-history</span>{" "}
              to see the settlement prints.
            </Callout>

            <NextLink to="/walkthrough#automate" label="Next: automate the desk" />
          </Chapter>

          <Chapter
            id="automate"
            number="06"
            title="Automate the desk"
            lede="The CLI is designed to be the tool layer under an agent: one binary, JSON by default, a self-describing schema, and no key material in the output."
          >
            <Prose>
              <p>
                <code className="text-ink">orderly schema</code> is the discovery
                endpoint. It returns every command with its arguments, whether it
                mutates state, and the help text. The reference page on this site is
                generated from it.
              </p>
            </Prose>
            <CommandBlock
              command="orderly schema | jq '.commands | length'"
              output="80"
            />

            <Prose>
              <p>
                Each command object is enough to build a tool definition without
                scraping <code className="text-ink">--help</code>. This is a trimmed
                <code className="text-ink"> order-place</code> entry:
              </p>
            </Prose>
            <CommandBlock
              command={'orderly schema | jq \'.commands[] | select(.path=="order-place") | {path,about,mutates,args:[.args[]|{name,long,required,takesValue}]}\''}
              output={`{
  "path": "order-place",
  "about": "Place a new order",
  "mutates": true,
  "args": [
    { "name": "symbol", "long": null, "required": true, "takesValue": true },
    { "name": "side", "long": null, "required": true, "takesValue": true },
    { "name": "type_", "long": null, "required": false, "takesValue": true },
    { "name": "quantity", "long": null, "required": false, "takesValue": true },
    { "name": "price", "long": "price", "required": false, "takesValue": true },
    { "name": "client_order_id", "long": "client-order-id", "required": false, "takesValue": true },
    { "name": "reduce_only", "long": "reduce-only", "required": false, "takesValue": false },
    { "name": "dry_run", "long": "dry-run", "required": false, "takesValue": false },
    { "name": "account", "long": "account", "required": false, "takesValue": true }
  ]
}`}
            />

            <Prose>
              <p>
                A read-only loop is the safest first automation. It resolves the
                account once and prints a parsed ticker every five seconds; the
                output is one line per sample, so it can feed a log or a small
                dashboard without a JSON parser on the other end.
              </p>
            </Prose>
            <CommandBlock
              command={`ACCOUNT=$(orderly auth-list --network testnet | jq -r '.[0].accountId')
while sleep 5; do
  orderly market-price PERP_ETH_USDC | jq -r '[.symbol, .mark_price, .est_funding_rate] | @tsv'
done`}
            />

            <Prose>
              <p>
                When the loop needs to trade, make the first pass a dry run. The
                response is the exact body the CLI would sign, and nothing reaches
                the exchange.
              </p>
            </Prose>
            <CommandBlock
              command={`orderly order-place PERP_ETH_USDC BUY LIMIT 0.01 --price "$PRICE" --dry-run --account "$ACCOUNT" --network testnet`}
            />

            <Prose>
              <p>
                For a table instead of JSON, add{" "}
                <code className="text-ink">--csv</code>. It is the same data, one
                header row, and no whitespace:
              </p>
            </Prose>
            <CommandBlock
              command="orderly order-list --status NEW --csv --account 0x6c80370227172f94c389fef23c44b4f47642f8987efd0293d56617d36207ba17 --network testnet"
              output={`symbol,status,side,order_id,user_id,price,type,quantity,amount,visible,visible_quantity,executed,total_executed_quantity,total_fee,fee_asset,client_order_id,created_time,updated_time,average_executed_price,reduce_only,order_tag,realized_pnl,margin_mode
PERP_ETH_USDC,NEW,BUY,3953559304,294314,2100,LIMIT,0.01,,0.01,0.01,0,0,0,USDC,,1794233944289,1794233944404,,,,0,CROSS`}
            />

            <SubHead>If your agent prefers MCP</SubHead>
            <Prose>
              <p>
                The CLI is the substrate.{" "}
                <code className="text-ink">{versions.tradingMcp.package}</code> is a
                small stdio MCP server that wraps the same binary as typed tools. It
                never sees or signs with the keys: it validates arguments and runs the
                CLI as a subprocess, so the keychain remains the only place a secret
                lives.
              </p>
            </Prose>
            <CommandBlock
              command={`npm install -g ${versions.tradingMcp.package}
${versions.tradingMcp.command} doctor`}
              output={`${versions.tradingMcp.command} ${versions.tradingMcp.version}

Selected CLI:   /path/to/orderly (v${versions.cli.verifiedWith})
Schema version: ${versions.cli.verifiedWith}
CLI commands:   80
Profile:        core
Read-only:      no
Network:        testnet`}
            />
            <p className="font-mono text-[10px] leading-relaxed text-dim">
              doctor output trimmed; paths and account IDs are placeholders.
            </p>

            <Prose>
              <p>
                Point the client at the CLI explicitly. GUI clients often launch with a
                minimal <code className="text-ink">PATH</code>, so{" "}
                <code className="text-ink">ORDERLY_BIN</code> removes the guesswork.
              </p>
            </Prose>
            <CommandBlock
              prompt={false}
              label="opencode.json"
              command={`{
  "mcp": {
    "servers": {
      "orderly-trading": {
        "command": ["npx", "-y", "${versions.tradingMcp.package}"],
        "environment": {
          "ORDERLY_BIN": "/path/to/orderly",
          "ORDERLY_MCP_ACCOUNT": "0x…"
        }
      }
    }
  }
}`}
            />

            <Prose>
              <p>
                The default <code className="text-ink">core</code> profile exposes 16
                tools. <code className="text-ink">predict</code> adds the six Predict
                tools, <code className="text-ink">algo</code> adds TP/SL, and{" "}
                <code className="text-ink">all</code> /{" "}
                <code className="text-ink">full</code> widen the reviewed surface to 68
                and 71. Set <code className="text-ink">ORDERLY_MCP_READ_ONLY=1</code>{" "}
                for a read-only agent and{" "}
                <code className="text-ink">ORDERLY_MCP_ALLOW_MAINNET=0</code> to block
                mainnet mutations entirely.
              </p>
              <p>
                The hosted fleet is the live example. The MCP is the local path for an
                agent client that wants the CLI surface as typed tools. Every order in the
                manual walkthrough was placed with the CLI. The dashboard remains
                read-only.
              </p>
            </Prose>

            <div className="flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-[0.08em]">
              <a
                href={versions.tradingMcp.url}
                target="_blank"
                rel="noreferrer"
                className="text-accent transition hover:text-[#b9a0ff]"
              >
                npm {versions.tradingMcp.version}
              </a>
              <a
                href={versions.mcpRegistry.url}
                target="_blank"
                rel="noreferrer"
                className="text-dim transition hover:text-muted"
              >
                MCP registry {versions.mcpRegistry.version ?? "pending"}
              </a>
              <a href="/mcp.md" className="text-accent transition hover:text-[#b9a0ff]">
                full MCP guide →
              </a>
            </div>
            <p className="font-mono text-[10px] leading-relaxed text-dim">
              The registry listing can lag npm. Install from npm for the current
              package.
            </p>

            <Callout tone="verified" label="The safety property">
              Private keys, API secrets, and signing material never appear in normal
              command output. The CLI signs in-process and prints only results. That
              is why a local bridge can shell out to it read-only, and why an agent can
              be given the binary without being given the keys. The hosted testnet fleet
              is a separate trust boundary: dedicated Worker secrets, never the browser.
              The dashboard is the scoreboard, not the trader.
            </Callout>

            <Prose>
              <p>
                The public dashboard uses two paths: public REST and WebSocket data for
                markets, and a read-only Worker API for the agent fleet. The Worker signs
                testnet reads with a dedicated key in Worker secrets; the browser never
                receives it. The local CLI bridge remains available for manual checks.
              </p>
            </Prose>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link to="/dashboard" className="inline-flex min-h-10 items-center rounded-lg bg-ink px-4 text-[13px] font-semibold text-bg transition hover:bg-white">
                Open the agent desk
              </Link>
              <Link to="/reference" className="inline-flex min-h-10 items-center rounded-lg border border-white/15 px-4 text-[13px] font-semibold text-ink transition hover:bg-white/[0.06]">
                Browse the command reference
              </Link>
            </div>

            <NextLink to="/walkthrough#troubleshooting" label="Next: troubleshooting" />
          </Chapter>

          <section id="troubleshooting" className="scroll-mt-24 border-t border-white/10 pt-10">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">07</div>
            <h2 className="mt-3 text-[clamp(26px,3.4vw,38px)] font-[620] leading-[1.1] tracking-[-0.035em]">
              Troubleshooting
            </h2>
            <p className="mt-3 max-w-[720px] text-[15px] leading-[1.7] text-muted">
              The errors that cost the most time are rarely about the market. They
              are about account resolution, symbol formatting, and the local
              keychain.
            </p>

            <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
              {[
                {
                  symptom: '"--account is required"',
                  fix: "Run orderly auth-list --network testnet, quote the hex account ID, and pass it explicitly. There is no default account.",
                },
                {
                  symptom: '"unexpected argument --limit"',
                  fix: "The README can drift. Run orderly <command> --help and use the flags the installed binary actually has.",
                },
                {
                  symptom: "Symbol not found",
                  fix: "Symbols are uppercase and include the quote: PERP_ETH_USDC. Run orderly symbols to inspect the live list.",
                },
                {
                  symptom: "401 or 403",
                  fix: "The API key is missing, revoked, or out of scope. Run key-info, check the system clock, and add a read/trading key if needed.",
                },
                {
                  symptom: "Keychain errors on Linux",
                  fix: "Start the Secret Service (gnome-keyring or KWallet) and unlock it. The CLI never falls back to a plaintext key file.",
                },
                {
                  symptom: "Faucet requested but balance is empty",
                  fix: "Delivery is asynchronous. Use faucet-account --wait for an existing account, or check again after a few minutes.",
                },
                {
                  symptom: "The testnet book looks fake",
                  fix: "It is thin. Compare with the mainnet toggle on the dashboard, but keep execution on testnet for this walkthrough.",
                },
              ].map((row) => (
                <div
                  key={row.symptom}
                  className="grid gap-1 border-b border-white/[0.06] px-4 py-3.5 last:border-0 md:grid-cols-[220px_1fr] md:gap-5"
                >
                  <div className="font-mono text-[11px] text-ink">{row.symptom}</div>
                  <div className="text-[13px] leading-relaxed text-muted">{row.fix}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-white/10 bg-panel/40 p-5">
              <div className="eyebrow">Where to go next</div>
              <p className="mt-3 max-w-[720px] text-[14px] leading-relaxed text-muted">
                Open the <Link to="/dashboard" className="text-accent hover:text-[#b9a0ff]">agent desk</Link>{" "}
                to watch the live testnet fleet, or browse the{" "}
                <Link to="/reference" className="text-accent hover:text-[#b9a0ff]">generated command reference</Link>.
                The repository README covers the Worker agents, account setup, and deployment.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
