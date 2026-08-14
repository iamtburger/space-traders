import { db } from "./index";
import type { JournalEntry, RunConfig, RunRecord, RunStatus } from "../types";

interface RunRow {
  id: string;
  status: RunStatus;
  max_steps: number;
  max_cost_usd: number;
  model: string;
  started_at: string;
  ended_at: string | null;
  total_steps: number;
  total_cost_usd: number;
}

interface JournalRow {
  id: number;
  run_id: string;
  step_number: number;
  created_at: string;
  reasoning: string | null;
  tool_name: string | null;
  tool_args: string | null;
  tool_result: string | null;
  tokens_used: number;
  cost_usd: number;
}

function toRunRecord(row: RunRow): RunRecord {
  return {
    id: row.id,
    status: row.status,
    maxSteps: row.max_steps,
    maxCostUsd: row.max_cost_usd,
    model: row.model,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    totalSteps: row.total_steps,
    totalCostUsd: row.total_cost_usd,
  };
}

function toJournalEntry(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    runId: row.run_id,
    stepNumber: row.step_number,
    createdAt: row.created_at,
    reasoningText: row.reasoning,
    toolName: row.tool_name,
    toolArgs: row.tool_args ? JSON.parse(row.tool_args) : null,
    toolResult: row.tool_result ? JSON.parse(row.tool_result) : null,
    tokensUsed: row.tokens_used,
    costUsd: row.cost_usd,
  };
}

export function createRun(id: string, runConfig: RunConfig): RunRecord {
  const startedAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO runs (id, status, max_steps, max_cost_usd, model, started_at, total_steps, total_cost_usd)
     VALUES (@id, 'running', @maxSteps, @maxCostUsd, @model, @startedAt, 0, 0)`
  ).run({ id, startedAt, ...runConfig });
  return getRun(id)!;
}

export function getRun(id: string): RunRecord | null {
  const row = db.prepare("SELECT * FROM runs WHERE id = ?").get(id) as RunRow | undefined;
  return row ? toRunRecord(row) : null;
}

export function listRuns(): RunRecord[] {
  const rows = db.prepare("SELECT * FROM runs ORDER BY started_at DESC").all() as RunRow[];
  return rows.map(toRunRecord);
}

export function updateRunProgress(id: string, totalSteps: number, totalCostUsd: number): void {
  db.prepare("UPDATE runs SET total_steps = ?, total_cost_usd = ? WHERE id = ?").run(
    totalSteps,
    totalCostUsd,
    id
  );
}

export function finishRun(id: string, status: RunStatus): void {
  db.prepare("UPDATE runs SET status = ?, ended_at = ? WHERE id = ?").run(
    status,
    new Date().toISOString(),
    id
  );
}

export function appendEntry(entry: Omit<JournalEntry, "id" | "createdAt">): JournalEntry {
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO journal_entries
        (run_id, step_number, created_at, reasoning, tool_name, tool_args, tool_result, tokens_used, cost_usd)
       VALUES (@runId, @stepNumber, @createdAt, @reasoning, @toolName, @toolArgs, @toolResult, @tokensUsed, @costUsd)`
    )
    .run({
      runId: entry.runId,
      stepNumber: entry.stepNumber,
      createdAt,
      reasoning: entry.reasoningText,
      toolName: entry.toolName,
      toolArgs: entry.toolArgs != null ? JSON.stringify(entry.toolArgs) : null,
      toolResult: entry.toolResult != null ? JSON.stringify(entry.toolResult) : null,
      tokensUsed: entry.tokensUsed,
      costUsd: entry.costUsd,
    });
  return { ...entry, id: Number(result.lastInsertRowid), createdAt };
}

export function listEntriesSince(runId: string, sinceId: number): JournalEntry[] {
  const rows = db
    .prepare("SELECT * FROM journal_entries WHERE run_id = ? AND id > ? ORDER BY id ASC")
    .all(runId, sinceId) as JournalRow[];
  return rows.map(toJournalEntry);
}
