import { db } from "./index";
import type { StrategyNote } from "../types";

interface StrategyNoteRow {
  id: number;
  created_at: string;
  note: string;
}

function toStrategyNote(row: StrategyNoteRow): StrategyNote {
  return { id: row.id, createdAt: row.created_at, note: row.note };
}

export function addStrategyNote(note: string): StrategyNote {
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(`INSERT INTO strategy_notes (created_at, note) VALUES (@createdAt, @note)`)
    .run({ createdAt, note });
  return { id: Number(result.lastInsertRowid), createdAt, note };
}

// Most recent notes first in storage order, returned oldest-first so they read
// as a chronological log when rendered into the system prompt.
export function listStrategyNotes(limit = 50): StrategyNote[] {
  const rows = db
    .prepare(`SELECT * FROM strategy_notes ORDER BY id DESC LIMIT ?`)
    .all(limit) as StrategyNoteRow[];
  return rows.map(toStrategyNote).reverse();
}
