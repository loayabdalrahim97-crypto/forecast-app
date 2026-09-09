# Database

PostgreSQL via Prisma. Full schema: `prisma/schema.prisma`.

## Key relationships

- `User` 1–1 `BehavioralProfile` 1–many `BehavioralAnswer`
- `User` 1–many `Forecast` (nullable `userId` supports the pre-signup
  Free Forecast flow, §8)
- `Forecast` 1–many `ForecastVariable` (`kind` discriminates
  fact/assumption/unknown/behavioral/external/controllable/uncontrollable
  — see §11, §50)
- `Forecast` 1–many `Scenario`
- `Forecast` self-relation `parentForecastId` → `updates`: a Forecast
  Update (§17) never overwrites the original; it's a new row linked back
  to its parent, so history is preserved
- `Forecast` 1–1 `OutcomeRecord` (§18)
- `Forecast` 1–1 `BusinessForecast` for Business Decision Mode (§16)
- `User` 1–many `AIRequest` — one row per model call, for cost tracking
  (§22)
- `Team` 1–many `TeamMember` (many-to-many with `User`) for §38

## Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## Soft deletion

`User.deletedAt` supports account-deletion requests (§27) without losing
referential integrity on historical `Forecast`/`AIRequest` rows needed
for aggregate analytics. Hard deletion / anonymization jobs are a Phase
13 (Security) task, not yet implemented.

## Data export

CSV/JSON export (§25) is not yet implemented. When built, it should read
from these same tables — no export-specific shadow schema.
