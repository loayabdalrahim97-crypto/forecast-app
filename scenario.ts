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
