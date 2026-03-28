CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cancellation_token TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  reason TEXT,
  start_time TEXT NOT NULL,
  cancelled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Only active (non-cancelled) appointments occupy a slot;
-- cancelled slots can be rebooked.
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_start_time ON appointments(start_time) WHERE cancelled = 0;
