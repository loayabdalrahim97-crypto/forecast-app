// §19 lists these explicitly as the tendencies to look for. Keeping the
// set closed (rather than letting the model invent new keys) matches
// the pattern already used for BehavioralProfile attributes: internal
// data stays a fixed, language-neutral vocabulary; only the
// user-facing explanation is free text.

export const TENDENCY_KEYS = [
  "negative_interpretation",
  "overthinking",
  "avoidance",
  "impulsive_decisions",
  "excessive_risk_sensitivity",
  "repeated_prediction_errors",
] as const;

export type TendencyKey = (typeof TENDENCY_KEYS)[number];
