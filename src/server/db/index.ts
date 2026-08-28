import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "../config";

const dbDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(config.DB_PATH);
db.pragma("journal_mode = WAL");

// Read migrations straight from source (not the compiled dist dir) since they're
// plain .sql files tsc won't copy on build; both `npm run dev` and `npm start` run
// from the project root.
//
// Applied migrations are tracked so each file only runs once — required for
// migrations like column drops that aren't safe to re-run with CREATE-IF-NOT-EXISTS.
db.exec(
  "CREATE TABLE IF NOT EXISTS _migrations (filename TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
);
const applied = new Set(
  (db.prepare("SELECT filename FROM _migrations").all() as { filename: string }[]).map(
    (row) => row.filename,
  ),
);

const migrationsDir = path.join(process.cwd(), "src/server/db/migrations");
for (const file of fs.readdirSync(migrationsDir).sort()) {
  if (file.endsWith(".sql") && !applied.has(file)) {
    db.exec(fs.readFileSync(path.join(migrationsDir, file), "utf-8"));
    db.prepare("INSERT INTO _migrations (filename, applied_at) VALUES (?, ?)").run(
      file,
      new Date().toISOString(),
    );
  }
}
