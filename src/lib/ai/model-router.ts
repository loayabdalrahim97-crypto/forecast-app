import type { AIRequestType } from "./provider";

/**
 * Routing table (§21). Configurable in one place: change a request type's
 * tier here without touching the Forecast Engine or the providers.
 *   - "cheap"    → fact/variable extraction, classification, JSON conversion
 *   - "standard" → scenario generation, behavioral analysis, recommendations
 *   - "premium"  → complex multi-variable / premium decision analysis
 */
export const ROUTING_TABLE: Record<AIRequestType, "cheap" | "standard" | "premium"> = {
  fact_extraction: "cheap",
  variable_extraction: "cheap",
  classification: "cheap",
  summarization: "cheap",
  question_generation: "cheap",
  json_conversion: "cheap",
  situation_analysis: "cheap",

  scenario_generation: "standard",
  behavioral_analysis: "standard",
  likelihood_estimation: "standard",
  impact_analysis: "standard",
  response_prediction: "standard",
  recommendation: "standard",
  sensitivity_analysis: "standard",
  outcome_comparison: "standard",

  complex_decision_analysis: "premium",
};

export class ModelRouter {
  static tierFor(requestType: AIRequestType): "cheap" | "standard" | "premium" {
    return ROUTING_TABLE[requestType];
  }
}
