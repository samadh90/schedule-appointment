# Database

SQLite file at `server/data/db.sqlite`. Created and migrated automatically on first run.

## Schema

```sql
CREATE TABLE appointments (
  id                  INTEGER  PRIMARY KEY AUTOINCREMENT,
  start_time          DATETIME NOT NULL,
  first_name          TEXT     NOT NULL,
  last_name           TEXT     NOT NULL,
  email               TEXT     NOT NULL,
  reason              TEXT,
  cancellation_token  TEXT     NOT NULL UNIQUE,
  cancelled           INTEGER  NOT NULL DEFAULT 0,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Only one active booking per slot; cancelled slots can be rebooked.
CREATE UNIQUE INDEX uq_appointments_start_time_active
  ON appointments(start_time)
  WHERE cancelled = 0;

CREATE TABLE blocked_dates (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  date       DATE     NOT NULL UNIQUE,
  type       TEXT     NOT NULL,   -- 'holiday' | 'sick' | 'vacation' | 'custom'
  label      TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Migrations

Migrations run automatically at server start via `server/src/migrations/runner.ts`. They are append-only numbered SQL files — never edit an already-applied migration.

| File                            | Description                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `001_create_appointments.sql`   | `appointments` table                                                              |
| `002_create_blocked_dates.sql`  | `blocked_dates` table                                                             |
| `003_seed_holidays.sql`         | Belgian public holidays 2024–2026                                                 |
| `004_fix_start_time_unique.sql` | Replaces table-level UNIQUE with partial index (allows rebooking cancelled slots) |

To add a migration: create `server/src/migrations/NNN_snake_case_name.sql`. The filename must match `/^\d{3}_[a-z0-9_]+\.sql$/`.

## Blocked date types

| Type       | Examples                                  |
| ---------- | ----------------------------------------- |
| `holiday`  | Belgian public holidays (11 Nov, 25 Dec…) |
| `sick`     | Unplanned closure                         |
| `vacation` | Planned closure                           |
| `custom`   | Any other reason                          |
