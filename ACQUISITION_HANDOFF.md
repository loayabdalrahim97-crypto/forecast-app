# Acquisition Handoff

**Status: Phase 1 only.** This document will be filled in fully as each
phase (see `ARCHITECTURE.md`) lands. Right now it exists as a skeleton so
the structure is established early rather than bolted on at the end.

## What exists today

- Next.js app skeleton with locale-based routing (`src/app/[locale]`)
  and RTL support for Arabic
- Full Prisma/PostgreSQL schema covering users, behavioral profiles,
  forecasts, scenarios, outcome tracking, billing, referrals, analytics,
  and teams (`prisma/schema.prisma`) — not yet migrated against a live
  database
- Vendor-agnostic AI orchestration layer with Anthropic implemented
  (`src/lib/ai/`)
- Credentials-based auth scaffold (NextAuth) — not yet wired to signup UI
- `.env.example` documenting every required secret; no secrets committed

## What does not exist yet

Everything under Phases 2–14 in `ARCHITECTURE.md`: the actual
forecasting logic and prompts, the UI beyond a bare layout, Stripe
billing, admin dashboard, analytics collection, SEO content, and any
deployed infrastructure.

## How to deploy (once later phases land)

1. Provision a PostgreSQL instance, set `DATABASE_URL`.
2. Set `ANTHROPIC_API_KEY` (and any other providers wired up later).
3. `npx prisma migrate deploy`.
4. Deploy the Next.js app to any Node-compatible host (Vercel, Railway,
   Fly.io, etc.) — no platform-specific code has been introduced.

## How to change AI providers

See `docs/AI_ARCHITECTURE.md` → "Adding a new provider." No business
logic references a vendor by name outside `src/lib/ai/providers/` and
`provider-factory.ts`.

## Known limitations / technical debt at this stage

- No prompts written yet for any AI request type.
- No tests written yet (test tooling — Vitest — is configured but empty).
- No rate limiting / abuse prevention implemented (§8, §26 requirement,
  not yet built).
- No CI security scanning beyond lint/typecheck/build.
