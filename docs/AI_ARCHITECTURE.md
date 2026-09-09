# AI Architecture

## Layers

1. **`AIProvider` interface** (`src/lib/ai/provider.ts`) — vendor contract.
2. **Vendor implementations** (`src/lib/ai/providers/*.ts`) — Anthropic is
   implemented; OpenAI/Google are stubbed as commented registry entries in
   `provider-factory.ts` and should follow the same interface.
3. **`AIProviderFactory`** — resolves a provider id string to an instance.
   No other file imports a vendor SDK.
4. **`ModelRouter`** — maps a request type (e.g.
   `"scenario_generation"`) to a cost tier (`cheap` / `standard` /
   `premium`). This is the §21 routing table, in one place, fully
   configurable.
5. **`AIOrchestrator`** — the only entry point the rest of the app calls.
   Handles retry-on-failure and JSON schema validation (via `zod`) before
   any AI output reaches the database or UI (§23).

## Adding a new provider

1. Implement `AIProvider` in `src/lib/ai/providers/<name>.ts`.
2. Register it in `provider-factory.ts`.
3. Nothing else changes — the orchestrator, router, and Forecast Engine
   are provider-agnostic by construction.

## Cost tracking (§22)

`AIOrchestrator.run()` returns a `meta` object with token counts and
latency for every call. The caller (a route handler / server action) is
responsible for writing this into an `AIRequest` row alongside `userId`
and `forecastId`. This module intentionally does not touch Prisma
directly, so it can be unit tested without a database.

## Output validation (§23)

All structured AI output must be described by a `zod` schema (see
`src/lib/ai/schemas/scenario.ts` for the scenario-generation example).
`AIOrchestrator` retries once on a malformed/unparseable response, then
throws `AIValidationError` — callers must catch this and show a
controlled error, never let it propagate as an unhandled crash.

## Prompts

Not yet written. When they are, they should live under
`src/lib/ai/prompts/` as versioned template files (not inline strings
scattered through route handlers), so `docs/ACQUISITION_HANDOFF.md` can
point a future team at a single directory for "how does the AI actually
reason about a situation."
