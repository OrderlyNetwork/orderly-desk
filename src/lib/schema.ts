export interface SchemaArg {
  name: string;
  long: string | null;
  short: string | null;
  valueName: string | null;
  required: boolean;
  takesValue: boolean;
  possibleValues: string[];
  defaultValue: string | null;
  numArgs: number | null;
  help: string | null;
}

export interface SchemaCommand {
  path: string;
  about: string;
  longAbout: string | null;
  mutates: boolean;
  args: SchemaArg[];
  subcommands: SchemaCommand[];
}

export interface Schema {
  name: string;
  version: string;
  description: string;
  globalArgs: SchemaArg[];
  commands: SchemaCommand[];
}

export const CATEGORIES = [
  "All",
  "Setup",
  "Trading",
  "Markets",
  "Predict",
  "Account",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function categoryOf(command: SchemaCommand): Exclude<Category, "All"> {
  const path = command.path;
  if (path.startsWith("wallet-") || path.startsWith("auth-")) return "Setup";
  if (
    path.startsWith("order-") ||
    path.startsWith("algo-") ||
    path.startsWith("batch-") ||
    path.startsWith("positions-") ||
    path === "leverage" ||
    path === "trades"
  ) {
    return "Trading";
  }
  if (path.startsWith("predict-")) return "Predict";
  if (
    path.startsWith("market-") ||
    path === "funding-rates" ||
    path === "kline" ||
    path === "symbols" ||
    path === "price-changes" ||
    path === "open-interest" ||
    path === "liquidated-positions" ||
    path === "system-status"
  ) {
    return "Markets";
  }
  if (
    path.startsWith("account-") ||
    path === "key-info" ||
    path === "fee-tier" ||
    path === "referral-info" ||
    path.startsWith("settle-pnl") ||
    path.startsWith("distribution-") ||
    path.startsWith("volume-") ||
    path.startsWith("notification-") ||
    path === "assets" ||
    path === "chains" ||
    path === "tokens" ||
    path === "deposit-info" ||
    path === "withdraw" ||
    path === "asset-history"
  ) {
    return "Account";
  }
  return "Other";
}

export function commandUsage(command: SchemaCommand): string {
  const positional: string[] = [];
  const flags: string[] = [];

  for (const arg of command.args) {
    if (!arg.long) {
      const name = arg.valueName || arg.name;
      positional.push(arg.required ? `<${name}>` : `[${name}]`);
      continue;
    }
    const value = arg.takesValue ? ` <${arg.valueName || arg.name}>` : "";
    flags.push(arg.required ? `--${arg.long}${value}` : `[--${arg.long}${value}]`);
  }

  return [`orderly ${command.path}`, ...positional, ...flags].join(" ").replace(/\s+/g, " ");
}
