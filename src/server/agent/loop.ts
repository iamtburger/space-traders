import { generateText, type ModelMessage, type TypedToolError } from "ai";
import { resolveModel } from "./providers";
import { tools } from "./tools";
import { costFor } from "./pricing";
import * as journal from "../db/journal";
import type { RunConfig } from "../types";
import { SpaceTradersApiError } from "../spacetraders/client";

function spaceTradersErrorMessage(body: unknown): string {
  const error = (body as { error?: { message?: string } } | undefined)?.error;
  return error?.message ?? "Bad request.";
}

const SYSTEM_PROMPT = `You are an autonomous agent playing SpaceTraders, a space trading/exploration game reachable through the provided tools.
Your goal is to grow the agent's net worth: explore, accept and fulfill contracts, trade goods profitably, and expand the fleet when it makes sense.
Each turn, briefly state your reasoning, then call exactly one tool to take one concrete action. Use getAgent/listShips/listContracts to orient yourself before acting if you're unsure of the current state.

Basic rules for the game:
# SYSTEM PROMPT: Autonomous SpaceTraders Agent (API v2)

You are an autonomous AI agent playing the game **SpaceTraders API v2**. Your goal is to maximize credits, complete contracts, expand your fleet, and establish efficient trade and extraction loops while operating strictly within the game's state rules and constraints.

---

## 1. CORE OPERATIONAL CONSTRAINTS

### Ship Movement & Navigation
- **In Orbit Required (IN_ORBIT):** You can ONLY execute Navigate, Survey, Mining/Extraction, Siphon, Jump, or Warp actions if the ship is currently IN_ORBIT.
- **Docked Required (IN_DOCKED):** You can ONLY Buy Cargo, Sell Cargo, Refuel, or Fulfill Contracts if the ship is currently IN_DOCKED at a waypoint.
- **System Boundaries:** You can only navigate (/navigate) within the same star system. To change systems, you must use Warp or Jump gates.
- **Fuel Reserves:** Always check ship fuel before navigating. If fuel is insufficient to reach a destination in CRUISE mode, switch flightMode to DRIFT (slower, but minimal fuel cost).
- **Idempotent Transitions:** Calling /orbit while already in orbit or /dock while already docked is safe, but always verify current ship state via status objects.

### Cooldowns & Execution Timing
- **Action Cooldowns:** Actions such as Extract, Survey, Refine, Siphon, Warp, and Jump incur a cooldown.
- **Mandatory Wait:** NEVER issue another action to a ship until ship.cooldown.expiration has passed in UTC time.

### Economy & Cargo
- **Volume Limit:** Check remaining cargo capacity (cargo.capacity - cargo.units) before buying or extracting resources.
- **Dynamic Pricing:** Market prices dynamically shift based on supply and demand. Do not rely on hardcoded prices—re-query market data when docked.

---

## 2. AGENT DECISION-MAKING LOOPS

When deciding the next action for a ship, evaluate which loop the ship belongs to and follow the state sequence step-by-step:

### Loop A: Mining / Extraction
1. Verify ship is at an Asteroid / Extraction Waypoint. If not, navigate there (IN_ORBIT).
2. Ensure ship status is IN_ORBIT.
3. Execute /extract -> Wait for cooldown.expiration.
4. Check cargo:
   - If cargo.units < cargo.capacity: Repeat Extraction loop.
   - If cargo.units == cargo.capacity: Navigate to market -> /dock -> Sell yield -> /refuel -> /orbit -> Return to step 1.

### Loop B: Delivery / Contract Fulfillment
1. Locate required goods via accepted contract or trade route.
2. Navigate to source market -> /dock -> Buy required units -> /refuel -> /orbit.
3. Navigate to target destination -> /dock -> Deliver / Sell cargo -> /refuel -> /orbit.

---

## 3. RESPONSE FORMAT REQUIREMENT

To ensure seamless execution, always output your plan and actions in standard JSON format:


{
  "thought_process": "Brief description of current ship state, goals, and logic.",
  "ship_symbol": "<SHIP_SYMBOL>",
  "current_state": "IN_ORBIT | IN_DOCKED | IN_TRANSIT",
  "cooldown_active": false,
  "action": {
    "type": "ORBIT | DOCK | NAVIGATE | EXTRACT | SELL | REFUEL | BUY",
    "endpoint": "/v2/my/ships/<SHIP_SYMBOL>/<action>",
    "payload": {}
  }
}
`;

export async function runAgentLoop(
  runId: string,
  runConfig: RunConfig,
  abortController: AbortController,
): Promise<void> {
  const messages: ModelMessage[] = [
    {
      role: "user",
      content:
        "Begin. Check your agent status and ships, then decide your first action.",
    },
  ];

  let step = 0;
  let totalCostUsd = 0;

  try {
    while (step < runConfig.maxSteps && totalCostUsd < runConfig.maxCostUsd) {
      if (abortController.signal.aborted) break;

      const result = await generateText({
        model: resolveModel(runConfig.model),
        instructions: SYSTEM_PROMPT,
        messages,
        tools,
        abortSignal: abortController.signal,
      });

      let toolErrorPart: TypedToolError<typeof tools> | undefined;
      for (const part of result.content) {
        if (part.type === "tool-error") {
          toolErrorPart = part;
          break;
        }
      }

      // Bad requests (invalid args, wrong ship state, etc.) are recoverable —
      // let the model see the hint and try again next turn. Anything else
      // (network/auth/server failures) is unexpected, so fail the run.
      if (
        toolErrorPart &&
        !(
          toolErrorPart.error instanceof SpaceTradersApiError &&
          toolErrorPart.error.status === 400
        )
      ) {
        throw toolErrorPart.error;
      }

      step += 1;
      const usage = {
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
      };
      const stepCost = costFor(usage, runConfig.model);
      totalCostUsd += stepCost;

      const toolCall = result.toolCalls[0];
      const toolResult = result.toolResults[0];

      const toolResultForJournal =
        toolErrorPart && toolErrorPart.error instanceof SpaceTradersApiError
          ? { error: spaceTradersErrorMessage(toolErrorPart.error.body) }
          : (toolResult?.output ?? null);

      journal.appendEntry({
        runId,
        stepNumber: step,
        reasoningText: result.text || null,
        toolName: toolCall?.toolName ?? null,
        toolArgs: toolCall?.input ?? null,
        toolResult: toolResultForJournal,
        tokensUsed: usage.inputTokens + usage.outputTokens,
        costUsd: stepCost,
      });
      journal.updateRunProgress(runId, step, totalCostUsd);

      messages.push(...result.responseMessages);

      if (!toolCall) {
        // Model only produced text with no tool call — nudge it to act next turn.
        messages.push({
          role: "user",
          content: "Continue: pick and call a tool for your next action.",
        });
      }
    }

    journal.finishRun(
      runId,
      abortController.signal.aborted ? "stopped" : "completed_limit_reached",
    );
  } catch (err) {
    journal.finishRun(
      runId,
      abortController.signal.aborted ? "stopped" : "errored",
    );
    if (!abortController.signal.aborted) throw err;
  }
}
