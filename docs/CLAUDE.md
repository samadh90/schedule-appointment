# docs/

Reference documentation for the project. These files are the canonical source for human-facing docs (README links here). They are **not** duplicated in the root/client/server CLAUDE.md files — those stay code-focused.

## Index

| File               | Contents                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `api.md`           | Full API reference: endpoints, request/response shapes, validation rules, rate limits                  |
| `architecture.md`  | System diagram, slot generation model, Socket.IO events, business rules, timezone handling, resilience |
| `configuration.md` | All env vars (`PORT`, `TENANT_CONFIG`, `ALLOWED_ORIGINS`), TENANT_CONFIG key reference, CORS setup     |
| `database.md`      | Schema, migration list, migration naming convention                                                    |
| `deployment.md`    | Production build steps, sub-path deployment, env setup, reverse proxy config                           |
| `design-system.md` | Colour palette, Tailwind class conventions, component shapes, UI rules                                 |

## Known gaps / in-progress (do not treat as ground truth yet)

The following docs describe **planned or in-progress** features — they are ahead of the code:

- **`database.md` — `blocked_dates` schema**: documents a `type` column (`'holiday' | 'sick' | 'vacation' | 'custom'`) and a "Blocked date types" section that do not exist in the current migration (`002_create_blocked_dates.sql`). Actual table is `id, date TEXT UNIQUE, label TEXT`.
- **`deployment.md` — SPA static serving**: describes `NODE_ENV=production` causing Express to serve `client/dist/`. This is not yet implemented in `server/src/index.ts`.

Before implementing anything based on these docs, verify against the actual migration files and `server/src/index.ts`.

## Rules

- Keep docs in sync with code. When a planned feature ships, update the relevant doc.
- The design system rules in `design-system.md` (no arbitrary Tailwind values, all strings via `t()`, all i18n keys in all three locales) apply to every UI change — they are not optional.
