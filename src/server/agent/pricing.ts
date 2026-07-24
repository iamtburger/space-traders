import { parseModelSpec } from "./providers";

// TODO: verify current pricing before relying on cost limits for real spend.
// Figures are USD per million tokens, keyed by "provider:modelId".
const PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
  "anthropic:claude-haiku-4-5-20251001": { inputPerMillion: 1, outputPerMillion: 5 },
  "anthropic:claude-sonnet-5": { inputPerMillion: 3, outputPerMillion: 15 },
  "anthropic:claude-opus-4-8": { inputPerMillion: 15, outputPerMillion: 75 },
  "openai:gpt-4o": { inputPerMillion: 2.5, outputPerMillion: 10 },
  "openai:gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
};

const FALLBACK_PRICING = { inputPerMillion: 3, outputPerMillion: 15 };

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export function costFor(usage: TokenUsage, model: string): number {
  const { provider, modelId } = parseModelSpec(model);
  const pricing = PRICING[`${provider}:${modelId}`] ?? FALLBACK_PRICING;
  const inputCost = (usage.promptTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (usage.completionTokens / 1_000_000) * pricing.outputPerMillion;
  return inputCost + outputCost;
}
