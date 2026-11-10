import type { Interval, Network } from "./types";

const APP_ID = "OqdphuyCtYWxwzhxyLLjOWNdFP7sQt8RPWzmb5xY";

export const NETWORKS: Record<
  Network,
  { label: string; shortLabel: string; api: string; ws: string; note: string }
> = {
  testnet: {
    label: "Testnet",
    shortLabel: "Testnet",
    api: "https://testnet-api.orderly.org",
    ws: `wss://testnet-ws-evm.orderly.org/ws/stream/${APP_ID}`,
    note: "Orders in this showcase are placed here.",
  },
  mainnet: {
    label: "Mainnet",
    shortLabel: "Mainnet",
    api: "https://api.orderly.org",
    ws: `wss://ws-evm.orderly.org/ws/stream/${APP_ID}`,
    note: "Live market data only. No mainnet orders.",
  },
};

export const NETWORK_ORDER: Network[] = ["testnet", "mainnet"];

export const PREFERRED_MARKETS = [
  "PERP_BTC_USDC",
  "PERP_ETH_USDC",
  "PERP_SOL_USDC",
  "PERP_LINK_USDC",
  "PERP_BNB_USDC",
  "PERP_ORDER_USDC",
];

export const INTERVALS: Interval[] = ["1m", "5m", "15m", "1h"];

export const TV_RESOLUTION: Record<Interval, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "1h": "60",
};

export const INTERVAL_SECONDS: Record<Interval, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
};
