# Space Traders Harness

An AI harness that plays [SpaceTraders](https://spacetraders.io) autonomously using any
supported LLM provider (via the Vercel `ai` SDK), within configurable step/cost limits,
while keeping a journal of every decision and action it takes. A small React dashboard
lets you monitor runs in progress (it does not control gameplay — the agent plays on its
own).

## Stack

- **Server**: Express + TypeScript, `zod` for schema validation, `better-sqlite3` for the
  run/journal store.
- **Agent**: `ai` + a per-provider `@ai-sdk/*` package (currently `@ai-sdk/anthropic` and
  `@ai-sdk/openai`), one tool per SpaceTraders action, a bounded step loop enforcing
  `maxSteps` and `maxCostUsd`.
- **Client**: React + Vite, polls the API to show run status and journal entries.

## Providers & models

A run's `model` is specified as `provider:modelId`, e.g. `anthropic:claude-haiku-4-5-20251001`
or `openai:gpt-4o-mini` (a bare `claude-...`/`gpt-...` id also works — the provider is
inferred from the name). Only set the API key(s) for the provider(s) you actually use.

To add another provider (e.g. Mistral):
1. `npm install @ai-sdk/mistral`
2. Add an entry to `PROVIDERS` in `src/server/agent/providers.ts` and a name-pattern
   branch in `inferProvider`.
3. Add its models' $/M-token rates to `src/server/agent/pricing.ts`.
4. Add its API key to `envSchema` in `src/server/config.ts` and to `.env.example`.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in the API key for whichever provider(s) you
   plan to use (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, ...).
3. Register a SpaceTraders agent and get a token:
   ```
   npm run register-agent -- <callsign>
   ```
   Paste the printed token into `.env` as `SPACETRADERS_TOKEN`.
4. `npm run dev` — starts the API server and the Vite dev server (proxies `/api` to
   the server). Open the Vite URL it prints.

## Starting a run

From the dashboard, set `maxSteps` / `maxCostUsd` / `model` and click "Start run", or
call the API directly:

```
curl -X POST http://localhost:3000/api/runs \
  -H 'Content-Type: application/json' \
  -d '{"maxSteps": 10, "maxCostUsd": 0.25}'
```

The run stops automatically once either limit is hit, or on demand via
`POST /api/runs/:id/stop`.

## Production build

```
npm run build
npm start
```

Serves the built dashboard and API from a single Express process on `PORT`.

## Extending

- **More game actions**: add a client function in `src/server/spacetraders/client.ts`
  (with a zod response schema in `schemas.ts`), then wrap it as a tool in
  `src/server/agent/tools.ts`. The current set covers agent/fleet/waypoint/contract
  basics only.
- **Pricing**: `src/server/agent/pricing.ts` has placeholder $/M-token figures — verify
  against current provider pricing before relying on `maxCostUsd` for real spend.
