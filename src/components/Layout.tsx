import { Link, NavLink, Outlet } from "react-router-dom";
import { versions } from "../lib/versions";

const links = [
  { to: "/walkthrough", label: "Walkthrough" },
  { to: "/dashboard", label: "Agents" },
  { to: "/reference", label: "Reference" },
];

type FooterLink = {
  label: string;
  to?: string;
  href?: string;
};

const footerColumns: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Showcase",
    links: [
      { label: "Live agents", to: "/dashboard" },
      { label: "Walkthrough", to: "/walkthrough" },
      { label: "Command reference", to: "/reference" },
      { label: "Source on GitHub", href: "https://github.com/OrderlyNetwork/orderly-desk" },
    ],
  },
  {
    title: "Agents",
    links: [
      {
        label: "Agents API",
        href: "https://orderly-desk-agents.orderlynetwork.workers.dev/health",
      },
      { label: "MCP guide", href: "/mcp.md" },
      { label: "Agent docs", href: "/llms.txt" },
      { label: "Version data", href: "/versions.json" },
    ],
  },
  {
    title: "Orderly",
    links: [
      { label: "Orderly Network", href: "https://orderly.network" },
      { label: "Testnet dashboard", href: "https://testnet-orderly-dashboard.orderly.network" },
      { label: "Mainnet dashboard", href: "https://dashboard.orderly.network" },
      { label: "Docs", href: "https://orderly.network/docs" },
      { label: "CLI on GitHub", href: "https://github.com/OrderlyNetwork/cli" },
    ],
  },
];

const socialLinks = [
  { label: "X", href: "https://x.com/OrderlyNetwork" },
  { label: "Discord", href: "https://discord.com/invite/OrderlyNetwork" },
  { label: "Telegram", href: "https://t.me/Orderly_Discussions" },
  { label: "GitHub", href: "https://github.com/OrderlyNetwork" },
];

function FooterItem({ link }: { link: FooterLink }) {
  const className =
    "text-[13px] leading-relaxed text-[#e9deff] transition-colors hover:text-white";
  if (link.to) {
    return (
      <Link to={link.to} className={className}>
        {link.label}
      </Link>
    );
  }
  return (
    <a href={link.href} target="_blank" rel="noreferrer" className={className}>
      {link.label}
    </a>
  );
}

export default function Layout() {
  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-bg/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="shell flex min-h-[60px] items-center gap-4 md:min-h-[68px] md:gap-8">
          <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="The Orderly Desk, home">
            <img src="/orderly-white.svg" alt="Orderly" className="h-5 w-auto opacity-95" />
            <span className="h-[18px] w-px bg-white/15" aria-hidden="true" />
            <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-muted">Desk</span>
          </Link>

          <nav className="ml-2 hidden items-center gap-6 md:flex" aria-label="Primary">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm transition-colors ${
                    isActive ? "text-ink" : "text-muted hover:text-ink"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <span
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-panel/60 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted md:inline-flex"
              title="The demo agents trade testnet; the CLI supports mainnet and testnet"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gain" aria-hidden="true" />
              Testnet demo
            </span>
            <Link
              to="/dashboard"
              className="inline-flex min-h-9 items-center justify-center rounded-lg bg-accent px-3.5 text-[13px] font-semibold text-bg transition hover:bg-[#b092ff]"
            >
              Live agents
            </Link>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="pt-14 pb-8">
        <div className="shell">
          <div className="rounded-[28px] bg-[#6700ce] p-6 md:p-10">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_1.95fr]">
              <div>
                <div className="flex items-center gap-3">
                  <img src="/orderly-white.svg" alt="Orderly" className="h-[20px] w-auto" />
                  <span className="h-5 w-px bg-white/30" aria-hidden="true" />
                  <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-white/80">
                    Desk
                  </span>
                </div>
                <p className="mt-4 max-w-[370px] text-[13px] leading-relaxed text-white/75">
                  A live agentic trading showcase built on the Orderly Network CLI.
                  Three testnet agents, one read-only desk, and the CLI as the control
                  plane.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 font-mono text-[9.5px] uppercase tracking-[0.09em] text-white/85">
                  <span className="h-1.5 w-1.5 rounded-full bg-gain animate-live" aria-hidden="true" />
                  3 agents online · testnet
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                {footerColumns.map((column) => (
                  <div key={column.title} className="flex flex-col gap-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.11em] text-white/55">
                      {column.title}
                    </div>
                    {column.links.map((link) => (
                      <FooterItem key={link.label} link={link} />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-5">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-white/55">
                Built on Orderly · CLI + Workers
              </span>
              <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.08em] text-white/70">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-white"
                  >
                    {link.label} ↗
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 font-mono text-[10px] text-dim">
            <span>© 2026 Orderly Network · showcase</span>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="https://orderly.network/docs/introduction/terms-of-service"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-muted"
              >
                Terms
              </a>
              <a
                href="https://orderly.network/docs/introduction/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-muted"
              >
                Privacy
              </a>
              <a
                href={versions.cli.url}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-muted"
              >
                orderly {versions.cli.version}
              </a>
              <a
                href={versions.tradingMcp.url}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-muted"
              >
                trading-mcp {versions.tradingMcp.version}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
