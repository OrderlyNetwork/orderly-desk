import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import AgentFleet from "../components/AgentFleet";
import TickerStrip from "../components/TickerStrip";
import { useAgentFleet } from "../lib/useAgents";

const chapters = [
  {
    number: "01",
    title: "Wallet to first balance",
    body: "Create an EVM wallet, register an Orderly account, request testnet USDC, and add the API key that signs trades.",
    tags: ["wallet-create", "faucet", "auth-list"],
    to: "/walkthrough#setup",
  },
  {
    number: "02",
    title: "Read the market",
    body: "Tickers, order books, candles, funding, and open interest — the public reads you need before sizing a position.",
    tags: ["market-price", "market-orderbook", "kline"],
    to: "/walkthrough#markets",
  },
  {
    number: "03",
    title: "Your first perp trade",
    body: "Read the market, set leverage, rest a limit order, take it with a market order, and close the position.",
    tags: ["market-price", "order-place", "positions-list"],
    to: "/walkthrough#first-trade",
  },
  {
    number: "04",
    title: "Risk, on the record",
    body: "Attach TP/SL orders, use reduce-only exits, cancel everything, and check the system before you size up.",
    tags: ["algo-order-place", "order-cancel-all"],
    to: "/walkthrough#risk",
  },
  {
    number: "05",
    title: "Orderly Predict",
    body: "Trade 5-minute BTC Up/Down rounds, read the derived DOWN book, and close a binary position safely.",
    tags: ["predict-rounds", "predict-buy", "predict-close"],
    to: "/walkthrough#predict",
  },
  {
    number: "06",
    title: "Automate the desk",
    body: "Make the CLI an agent tool: schema discovery, JSON output, or the typed trading MCP wrapper.",
    tags: ["schema", "trading-mcp", "agent loop"],
    to: "/walkthrough#automate",
  },
];

const button =
  "inline-flex min-h-11 items-center justify-center gap-2.5 rounded-[10px] border border-transparent bg-ink px-5 text-sm font-semibold tracking-[-0.01em] text-bg transition duration-150 hover:-translate-y-px hover:bg-white";
const buttonGhost =
  "inline-flex min-h-11 items-center justify-center gap-2.5 rounded-[10px] border border-white/15 bg-transparent px-5 text-sm font-semibold tracking-[-0.01em] text-ink transition duration-150 hover:-translate-y-px hover:border-white/25 hover:bg-white/[0.06]";

function Command({ children }: { children: ReactNode }) {
  return (
    <div className="term-line text-[11.5px] leading-[1.75] md:text-[12.5px]">
      <span className="select-none text-accent" aria-hidden="true">
        $
      </span>
      <span>{children}</span>
    </div>
  );
}

function Output({ children }: { children: ReactNode }) {
  return <div className="term-out mb-3.5 text-[11.5px] leading-[1.75] md:text-[12.5px]">{children}</div>;
}

