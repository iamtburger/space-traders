import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { config } from "../config";

// To add another provider (e.g. Mistral): install its @ai-sdk/* package, add an
// entry to PROVIDERS below, and add a name-pattern branch in inferProvider.
export type ProviderName = "anthropic" | "openai" | "local";

interface ProviderDef {
  create(modelId: string): LanguageModel;
  apiKeyEnvVar?: string | undefined | null;
  hasApiKey(): boolean;
}

const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  baseURL: "http://localhost:1234/v1",
});

const PROVIDERS: Record<ProviderName, ProviderDef> = {
  anthropic: {
    create: (modelId) => anthropic(modelId),
    apiKeyEnvVar: "ANTHROPIC_API_KEY",
    hasApiKey: () => Boolean(config.ANTHROPIC_API_KEY),
  },
  openai: {
    create: (modelId) => openai(modelId),
    apiKeyEnvVar: "OPENAI_API_KEY",
    hasApiKey: () => Boolean(config.OPENAI_API_KEY),
  },
  local: {
    create: () => lmstudio(""),
    hasApiKey: () => true,
  },
};

function inferProvider(modelId: string): ProviderName {
  if (/^claude-/.test(modelId)) return "anthropic";
  if (/^(gpt-|o[1-9]|chatgpt)/.test(modelId)) return "openai";
  if (modelId === "lmstudio") return "local";
  throw new Error(
    `Cannot infer a provider for model "${modelId}". Prefix it explicitly, e.g. "openai:${modelId}".`,
  );
}

export interface ParsedModel {
  provider: ProviderName;
  modelId: string;
}

export function parseModelSpec(spec: string): ParsedModel {
  const colonIndex = spec.indexOf(":");
  if (colonIndex === -1) {
    return { provider: inferProvider(spec), modelId: spec };
  }
  const provider = spec.slice(0, colonIndex);
  const modelId = spec.slice(colonIndex + 1);
  if (!(provider in PROVIDERS)) {
    throw new Error(
      `Unknown provider "${provider}" in model "${spec}". Supported providers: ${Object.keys(PROVIDERS).join(", ")}.`,
    );
  }
  return { provider: provider as ProviderName, modelId };
}

export function resolveModel(spec: string): LanguageModel {
  const { provider, modelId } = parseModelSpec(spec);
  const def = PROVIDERS[provider];
  if (!def.hasApiKey()) {
    throw new Error(
      `${def.apiKeyEnvVar} is not set — required to use the "${provider}" provider.`,
    );
  }
  return def.create(modelId);
}
