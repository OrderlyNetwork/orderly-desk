import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ActivityFeed from "../components/ActivityFeed";
import AgentFleet from "../components/AgentFleet";
import CandleChart from "../components/CandleChart";
import OrderbookPanel from "../components/OrderbookPanel";
import StatsBar from "../components/StatsBar";
import TradeTape from "../components/TradeTape";
import { NetworkToggle, Panel } from "../components/ui";
import { INTERVALS, NETWORKS } from "../lib/network";
import {
  useCandles,
  useMarkets,
  useOrderbook,
  useTrades,
} from "../lib/useMarketData";
import { useAgentDecisions, useAgentFleet } from "../lib/useAgents";
import { cn, fmtClock, marketLabel } from "../lib/format";
import type { Interval, Network } from "../lib/types";

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMarket = searchParams.get("market") || "PERP_BTC_USDC";
  const selectedId = searchParams.get("agent");

  const [network, setNetwork] = useState<Network>("mainnet");
  const [symbol, setSymbol] = useState(initialMarket.toUpperCase());
  const [interval, setIntervalValue] = useState<Interval>("5m");

  const fleet = useAgentFleet();
  const activity = useAgentDecisions(40);
  const selectedAgent = (fleet.data ?? []).find((agent) => agent.id === selectedId) ?? null;
  const decisions = selectedId
    ? (activity.data ?? []).filter((decision) => decision.agent_id === selectedId)
    : activity.data ?? [];

  const selectAgent = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("agent", id);
    else next.delete("agent");
    setSearchParams(next, { replace: true });
  };

  const marketsState = useMarkets(network);
  const { options, error, updatedAt } = marketsState;

  const optionKey = options.map((option) => option.symbol).join(",");

  useEffect(() => {
    if (!options.length) return;
    if (!options.some((option) => option.symbol === symbol)) {
      setSymbol(options[0].symbol);
    }
  }, [optionKey, options, symbol]);

  const market = options.find((option) => option.symbol === symbol) ?? options[0] ?? null;
  const activeSymbol = market?.symbol ?? symbol;

  const candles = useCandles(network, activeSymbol, interval);
  const orderbook = useOrderbook(network, activeSymbol);
  const trades = useTrades(network, activeSymbol);

  return (
    <div className="shell pb-24 pt-10 md:pb-32 md:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow">
            <span className="live-dot" aria-hidden="true" />
            Agentic trading · testnet demo
          </div>
          <h1 className="mt-3.5 text-[clamp(38px,5vw,64px)] font-[640] leading-[1.02] tracking-[-0.05em]">
            The agent desk.
          </h1>
          <p className="mt-4 max-w-[680px] text-[15px] leading-[1.65] text-muted md:text-base">
            Three autonomous agents trade BTC perps on testnet. The Workers sign orders
            directly, record every decision in D1, and expose a read-only feed. The CLI is
            the control plane; the dashboard never signs or submits an order. The market
            panel uses mainnet reference data; switch it to testnet to see the demo venue.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <NetworkToggle value={network} onChange={setNetwork} />
          <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-dim">
            market data: {NETWORKS[network].label} reference · agents: testnet
          </span>
        </div>
      </div>

      <div className="mt-6">
        <AgentFleet
          agents={fleet.data ?? []}
          loading={fleet.loading}
          error={fleet.error}
          configured={fleet.configured}
          updatedAt={fleet.updatedAt}
          selectedId={selectedId}
          onSelect={selectAgent}
        />
      </div>

      {selectedAgent ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/25 bg-accent/[0.05] px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.07em]">
            <span className="text-accent">focused on {selectedAgent.name}</span>
            <span className="text-dim">{selectedAgent.accountId.slice(0, 8)}…</span>
            {selectedAgent.position ? (
              <span className="text-muted">
                {selectedAgent.position.side} {selectedAgent.position.quantity} BTC
              </span>
            ) : (
              <span className="text-muted">flat</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedAgent.dashboardUrl ? (
              <a
                href={selectedAgent.dashboardUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-accent transition hover:text-[#b9a0ff]"
              >
                Orderly dashboard ↗
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => selectAgent("")}
              className="rounded-md border border-white/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-dim transition hover:text-ink"
            >
              show all
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <label className="relative inline-flex items-center">
          <span className="sr-only">Market</span>
          <select
            value={activeSymbol}
            onChange={(event) => setSymbol(event.target.value)}
            className="min-h-10 appearance-none rounded-lg border border-white/10 bg-panel py-2 pl-3 pr-9 font-mono text-[12px] text-ink outline-none transition focus:border-accent/60"
          >
            {options.length ? (
              options.map((option) => (
                <option key={option.symbol} value={option.symbol} className="bg-panel">
                  {marketLabel(option.symbol)}
                </option>
              ))
            ) : (
              <option value={activeSymbol}>{marketLabel(activeSymbol)}</option>
            )}
          </select>
          <span
            className="pointer-events-none absolute right-3 font-mono text-[10px] text-dim"
            aria-hidden="true"
          >
            ▾
          </span>
        </label>

        <span className="hidden h-5 w-px bg-white/10 sm:block" aria-hidden="true" />

        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-dim">
          <span className={cn("h-1.5 w-1.5 rounded-full", error ? "bg-loss" : updatedAt ? "bg-gain" : "bg-warn")} />
          {error ? "market feed error" : updatedAt ? `updated ${fmtClock(updatedAt)}` : "connecting…"}
        </div>

        <span className="ml-auto hidden font-mono text-[9.5px] uppercase tracking-[0.08em] text-dim sm:inline">
          read-only view
        </span>
      </div>

      {error && !options.length ? (
        <div className="mt-5 rounded-xl border border-loss/25 bg-loss/[0.06] px-4 py-3 font-mono text-[11px] text-loss">
          {error}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <StatsBar market={market} network={network} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.85fr)]">
          <div className="min-w-0 space-y-4">
            <Panel
              title={`${marketLabel(activeSymbol)} · ${interval}`}
              action={
                <div className="inline-flex rounded-md border border-white/10 bg-black/20 p-0.5">
                  {INTERVALS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={interval === item}
                      onClick={() => setIntervalValue(item)}
                      className={cn(
                        "min-h-6 rounded px-2 font-mono text-[10px] transition",
                        interval === item
                          ? "bg-white/10 text-ink"
                          : "text-dim hover:text-muted",
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              }
              bodyClassName="px-1 pb-1"
            >
              <CandleChart
                data={candles.data ?? []}
                symbol={activeSymbol}
                interval={interval}
                loading={candles.loading}
              />
              <div className="flex justify-end border-t border-white/[0.06] px-3 py-1.5 font-mono text-[9px] text-dim">
                <a
                  href="https://www.tradingview.com/lightweight-charts/"
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-muted"
                >
                  charts by TradingView
                </a>
              </div>
            </Panel>

            <OrderbookPanel book={orderbook.book} status={orderbook.status} />
          </div>

          <div className="min-w-0 space-y-4">
            <ActivityFeed
              decisions={decisions}
              agents={fleet.data ?? []}
              loading={activity.loading}
              filterName={selectedAgent?.name}
            />
            <TradeTape trades={trades.trades} status={trades.status} />
            <Panel title="Wiring" bodyClassName="px-4 pb-3 pt-2.5">
              <ul className="space-y-2 font-mono text-[10.5px]">
                {[
                  ["agents", "Worker · D1"],
                  ["execution", "signed REST · testnet"],
                  ["markets", "REST · 5s"],
                  ["order book", "WS · live"],
                  ["trades", "WS · live"],
                  ["browser", "read-only"],
                ].map(([label, value]) => (
                  <li
                    key={label}
                    className="flex items-center justify-between border-b border-white/[0.04] pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-dim">{label}</span>
                    <span className="text-muted">{value}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10.5px] leading-relaxed text-dim">
                Agent keys live in Worker secrets. The browser only reads public market data
                and the read-only fleet API.
              </p>
            </Panel>
          </div>
        </div>
      </div>

      <p className="mt-6 font-mono text-[10px] leading-relaxed text-dim">
        Market data is public Orderly data; the default is mainnet reference. Agent
        execution is testnet-only. Manual control is through the CLI, not this page.
      </p>
    </div>
  );
}
