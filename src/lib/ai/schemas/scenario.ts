import { z } from "zod";

// Enforces §13 (no fake precision — likelihood is a band, not "73.482%")
// and §50 (never let assumption/fear/possibility present itself as fact).
const LikelihoodBand = z.enum(["low", "moderate", "high"]);
const ConfidenceBand = z.enum(["low", "moderate", "high"]);
const ImpactBand = z.enum(["low", "moderate", "high"]);

export const ScenarioOutcomeType = z.enum([
  "best_case",
  "most_likely",
  "worst_case",
  // Decision Paths mode only (§ Decision Options fix): one scenario
  // set per named alternative, each tagged positive/mixed/negative
  // rather than best/likely/worst — "most likely" doesn't make sense
  // per-path (that framing belongs to the overall situation, not to
  // one specific choice among several).
  "positive",
  "mixed",
  "negative",
]);

export const ScenarioSchema = z.object({
  outcomeType: ScenarioOutcomeType,
  // Which named decision path this scenario belongs to (e.g. "Accept
  // the offer"). null in the ordinary single-track mode.
  pathLabel: z.string().min(1).max(80).nullable().default(null),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(1000),
  likelihood: LikelihoodBand,
  confidence: ConfidenceBand,
  impact: ImpactBand,
  evidence: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  triggers: z.array(z.string()).default([]),
  earlyWarningSigns: z.array(z.string()).default([]),
  likelihoodIncreasesIf: z.array(z.string()).default([]),
  likelihoodDecreasesIf: z.array(z.string()).default([]),
  likelyUserResponse: z.string().max(500).nullable().default(null),
  recommendedResponse: z.string().max(500).nullable().default(null),
  contingencyPlan: z.string().max(500).nullable().default(null),
});

// Exactly 3 scenarios, one of each outcome type — this replaced the
// earlier "3 to 6 generic scenarios" design at the product's request,
// to match a fixed 3-card accordion (best / most likely / worst) in
// the UI rather than a variable-length list.
//
// recommendedAction / whatCouldChangeForecast were added so the
// product answers "what should I do now?" and "what would change this
// forecast?" directly, as one synthesized answer rather than making
// the person infer it from three separate scenario cards.
export const RecommendedActionSchema = z.object({
  summary: z.string().min(1).max(500),
  conditionalBranches: z
    .array(
      z.object({
        condition: z.string().min(1).max(200),
        action: z.string().min(1).max(300),
      })
    )
    .default([]),
});

// Two valid shapes for "scenarios":
// 1. Ordinary (no decision paths): exactly 3 items, one each of
//    best_case/most_likely/worst_case, pathLabel null on all three.
// 2. Decision Paths mode: 2-4 distinct pathLabels, each with EXACTLY
//    3 scenarios (one positive, one mixed, one negative) — never a
//    mix of the two outcomeType vocabularies, and never a path with
//    only 1-2 scenarios (that would silently under-cover a path,
//    exactly the coverage gap this feature exists to prevent).
function validateScenarioSet(scenarios: z.infer<typeof ScenarioSchema>[]): boolean {
  const withPath = scenarios.filter((s) => s.pathLabel !== null);
  const withoutPath = scenarios.filter((s) => s.pathLabel === null);

  if (withPath.length === 0) {
    if (scenarios.length !== 3) return false;
    const types = scenarios.map((s) => s.outcomeType).sort();
    return JSON.stringify(types) === JSON.stringify(["best_case", "most_likely", "worst_case"]);
  }

  // Decision Paths mode: every scenario must have a pathLabel (no
  // mixing standard + path-grouped in the same set).
  if (withoutPath.length > 0) return false;

  const byPath = new Map<string, z.infer<typeof ScenarioSchema>[]>();
  for (const s of withPath) {
    const list = byPath.get(s.pathLabel as string) ?? [];
    list.push(s);
    byPath.set(s.pathLabel as string, list);
  }
  if (byPath.size < 2 || byPath.size > 4) return false;

  for (const group of byPath.values()) {
    if (group.length !== 3) return false;
    const types = group.map((s) => s.outcomeType).sort();
    if (JSON.stringify(types) !== JSON.stringify(["mixed", "negative", "positive"])) return false;
  }
  return true;
}

export const ScenarioGenerationOutputSchema = z.object({
  scenarios: z
    .array(ScenarioSchema)
    .min(3)
    .max(12)
    .refine(validateScenarioSet, {
      message:
        "Scenarios must be either exactly 3 standard (best_case/most_likely/worst_case) with no pathLabel, or grouped into 2-4 decision paths of exactly 3 (positive/mixed/negative) each",
    }),
  recommendedAction: RecommendedActionSchema,
  whatCouldChangeForecast: z.array(z.string().min(1).max(300)).max(3).default([]),
  // §8 (quality polish): optional, contextual only — null when there's
  // no genuinely important gap to name, not forced onto every report.
  limitsOfForecast: z.string().min(1).max(400).nullable().default(null),
});

