// Behavioral Profile onboarding question bank (§9, §10).
//
// Rules this file exists to enforce:
//   - Every question maps to a BEHAVIORAL attribute, never a diagnosis.
//   - Questions are concise (multiple choice, not open-ended) so answers
//     map deterministically to structured profile fields — no AI call
//     needed for this step, which keeps it fast, free, and predictable.
//   - "Adaptive": the onboarding flow (see build-profile.ts) only asks
//     what materially changes the profile; this bank is intentionally
//     short rather than exhaustively covering every possible attribute.
//
// `promptKey` / option `labelKey` are i18n keys — see messages/*.json
// under "onboarding.questions.<questionId>". Never hard-code
// user-facing strings here (§4).

export type ProfileAttribute =
  | "decisionStyle"
  | "riskTolerance"
  | "conflictStyle"
  | "communicationStyle"
  | "uncertaintyTolerance"
  | "planningStyle"
  | "decisionSpeed"
  | "adaptability"
  | "pressureResponse"
  | "socialInterpretationStyle"
  | "negativeInterpretationTendency"
  | "overthinkingTendency"
  | "riskSensitivity"
  | "needForCertainty"
  | "conflictAvoidance"
  | "catastrophizingTendency";

export interface ProfileOption {
  /** Stored verbatim as the language-neutral answerValue for this attribute. */
  value: string;
  labelKey: string;
}

export interface ProfileQuestion {
  id: string;
  promptKey: string;
  attribute: ProfileAttribute;
  /** True for the tendency-flag questions that map to a boolean field. */
  isBoolean?: boolean;
  options: ProfileOption[];
}

