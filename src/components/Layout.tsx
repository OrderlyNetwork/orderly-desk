import { Link, NavLink, Outlet } from "react-router-dom";
import { versions } from "../lib/versions";

const links = [
  { to: "/walkthrough", label: "Walkthrough" },
  { to: "/dashboard", label: "Agents" },
  { to: "/reference", label: "Reference" },
];

const footerLinks = [
  { href: "https://orderly.network", label: "Orderly Network" },
  { href: "https://github.com/OrderlyNetwork/cli", label: "CLI on GitHub" },
  { href: "https://orderly.network/docs", label: "Documentation" },
];

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
              title="All trading in this showcase happens on testnet"
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
        <div className="shell grid gap-8 border-b border-white/10 pb-12 md:grid-cols-[1.4fr_0.5fr_0.5fr] md:gap-12">
          <div>
            <div className="flex items-center gap-3">
              <img src="/orderly-white.svg" alt="Orderly" className="h-[18px] w-auto opacity-95" />
              <span className="h-4 w-px bg-white/15" aria-hidden="true" />
              <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-muted">Desk</span>
            </div>
            <p className="mt-4 max-w-[380px] text-[13px] leading-relaxed text-dim">
              A live agentic trading showcase built on the Orderly Network CLI. The demo
              agents run on testnet; the CLI itself supports mainnet and testnet.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 text-[13px] text-muted">
            {footerLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 text-[13px] text-muted">
            <Link to="/walkthrough" className="transition-colors hover:text-ink">
              Walkthrough
            </Link>
            <Link to="/dashboard" className="transition-colors hover:text-ink">
              Agents
            </Link>
            <Link to="/reference" className="transition-colors hover:text-ink">
              Command reference
            </Link>
            <a href="/llms.txt" className="transition-colors hover:text-ink">
              For agents
            </a>
            <a href="/mcp.md" className="transition-colors hover:text-ink">
              MCP guide
            </a>
          </div>
        </div>

        <div className="shell flex flex-col justify-between gap-1.5 pt-5 text-[12px] text-dim sm:flex-row">
          <span>Testnet demo · no real funds · CLI supports mainnet + testnet</span>
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono">
            <a
              href={versions.cli.url}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-muted"
            >
              orderly {versions.cli.version}
            </a>
            <span className="text-white/20" aria-hidden="true">
              ·
            </span>
            <a
              href={versions.tradingMcp.url}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-muted"
            >
              trading-mcp {versions.tradingMcp.version}
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
