export type RunStatus = "running" | "completed_limit_reached" | "stopped" | "errored";

export interface RunConfig {
  maxSteps: number;
  maxCostUsd: number;
  model: string;
}

export interface RunRecord extends RunConfig {
  id: string;
  status: RunStatus;
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
  reasoningText: string | null;
  toolName: string | null;
  toolArgs: unknown;
  toolResult: unknown;
  tokensUsed: number;
  costUsd: number;
}
