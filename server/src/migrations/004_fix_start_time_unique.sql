-- Replace the table-level UNIQUE(start_time) constraint with a partial unique index
-- so that cancelled slots can be rebooked.
-- SQLite requires a full table recreation to drop a constraint.

CREATE TABLE appointments_new (
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

INSERT INTO appointments_new SELECT * FROM appointments;

DROP TABLE appointments;

ALTER TABLE appointments_new RENAME TO appointments;

-- Only active (non-cancelled) appointments occupy a slot
CREATE UNIQUE INDEX idx_active_start_time ON appointments(start_time) WHERE cancelled = 0;
