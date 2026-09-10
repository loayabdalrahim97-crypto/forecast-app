import { z } from "zod";

// Enforces §13 (no fake precision — likelihood is a band, not "73.482%")
// and §50 (never let assumption/fear/possibility present itself as fact).
const LikelihoodBand = z.enum(["low", "moderate", "high"]);
const ConfidenceBand = z.enum(["low", "moderate", "high"]);
const ImpactBand = z.enum(["low", "moderate", "high"]);

export const ScenarioSchema = z.object({
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

export const ScenarioGenerationOutputSchema = z.object({
  scenarios: z.array(ScenarioSchema).min(3).max(6),
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