export const BEHAVIORAL_PROFILE_QUESTIONS: ProfileQuestion[] = [
  {
    id: "decision_style",
    promptKey: "onboarding.questions.decision_style.prompt",
    attribute: "decisionStyle",
    options: [
      { value: "analytical", labelKey: "onboarding.questions.decision_style.options.analytical" },
      { value: "intuitive", labelKey: "onboarding.questions.decision_style.options.intuitive" },
      { value: "mixed", labelKey: "onboarding.questions.decision_style.options.mixed" },
    ],
  },
  {
    id: "risk_tolerance",
    promptKey: "onboarding.questions.risk_tolerance.prompt",
    attribute: "riskTolerance",
    options: [
      { value: "low", labelKey: "onboarding.questions.risk_tolerance.options.low" },
      { value: "moderate", labelKey: "onboarding.questions.risk_tolerance.options.moderate" },
      { value: "high", labelKey: "onboarding.questions.risk_tolerance.options.high" },
    ],
  },
  {
    id: "conflict_style",
    promptKey: "onboarding.questions.conflict_style.prompt",
    attribute: "conflictStyle",
    options: [
      { value: "direct", labelKey: "onboarding.questions.conflict_style.options.direct" },
      { value: "diplomatic", labelKey: "onboarding.questions.conflict_style.options.diplomatic" },
      { value: "avoidant", labelKey: "onboarding.questions.conflict_style.options.avoidant" },
    ],
  },
  {
    id: "communication_style",
    promptKey: "onboarding.questions.communication_style.prompt",
    attribute: "communicationStyle",
    options: [
      { value: "direct", labelKey: "onboarding.questions.communication_style.options.direct" },
      { value: "indirect", labelKey: "onboarding.questions.communication_style.options.indirect" },
      { value: "expressive", labelKey: "onboarding.questions.communication_style.options.expressive" },
    ],
  },
  {
    id: "uncertainty_tolerance",
    promptKey: "onboarding.questions.uncertainty_tolerance.prompt",
    attribute: "uncertaintyTolerance",
    options: [
      { value: "low", labelKey: "onboarding.questions.uncertainty_tolerance.options.low" },
      { value: "moderate", labelKey: "onboarding.questions.uncertainty_tolerance.options.moderate" },
      { value: "high", labelKey: "onboarding.questions.uncertainty_tolerance.options.high" },
    ],
  },
  {
    id: "planning_style",
    promptKey: "onboarding.questions.planning_style.prompt",
    attribute: "planningStyle",
    options: [
      { value: "structured", labelKey: "onboarding.questions.planning_style.options.structured" },
      { value: "flexible", labelKey: "onboarding.questions.planning_style.options.flexible" },
      { value: "spontaneous", labelKey: "onboarding.questions.planning_style.options.spontaneous" },
    ],
  },
  {
    id: "decision_speed",
    promptKey: "onboarding.questions.decision_speed.prompt",
    attribute: "decisionSpeed",
    options: [
      { value: "fast", labelKey: "onboarding.questions.decision_speed.options.fast" },
      { value: "deliberate", labelKey: "onboarding.questions.decision_speed.options.deliberate" },
      { value: "slow", labelKey: "onboarding.questions.decision_speed.options.slow" },
    ],
  },
  {
    id: "pressure_response",
    promptKey: "onboarding.questions.pressure_response.prompt",
    attribute: "pressureResponse",
    options: [
      { value: "focused", labelKey: "onboarding.questions.pressure_response.options.focused" },
      { value: "stressed", labelKey: "onboarding.questions.pressure_response.options.stressed" },
      { value: "variable", labelKey: "onboarding.questions.pressure_response.options.variable" },
    ],
  },
  {
    id: "social_interpretation",
    promptKey: "onboarding.questions.social_interpretation.prompt",
    attribute: "socialInterpretationStyle",
    options: [
      { value: "neutral", labelKey: "onboarding.questions.social_interpretation.options.neutral" },
      { value: "positive", labelKey: "onboarding.questions.social_interpretation.options.positive" },
      { value: "cautious", labelKey: "onboarding.questions.social_interpretation.options.cautious" },
    ],
  },
  // Tendency flags — phrased behaviorally, never as clinical symptoms.
  {
    id: "negative_interpretation",
    promptKey: "onboarding.questions.negative_interpretation.prompt",
    attribute: "negativeInterpretationTendency",
    isBoolean: true,
    options: [
      { value: "true", labelKey: "onboarding.questions.negative_interpretation.options.yes" },
      { value: "false", labelKey: "onboarding.questions.negative_interpretation.options.no" },
    ],
  },
  {
    id: "overthinking",
    promptKey: "onboarding.questions.overthinking.prompt",
    attribute: "overthinkingTendency",
    isBoolean: true,
    options: [
      { value: "true", labelKey: "onboarding.questions.overthinking.options.yes" },
      { value: "false", labelKey: "onboarding.questions.overthinking.options.no" },
    ],
  },
  {
    id: "conflict_avoidance",
    promptKey: "onboarding.questions.conflict_avoidance.prompt",
    attribute: "conflictAvoidance",
    isBoolean: true,
    options: [
      { value: "true", labelKey: "onboarding.questions.conflict_avoidance.options.yes" },
      { value: "false", labelKey: "onboarding.questions.conflict_avoidance.options.no" },
    ],
  },
  {
    id: "catastrophizing",
    promptKey: "onboarding.questions.catastrophizing.prompt",
    attribute: "catastrophizingTendency",
    isBoolean: true,
    options: [
      { value: "true", labelKey: "onboarding.questions.catastrophizing.options.yes" },
      { value: "false", labelKey: "onboarding.questions.catastrophizing.options.no" },
    ],
  },
  {
    id: "risk_sensitivity",
    promptKey: "onboarding.questions.risk_sensitivity.prompt",
    attribute: "riskSensitivity",
    options: [
      { value: "low", labelKey: "onboarding.questions.risk_sensitivity.options.low" },
      { value: "moderate", labelKey: "onboarding.questions.risk_sensitivity.options.moderate" },
      { value: "high", labelKey: "onboarding.questions.risk_sensitivity.options.high" },
    ],
  },
  {
    id: "need_for_certainty",
    promptKey: "onboarding.questions.need_for_certainty.prompt",
    attribute: "needForCertainty",
    options: [
      { value: "low", labelKey: "onboarding.questions.need_for_certainty.options.low" },
      { value: "moderate", labelKey: "onboarding.questions.need_for_certainty.options.moderate" },
      { value: "high", labelKey: "onboarding.questions.need_for_certainty.options.high" },
    ],
  },
  {
    id: "adaptability",
    promptKey: "onboarding.questions.adaptability.prompt",
    attribute: "adaptability",
    options: [
      { value: "low", labelKey: "onboarding.questions.adaptability.options.low" },
      { value: "moderate", labelKey: "onboarding.questions.adaptability.options.moderate" },
      { value: "high", labelKey: "onboarding.questions.adaptability.options.high" },
    ],
  },
];

export function findQuestion(id: string): ProfileQuestion | undefined {
  return BEHAVIORAL_PROFILE_QUESTIONS.find((q) => q.id === id);
}
