---
description: 'Use when implementing a feature, fixing a bug, or completing any task tracked in ROADMAP.md. Covers how to update task statuses in real time while working.'
---

# Roadmap Status Tracking

## Rule: update ROADMAP.md as you work, not after

Whenever you start or finish a task that maps to a ROADMAP.md entry, update the status **in the same working session** — never leave statuses stale.

## Status values

| Symbol | Meaning     | When to apply                                  |
| ------ | ----------- | ---------------------------------------------- |
| `[ ]`  | Not started | Default — task has not been touched            |
| `[~]`  | In progress | You have started work but not yet completed it |
| `[x]`  | Completed   | Code is written, tested, and works end-to-end  |
| `[!]`  | Blocked     | Cannot proceed — add a note after the row      |

## Workflow

1. **Before touching a file**: find the matching task(s) in ROADMAP.md, mark them `[~]`
2. **After the task works end-to-end**: mark it `[x]`
3. **If you discover a blocker**: mark `[!]` and append a brief inline note, e.g.:
   ```
   | 4.7 | Atomic insert … | `[!]` | ← blocked: better-sqlite3 v12 WAL conflict, see issue #12 |
   ```
4. **If a new task emerges** that wasn't in the roadmap, add it to the appropriate phase before starting work.

## Scope mapping

| Files you touch              | Phase / tasks to update     |
| ---------------------------- | --------------------------- |
| `server/src/index.ts`        | Phase 1 (skeleton), Phase 2 |
| `server/src/config.ts`       | 2.6, 2.8                    |
| `server/src/db/`             | 2.1, 2.2                    |
| `server/src/migrations/`     | 2.3, 2.4, 2.5               |
| `server/src/routes/health`   | 1.6                         |
| `server/src/routes/config`   | 2.7                         |
| `server/src/routes/blocked*` | 3.1, 3.2                    |
| `server/src/routes/appoint*` | 4.1–4.12                    |
| `client/src/stores/`         | 5.1–5.3                     |
| `client/src/composables/`    | 5.4, 1.7                    |
| `client/src/components/`     | 5.6, 5.7, 1.8               |
| `client/src/views/Slot*`     | 5.5, 5.8                    |
| `client/src/views/Book*`     | 6.1–6.5                     |
| `client/src/views/Cancel*`   | 7.1–7.4                     |
| `client/src/router/`         | 8.1                         |
| `client/src/App.vue`         | 1.9, 8.4                    |

## Do not batch updates

Mark `[x]` immediately after each task completes — do not wait until the end of a session to update multiple tasks at once. This keeps the roadmap accurate as a real-time progress tracker.
