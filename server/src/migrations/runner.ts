import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

export function runMigrations(db: Database.Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`)

  const migrationsDir = path.join(__dirname)
  const files = fs
    .readdirSync(migrationsDir)
    .filter(f => /^\d{3}_[a-z0-9_]+\.sql$/.test(f))
    .sort()

  for (const file of files) {
    const row = db.prepare('SELECT name FROM _migrations WHERE name = ?').get(file)
    if (!row) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      db.transaction(() => {
        db.exec(sql)
        db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file)
      })()
      console.log(`[migrations] Applied: ${file}`)
    }
  }
}
