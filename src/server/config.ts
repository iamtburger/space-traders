import { z } from 'zod/v3';

// dotenv turns "KEY=" into an empty string rather than leaving it unset, so an
// optional key needs empty string treated as "not set" too.
const optionalKey = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().min(1).optional()
);

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  // Provider API keys are optional here — only the one matching the model(s) you
  // actually run needs to be set. providers.ts raises a clear error otherwise.
  ANTHROPIC_API_KEY: optionalKey,
  OPENAI_API_KEY: optionalKey,
  SPACETRADERS_TOKEN: z.string().min(1, "SPACETRADERS_TOKEN is required"),
  DEFAULT_MODEL: z.string().default("anthropic:claude-haiku-4-5-20251001"),
  DEFAULT_MAX_STEPS: z.coerce.number().int().positive().default(25),
  DEFAULT_MAX_COST_USD: z.coerce.number().positive().default(0.5),
  DB_PATH: z.string().default("data/journal.sqlite"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error(
    "Fix the environment variables above (see .env.example) before starting the server.",
  );
}

export const config = parsed.data;
