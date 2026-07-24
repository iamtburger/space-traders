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
const migrationsDir = path.join(process.cwd(), "src/server/db/migrations");
for (const file of fs.readdirSync(migrationsDir).sort()) {
  if (file.endsWith(".sql")) {
    db.exec(fs.readFileSync(path.join(migrationsDir, file), "utf-8"));
  }
}
