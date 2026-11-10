import versionsJson from "../data/versions.json";

export interface Versions {
  checkedAt: string;
  showcase: string;
  cli: {
    version: string;
    tag: string;
    publishedAt: string | null;
    url: string;
    verifiedWith: string;
  };
  tradingMcp: {
    version: string;
    package: string;
    command: string;
    url: string;
  };
  mcpRegistry: {
    name: string;
    version: string | null;
    status: string;
    url: string;
  };
}

export const versions = versionsJson as unknown as Versions;

export const cliLabel = `orderly ${versions.cli.version}`;
export const mcpLabel = `${versions.tradingMcp.command} ${versions.tradingMcp.version}`;
export const mcpRegistryLabel =
  versions.mcpRegistry.version == null
    ? "registry pending"
    : `registry ${versions.mcpRegistry.version}`;

export function cliVersionDetail(): string {
  if (versions.cli.version === versions.cli.verifiedWith) {
    return `verified with ${versions.cli.verifiedWith}`;
  }
  return `latest ${versions.cli.version} · walkthrough verified with ${versions.cli.verifiedWith}`;
}
