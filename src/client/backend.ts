export type RunStatus = "running" | "completed_limit_reached" | "stopped" | "errored";

export interface RunRecord {
  id: string;
  status: RunStatus;
  maxSteps: number;
  maxCostUsd: number;
  model: string;
  startedAt: string;
  endedAt: string | null;
  totalSteps: number;
  totalCostUsd: number;
}

export interface JournalEntry {
  id: number;
  runId: string;
  stepNumber: number;
  createdAt: string;
  reasoning: string | null;
  toolName: string | null;
  toolArgs: unknown;
  toolResult: unknown;
  tokensUsed: number;
  costUsd: number;
}

export interface NewRunInput {
  maxSteps?: number;
  maxCostUsd?: number;
  model?: string;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const api = {
  listRuns: (): Promise<RunRecord[]> => fetch("/api/runs").then(json<RunRecord[]>),
  getRun: (id: string): Promise<RunRecord> => fetch(`/api/runs/${id}`).then(json<RunRecord>),
  listJournalSince: (id: string, sinceId: number): Promise<JournalEntry[]> =>
    fetch(`/api/runs/${id}/journal?sinceId=${sinceId}`).then(json<JournalEntry[]>),
  createRun: (input: NewRunInput): Promise<RunRecord> =>
    fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then(json<RunRecord>),
  stopRun: (id: string): Promise<{ stopped: boolean }> =>
    fetch(`/api/runs/${id}/stop`, { method: "POST" }).then(json<{ stopped: boolean }>),
};
