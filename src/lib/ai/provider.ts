// The contract every AI vendor must implement. The Forecast Engine only
// ever talks to this interface — never to a vendor SDK directly — so a
// provider can be swapped without touching business logic (see §20, §39).

export type AIRequestType =
  | "fact_extraction"
  | "variable_extraction"
  | "classification"
  | "summarization"
  | "question_generation"
  | "json_conversion"
  | "situation_analysis"
  | "scenario_generation"
  | "behavioral_analysis"
  | "likelihood_estimation"
  | "impact_analysis"
  | "response_prediction"
  | "recommendation"
  | "sensitivity_analysis"
  | "outcome_comparison"
  | "personalization_analysis"
  | "decision_analysis"
  | "complex_decision_analysis";

export interface AICallParams {
  systemPrompt: string;
  userPrompt: string;
  /** JSON schema the response must validate against. */
  responseSchema?: Record<string, unknown>;
  maxOutputTokens?: number;
  /** Stable content (e.g. a template) that can be prompt-cached. */
  cacheableSystemPrompt?: boolean;
}

export interface AICallResult {
  rawText: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  cacheCreationTokens: number;
  latencyMs: number;
}

export interface AIProvider {
  /** Machine-readable id, e.g. "anthropic". */
  readonly id: string;

  /** Returns the concrete model name this provider will use for a tier. */
  modelForTier(tier: "cheap" | "standard" | "premium"): string;

  complete(params: AICallParams, tier: "cheap" | "standard" | "premium"): Promise<AICallResult>;
}
