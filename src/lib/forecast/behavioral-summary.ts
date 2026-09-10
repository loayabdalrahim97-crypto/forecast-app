/**
 * Matches the scalar fields on Prisma's BehavioralProfile model — kept
 * as a plain interface here (rather than importing the Prisma type)
 * so this stays testable without a database.
 */
export interface BehavioralProfileFields {
  decisionStyle?: string | null;
  riskTolerance?: string | null;
  conflictStyle?: string | null;
  communicationStyle?: string | null;
  uncertaintyTolerance?: string | null;
  planningStyle?: string | null;
  decisionSpeed?: string | null;
  adaptability?: string | null;
  pressureResponse?: string | null;
  socialInterpretationStyle?: string | null;
  negativeInterpretationTendency?: boolean | null;
  overthinkingTendency?: boolean | null;
  riskSensitivity?: string | null;
  needForCertainty?: string | null;
  conflictAvoidance?: boolean | null;
  catastrophizingTendency?: boolean | null;
}

const SCALAR_LABELS: Record<string, string> = {
  decisionStyle: "Decision style",
  riskTolerance: "Risk tolerance",
  conflictStyle: "Conflict style",
  communicationStyle: "Communication style",
  uncertaintyTolerance: "Uncertainty tolerance",
  planningStyle: "Planning style",
  decisionSpeed: "Decision speed",
  adaptability: "Adaptability",
  pressureResponse: "Pressure response",
  socialInterpretationStyle: "Social interpretation style",
  riskSensitivity: "Risk sensitivity",
  needForCertainty: "Need for certainty",
};

const TENDENCY_LABELS: Record<string, string> = {
  negativeInterpretationTendency: "tends to interpret ambiguous situations negatively",
  overthinkingTendency: "tends to overthink decisions",
  conflictAvoidance: "tends to avoid conflict",
  catastrophizingTendency: "tends to imagine worst-case outcomes first",
};

/**
 * Never phrases anything as a diagnosis (§9) — output reads like
 * "tends to X", never "has X". Only includes attributes the user has
 * actually answered; an unanswered attribute is omitted; not guessed.
 */
export function summarizeBehavioralProfile(profile: BehavioralProfileFields | null): string[] {
  if (!profile) return [];

  const lines: string[] = [];

  for (const [key, label] of Object.entries(SCALAR_LABELS)) {
    const value = profile[key as keyof BehavioralProfileFields];
    if (typeof value === "string" && value.length > 0) {
      lines.push(`${label}: ${value}`);
    }
  }

  for (const [key, label] of Object.entries(TENDENCY_LABELS)) {
    const value = profile[key as keyof BehavioralProfileFields];
    if (value === true) {
      lines.push(`User ${label}.`);
    }
  }

  return lines;
}
