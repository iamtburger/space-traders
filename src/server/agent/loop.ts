import { generateText, type CoreMessage } from "ai";
import { resolveModel } from "./providers";
import { tools } from "./tools";
import { costFor } from "./pricing";
import * as journal from "../db/journal";
import type { RunConfig } from "../types";

const SYSTEM_PROMPT = `You are an autonomous agent playing SpaceTraders, a space trading/exploration game reachable through the provided tools.
Your goal is to grow the agent's net worth: explore, accept and fulfill contracts, trade goods profitably, and expand the fleet when it makes sense.
Each turn, briefly state your reasoning, then call exactly one tool to take one concrete action. Use getAgent/listShips/listContracts to orient yourself before acting if you're unsure of the current state.`;

export async function runAgentLoop(
  runId: string,
  runConfig: RunConfig,
  abortController: AbortController
): Promise<void> {
  const messages: CoreMessage[] = [
    { role: "user", content: "Begin. Check your agent status and ships, then decide your first action." },
  ];

  let step = 0;
  let totalCostUsd = 0;

  try {
    while (step < runConfig.maxSteps && totalCostUsd < runConfig.maxCostUsd) {
      if (abortController.signal.aborted) break;

      const result = await generateText({
        model: resolveModel(runConfig.model),
        system: SYSTEM_PROMPT,
        messages,
        tools,
        maxSteps: 1,
        abortSignal: abortController.signal,
      });

      step += 1;
      const usage = {
        promptTokens: result.usage?.promptTokens ?? 0,
        completionTokens: result.usage?.completionTokens ?? 0,
      };
      const stepCost = costFor(usage, runConfig.model);
      totalCostUsd += stepCost;

      const toolCall = result.toolCalls[0];
      const toolResult = result.toolResults[0];

      journal.appendEntry({
        runId,
        stepNumber: step,
        reasoning: result.text || null,
        toolName: toolCall?.toolName ?? null,
        toolArgs: toolCall?.args ?? null,
        toolResult: (toolResult as { result?: unknown } | undefined)?.result ?? null,
        tokensUsed: usage.promptTokens + usage.completionTokens,
        costUsd: stepCost,
      });
      journal.updateRunProgress(runId, step, totalCostUsd);

      messages.push(...result.response.messages);

      if (!toolCall) {
        // Model only produced text with no tool call — nudge it to act next turn.
        messages.push({ role: "user", content: "Continue: pick and call a tool for your next action." });
      }
    }

    journal.finishRun(runId, abortController.signal.aborted ? "stopped" : "completed_limit_reached");
  } catch (err) {
    journal.finishRun(runId, abortController.signal.aborted ? "stopped" : "errored");
    if (!abortController.signal.aborted) throw err;
  }
}