export type Scenario = z.infer<typeof ScenarioSchema>;

// §11: the situation analyzer must never merge these categories.
export const SituationAnalysisSchema = z.object({
  facts: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  unknowns: z.array(z.string()).default([]),
  keyVariables: z.array(z.string()).default([]),
  behavioralVariables: z.array(z.string()).default([]),
  externalVariables: z.array(z.string()).default([]),
  controllableVariables: z.array(z.string()).default([]),
  uncontrollableVariables: z.array(z.string()).default([]),
  // Decision Paths (outcome-tracking accuracy fix): when the situation
  // presents a clear choice between 2-4 concrete alternatives (e.g.
  // "accept the offer" vs "stay"), name each path in a few words.
  // null when there's no clear alternative-path decision — the
  // ordinary single-track scenario generation handles that case
  // unchanged, exactly as before.
  decisionPaths: z.array(z.string().min(1).max(80)).min(2).max(4).nullable().default(null),
});

// §12: at most 3 follow-up questions, 0 is valid (over-asking is a
// failure mode, not a safe default).
export const FollowUpQuestionsSchema = z.object({
  questions: z.array(z.string().min(1).max(300)).max(3),
});


// §18: compares what was forecast against what actually happened.
// "matchedScenarioTitle" is null when no generated scenario matches
// reality well — that's a valid and useful outcome to record (it means
// the Scenario Engine missed something), never forced to pick one.
export const OutcomeComparisonSchema = z.object({
  matchedScenarioTitle: z.string().nullable(),
  whatWentRight: z.array(z.string()).default([]),
  whatWasMissed: z.array(z.string()).default([]),
  wrongAssumptions: z.array(z.string()).default([]),
  // Outcome Learning fix: what actually happened doesn't just get
  // silently folded into "wrongAssumptions" when the real cause is
  // that an entire alternative decision path was never modeled — that
  // is a structural coverage problem, not a wrong belief, and it's
  // reported differently (never as "AI accuracy").
  coverageGap: z.string().max(400).nullable().default(null),
  // "Unknown became known" — unknowns from the original forecast that
  // this outcome has now resolved, so a future revisit isn't left
  // wondering why they were ever listed as unknown.
  unknownsResolved: z.array(z.string()).default([]),
});

// §19: personalization insights, one per detected tendency. Kept to at
// most 3 per analysis run — this is about surfacing the clearest
// patterns, not exhaustively labeling the user.
export const PersonalizationInsightsSchema = z.object({
  insights: z
    .array(
      z.object({
        tendencyKey: z.enum([
          "negative_interpretation",
          "overthinking",
          "avoidance",
          "impulsive_decisions",
          "excessive_risk_sensitivity",
          "repeated_prediction_errors",
        ]),
        explanation: z.string().min(1).max(500),
      })
    )
    .max(3),
});

// §15: Decision Mode. Each option gets best/base/worst cases and a
// qualitative risk/reversibility rating — no fabricated numbers.
const RiskBand = z.enum(["low", "moderate", "high"]);
const ReversibilityBand = z.enum(["low", "moderate", "high"]);

export const DecisionOptionSchema = z.object({
  option: z.string().min(1).max(200),
  upside: z.array(z.string()).default([]),
  downside: z.array(z.string()).default([]),
  risk: RiskBand,
  reversibility: ReversibilityBand,
  bestCase: z.string().min(1).max(500),
  baseCase: z.string().min(1).max(500),
  worstCase: z.string().min(1).max(500),
});

export const DecisionAnalysisOutputSchema = z.object({
  options: z.array(DecisionOptionSchema).min(2).max(6),
  keyVariables: z.array(z.string()).default([]),
  recommendation: z.string().min(1).max(1000),
  contingencyPlan: z.string().min(1).max(1000),
});

// §16: Business Decision Mode. "estimates" are explicitly distinct from
// facts/assumptions — each one must state its basis, since §16
// forbids fabricating market data as if it were established fact.
export const BusinessEstimateSchema = z.object({
  label: z.string().min(1).max(150),
  value: z.string().min(1).max(200),
  basis: z.string().min(1).max(300),
});

export const BusinessAnalysisOutputSchema = z.object({
  facts: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  estimates: z.array(BusinessEstimateSchema).default([]),
  breakEvenDescription: z.string().min(1).max(500),
  sensitivity: z.array(z.string()).default([]),
  upside: z.array(z.string()).default([]),
  downside: z.array(z.string()).default([]),
  executionRisk: z.enum(["low", "moderate", "high"]),
  recommendation: z.string().min(1).max(1000),
});
