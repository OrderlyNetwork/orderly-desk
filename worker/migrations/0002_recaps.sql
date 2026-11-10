CREATE TABLE IF NOT EXISTS recaps (
  day TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  text TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'rules',
  model TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_recaps_created ON recaps (created_at DESC);
