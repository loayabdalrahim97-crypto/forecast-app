# Architecture

## System overview

```
Frontend (Next.js, locale-routed)
   → Backend (Next.js route handlers / server actions)
      → AIOrchestrator            (src/lib/ai/orchestrator.ts)
         → ModelRouter             (src/lib/ai/model-router.ts)
         → AIProviderFactory       (src/lib/ai/provider-factory.ts)
            → AIProvider impl      (src/lib/ai/providers/*.ts)
               → Vendor API
      ← Structured JSON, schema-validated (zod)
   → Prisma → PostgreSQL
   ← Frontend
```

Every AI call goes through `AIOrchestrator.run()`. Nothing else in the
codebase is permitted to call a vendor SDK directly — that's what makes
provider swaps (§20) and cost tracking (§22) possible without touching
the Forecast Engine.

## Phase plan

| Phase | Scope | Status |
|---|---|---|
| 1 | Repository, architecture, design system, database, auth, i18n | **Scaffolded (this commit)** |
| 2 | Behavioral Profile (onboarding, storage, update flow) | Not started |
| 3 | Situation Analyzer (facts/assumptions/unknowns extraction) | Schema scaffolded (`schemas/scenario.ts`), engine not built |
| 4 | Forecast Engine (scenario generation, likelihood/impact) | Schema scaffolded, engine not built |
| 5 | Scenario UI | Not started |
| 6 | Decision Mode | Not started |
| 7 | Business Mode | Not started |
| 8 | History, Forecast Updates, Outcome Tracking | Data model exists, UI/logic not built |
| 9 | Personalization Engine | Not started |
| 10 | Stripe, Credits, Subscriptions, Referrals | Data model exists, integration not built |
| 11 | Admin, Analytics, AI Cost dashboards | Data model exists, UI not built |
| 12 | SEO, localized routes, sharing, growth infra | Not started |
| 13 | Security hardening, full test suite, performance, mobile QA | Not started |
| 14 | Full documentation set, deployment, acquisition handoff | This doc set is a starting skeleton |

## Data integrity rule (§50, enforced in code)

The system must never convert:
`assumption → fact`, `fear → evidence`, `possibility → certainty`,
`correlation → causation`, `behavioral tendency → diagnosis`.

This is enforced structurally: `ForecastVariable.kind` keeps facts,
assumptions, and unknowns in separate rows (never merged into one blob),
and `ScenarioSchema` (`src/lib/ai/schemas/scenario.ts`) restricts
likelihood/confidence/impact to `low | moderate | high` bands — no
fabricated decimal precision.

## Language vs. country

Kept as separate fields throughout (`User.preferredLanguage` vs.
`User.countryCode`) per §3. Resolution order lives in
`src/lib/i18n/config.ts::resolveLocale()`.

## Known gaps at end of Phase 1

- No actual AI prompts for scenario generation are written yet — only the
  transport, routing, and validation layers around where they'll plug in.
- No UI beyond a bare locale-aware layout shell.
- No Stripe, no admin dashboard, no analytics collection.
- No deployed infrastructure — this is source code only.
