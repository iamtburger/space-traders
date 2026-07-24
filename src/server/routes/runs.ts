import { Router } from "express";
import { z } from "zod";
import { config } from "../config";
import * as journal from "../db/journal";
import { startRun, stopRun } from "../agent/runner";

export const runsRouter = Router();

const createRunSchema = z.object({
  maxSteps: z.number().int().positive().max(1000).optional(),
  maxCostUsd: z.number().positive().max(100).optional(),
  model: z.string().optional(),
});

runsRouter.post("/", (req, res) => {
  const parsed = createRunSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const run = startRun({
    maxSteps: parsed.data.maxSteps ?? config.DEFAULT_MAX_STEPS,
    maxCostUsd: parsed.data.maxCostUsd ?? config.DEFAULT_MAX_COST_USD,
    model: parsed.data.model ?? config.DEFAULT_MODEL,
  });

  res.status(201).json(run);
});

runsRouter.get("/", (_req, res) => {
  res.json(journal.listRuns());
});

runsRouter.get("/:id", (req, res) => {
  const run = journal.getRun(req.params.id);
  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }
  res.json(run);
});

runsRouter.get("/:id/journal", (req, res) => {
  const run = journal.getRun(req.params.id);
  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }
  const sinceId = z.coerce.number().int().nonnegative().default(0).parse(req.query.sinceId);
  res.json(journal.listEntriesSince(req.params.id, sinceId));
});

runsRouter.post("/:id/stop", (req, res) => {
  const run = journal.getRun(req.params.id);
  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }
  const stopped = stopRun(req.params.id);
  res.json({ stopped });
});
