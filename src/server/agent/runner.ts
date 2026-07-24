import crypto from "node:crypto";
import { runAgentLoop } from "./loop";
import * as journal from "../db/journal";
import type { RunConfig, RunRecord } from "../types";

// Tracks control state (abort) for runs currently executing. Run *data* lives in
// SQLite via db/journal.ts — this map only exists so `stop` can reach a live loop.
const activeRuns = new Map<string, AbortController>();

export function startRun(runConfig: RunConfig): RunRecord {
  const id = crypto.randomUUID();
  const run = journal.createRun(id, runConfig);

  const abortController = new AbortController();
  activeRuns.set(id, abortController);

  runAgentLoop(id, runConfig, abortController)
    .catch((err) => {
      console.error(`Run ${id} failed:`, err);
    })
    .finally(() => {
      activeRuns.delete(id);
    });

  return run;
}

export function stopRun(id: string): boolean {
  const abortController = activeRuns.get(id);
  if (!abortController) return false;
  abortController.abort();
  return true;
}