export default function Landing() {
  const fleet = useAgentFleet();
  const navigate = useNavigate();

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 pt-12 pb-14 md:pt-[88px] md:pb-[72px]">
        <div
          className="pointer-events-none absolute left-1/2 top-[-220px] h-[520px] w-[900px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(110,33,200,0.22),transparent)] blur-[20px]"
          aria-hidden="true"
        />
        <div className="shell relative grid items-center gap-11 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <div className="eyebrow">
              <span className="live-dot" aria-hidden="true" />
              Live agents · testnet demo
            </div>
            <h1 className="mt-5 text-balance text-[clamp(46px,6.4vw,84px)] font-[650] leading-[0.98] tracking-[-0.055em]">
              Agentic trading,
              <br />
              live.
            </h1>
            <p className="mt-6 max-w-[560px] text-base leading-[1.65] text-muted md:text-[17px]">
              Three autonomous agents trade BTC perps on Orderly testnet. The CLI is the
              control plane: every agent decision has a copyable command, and the dashboard
              is read-only. The CLI runs on mainnet or testnet; this demo chooses testnet.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard" className={button}>
                Watch the agents
              </Link>
              <Link to="/walkthrough" className={buttonGhost}>
                Read the CLI walkthrough
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-7 border-t border-white/10 pt-6 text-[13px] text-dim">
              <span>
                <strong className="mr-1 font-mono font-medium text-ink">3</strong> strategies
              </span>
              <span>
                <strong className="mr-1 font-mono font-medium text-ink">1k</strong> allocated per agent
              </span>
              <span>
                <strong className="mr-1 font-mono font-medium text-ink">1</strong> CLI control plane
              </span>
            </div>
          </div>

          <div
            className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#15161c] to-[#101116] shadow-[0_40px_90px_rgba(0,0,0,0.5)]"
            role="img"
            aria-label="Example Orderly CLI session"
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_160px_at_80%_0%,rgba(156,117,255,0.09),transparent)]"
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-3.5 border-b border-white/10 bg-white/[0.015] px-4 py-3">
              <span className="inline-flex gap-1.5" aria-hidden="true">
                <i className="h-2.5 w-2.5 rounded-full bg-[#3a3348]" />
                <i className="h-2.5 w-2.5 rounded-full bg-[#2b2f36]" />
                <i className="h-2.5 w-2.5 rounded-full bg-[#2b2f36]" />
              </span>
              <span className="font-mono text-[11px] tracking-[0.04em] text-dim">
                orderly — example session
              </span>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.08em] text-gain">
                testnet
              </span>
            </div>
            <div className="relative overflow-x-auto px-4 py-5 md:px-5 md:py-6">
              <Command>orderly market-price PERP_BTC_USDC</Command>
              <Output>
                {`{"symbol":"PERP_BTC_USDC","mark_price":74396.00,`}
                <br />
                {` "index_price":74396.00,"est_funding_rate":0.0001}`}
              </Output>
              <Command>orderly order-place PERP_BTC_USDC BUY MARKET 0.002</Command>
              <Output>
                {`{"success":true,"order_id":10293847,`}
                <br />
                {` "status":"NEW","filled_quantity":0.002}`}
              </Output>
              <Command>orderly positions-list</Command>
              <Output>
                {`{"rows":[{"symbol":"PERP_BTC_USDC","side":"LONG",`}
                <br />
                {` "average_open_price":74396.50,"unrealized_pnl":0.0041}]}`}
              </Output>
              <div className="term-line mt-1">
                <span className="select-none text-accent" aria-hidden="true">
                  $
                </span>
                <span className="inline-block h-[15px] w-2 animate-blink bg-accent" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <TickerStrip />

      <section className="border-b border-white/10 py-14 md:py-[76px]">
        <div className="shell">
          <AgentFleet
            agents={fleet.data ?? []}
            loading={fleet.loading}
            error={fleet.error}
            configured={fleet.configured}
            updatedAt={fleet.updatedAt}
            compact
            onSelect={(id) => navigate(`/dashboard?agent=${encodeURIComponent(id)}`)}
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-[680px] text-[13px] leading-relaxed text-muted">
              The fleet runs on Cloudflare Workers. Each agent has its own testnet account,
              a cron schedule, and a D1 decision log. Signing runs through the CLI's
              WebAssembly core. Entries are approved or vetoed by a DeepSeek risk officer
              before signing, and the model writes a daily recap. Select a card to focus
              the desk. Manual control stays with the CLI.
            </p>
            <Link
              to="/dashboard"
              className="font-mono text-[10px] uppercase tracking-[0.08em] text-accent transition hover:text-[#b9a0ff]"
            >
              open the agent desk →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 py-14 md:py-[76px]">
        <div className="shell">
          <div className="section-head mb-8">
            <div>
              <div className="eyebrow">How it works</div>
              <h2 className="mt-3.5 text-[clamp(30px,4vw,46px)] font-[620] leading-[1.06] tracking-[-0.04em]">
                Workers orchestrate. WASM signs. The CLI controls.
              </h2>
            </div>
            <p className="max-w-[460px] pb-1.5 text-[15px] leading-[1.65] text-muted">
              The hosted demo uses the CLI's Rust core compiled to WebAssembly.
              Same signing code as the binary, different key custody.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                index: "01",
                title: "Schedule",
                body: "A Worker cron wakes every two minutes and runs the agents whose interval is due. Each agent has its own account and cooldown.",
              },
              {
                index: "02",
                title: "Sign",
                body: "The Worker calls the CLI's Rust core in WebAssembly, which builds and signs the exact Orderly request before sending it to testnet.",
              },
              {
                index: "03",
                title: "Record",
                body: "Every action, price, order id, and reason goes into D1. The dashboard reads it, never writes it.",
              },
              {
                index: "04",
                title: "Control",
                body: "Import the same testnet key into the CLI for positions-list, order-cancel-all, and manual closes.",
              },
            ].map((step) => (
              <div
                key={step.index}
                className="rounded-[14px] border border-white/10 bg-panel/40 p-4"
              >
                <div className="font-mono text-[10px] tracking-[0.12em] text-accent">{step.index}</div>
                <h3 className="mt-3 text-[14px] font-[580] tracking-[-0.015em]">{step.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 py-16 md:py-[92px]">
        <div className="shell">
          <div className="mb-11 grid items-end gap-5 md:grid-cols-[1fr_0.7fr] md:gap-14">
            <div>
              <div className="eyebrow">The route</div>
              <h2 className="mt-3.5 text-[clamp(30px,4vw,46px)] font-[620] leading-[1.06] tracking-[-0.04em]">
                Six chapters. One CLI.
              </h2>
            </div>
            <p className="max-w-[460px] pb-1.5 text-[15px] leading-[1.65] text-muted">
              The manual path behind the fleet. Each chapter has the exact command, the
              real output, and the part that usually trips people up.
            </p>
          </div>

          <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
            {chapters.map((chapter) => (
              <Link
                className="group relative flex min-h-[250px] flex-col rounded-[14px] border border-white/10 bg-gradient-to-b from-panel-2/60 to-panel/60 p-6 transition duration-180 hover:-translate-y-0.5 hover:border-accent/40 hover:from-[#221e30]/70 hover:to-panel/80"
                to={chapter.to}
                key={chapter.number}
              >
                <span className="font-mono text-[11px] tracking-[0.12em] text-accent">
                  {chapter.number}
                </span>
                <h3 className="mt-6 text-[19px] font-[580] tracking-[-0.025em]">{chapter.title}</h3>
                <p className="mt-2.5 text-sm leading-[1.6] text-muted">{chapter.body}</p>
                <span className="mt-auto flex flex-wrap gap-1.5 pt-5">
                  {chapter.tags.map((tag) => (
                    <span
                      className="rounded-md border border-white/10 px-2 py-1 font-mono text-[10.5px] whitespace-nowrap text-dim"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </span>
                <span
                  className="absolute right-6 top-6 text-dim transition group-hover:translate-x-0.5 group-hover:text-accent"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 py-16 md:py-[76px]">
        <div className="shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <div className="eyebrow">Why a CLI</div>
            <h2 className="mt-3.5 text-[clamp(30px,4vw,44px)] font-[620] leading-[1.08] tracking-[-0.04em]">
              Built for agents. Safe for humans.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-muted">
              The CLI signs every request in-process. Private keys and API secrets
              never appear in normal command output, so an agent can trade without ever
              seeing the keys that authorize it. The same property makes the tool
              pleasant to script: one binary, JSON by default, and a schema command
              that describes itself. If your agent speaks MCP, the trading wrapper
              exposes the same binary as typed tools.
            </p>
            <p className="mt-4 text-[15px] leading-[1.7] text-muted">
              The hosted testnet agents use a separate trust boundary: dedicated testnet
              keys in Worker secrets, never in the browser. The CLI remains the
              keychain-backed control plane.
            </p>
            <Link
              to="/walkthrough#automate"
              className="mt-6 inline-block text-sm text-accent transition hover:text-[#b9a0ff]"
            >
              Read the automation chapter →
            </Link>
          </div>

          <div className="flex flex-col">
            {[
              {
                index: "01",
                title: "OS keychain storage",
                body: "Wallet and Ed25519 API keys live in the system keychain, not in dotfiles or environment variables.",
              },
              {
                index: "02",
                title: "Local signing",
                body: "EIP-712 registration and byte-identical Ed25519 request signing happen inside the binary.",
              },
              {
                index: "03",
                title: "Machine-first output",
                body: "Compact JSON by default, CSV on request, and a discovery schema for tools that do not know the command tree in advance.",
              },
              {
                index: "04",
                title: "Hosted testnet keys",
                body: "The demo agents use dedicated testnet keys in Worker secrets. The CLI stays keychain-backed for manual control.",
              },
            ].map((point) => (
              <div
                className="grid grid-cols-[44px_1fr] gap-[18px] border-t border-white/10 py-6 last:border-b"
                key={point.index}
              >
                <span className="pt-0.5 font-mono text-[11px] text-accent">{point.index}</span>
                <div>
                  <h3 className="text-base font-[580] tracking-[-0.015em]">{point.title}</h3>
                  <p className="mt-1.5 text-sm leading-[1.6] text-muted">{point.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-[92px]">
        <div className="shell flex flex-col items-start justify-between gap-10 rounded-[18px] border border-white/10 bg-[radial-gradient(500px_200px_at_0%_0%,rgba(110,33,200,0.2),transparent_70%),linear-gradient(180deg,rgba(26,28,34,0.7),rgba(16,17,22,0.8))] p-7 md:p-10 lg:flex-row lg:items-end">
          <div>
            <div className="eyebrow">
              <span className="live-dot" aria-hidden="true" />
              Live agents
            </div>
            <h2 className="mt-3.5 text-[clamp(30px,4vw,44px)] font-[620] leading-[1.08] tracking-[-0.04em]">
              The agents are live.
            </h2>
            <p className="mt-3.5 max-w-[600px] text-[15px] leading-[1.65] text-muted">
              Watch three Worker-run strategies trade BTC perps, read their decision log,
              and copy the CLI command behind every move. Market data is live; the
              dashboard is read-only.
            </p>
          </div>
          <Link to="/dashboard" className={`${button} shrink-0 bg-accent hover:bg-[#b092ff]`}>
            Open the agent desk
          </Link>
        </div>
      </section>
    </>
  );
}
