PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  strategy TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  interval_minutes INTEGER NOT NULL DEFAULT 6,
  initial_equity REAL,
  last_run_at INTEGER,
  locked_until INTEGER,
  last_action TEXT,
  last_reason TEXT,
  last_order_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  status TEXT NOT NULL,
  action TEXT,
  reason TEXT,
  error TEXT,
  indicators_json TEXT
);

CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  run_id INTEGER,
  created_at INTEGER NOT NULL,
  action TEXT NOT NULL,
  symbol TEXT NOT NULL,
  price REAL,
  quantity REAL,
  order_id TEXT,
  reason TEXT,
  source TEXT,
  indicators_json TEXT
);

CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  ts INTEGER NOT NULL,
  equity REAL,
  balance REAL,
  position_qty REAL,
  entry_price REAL,
  mark_price REAL,
  unrealized_pnl REAL,
  realized_pnl REAL
);

CREATE INDEX IF NOT EXISTS idx_runs_agent ON runs (agent_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_created ON decisions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_agent ON decisions (agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_agent ON snapshots (agent_id, ts DESC);
