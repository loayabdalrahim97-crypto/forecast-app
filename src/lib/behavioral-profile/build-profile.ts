import { BEHAVIORAL_PROFILE_QUESTIONS, findQuestion } from "./questions";

export interface RawAnswer {
  questionId: string;
  value: string;
}

/** Matches the scalar fields on Prisma's BehavioralProfile model. */
export interface StructuredProfile {
  decisionStyle?: string;
  riskTolerance?: string;
  conflictStyle?: string;
  communicationStyle?: string;
  uncertaintyTolerance?: string;
  planningStyle?: string;
  decisionSpeed?: string;
  adaptability?: string;
  pressureResponse?: string;
  socialInterpretationStyle?: string;
  negativeInterpretationTendency?: boolean;
  overthinkingTendency?: boolean;
  riskSensitivity?: string;
  needForCertainty?: string;
  conflictAvoidance?: boolean;
  catastrophizingTendency?: boolean;
}

export class InvalidAnswerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAnswerError";
  }
}

/**
 * Builds a structured, language-neutral Behavioral Profile from raw
 * onboarding answers (§10). Deterministic — the same answers always
 * produce the same profile, and an unrecognized question id or option
 * value is rejected rather than silently dropped, so a client bug never
 * quietly corrupts someone's profile.
 */
export function buildProfileFromAnswers(answers: RawAnswer[]): StructuredProfile {
  const profile: StructuredProfile = {};

  for (const answer of answers) {
    const question = findQuestion(answer.questionId);
    if (!question) {
      throw new InvalidAnswerError(`Unknown question id: ${answer.questionId}`);
    }

    const option = question.options.find((o) => o.value === answer.value);
    if (!option) {
      throw new InvalidAnswerError(
        `Invalid value "${answer.value}" for question "${answer.questionId}"`
      );
    }

    if (question.isBoolean) {
      (profile as Record<string, unknown>)[question.attribute] = answer.value === "true";
    } else {
      (profile as Record<string, unknown>)[question.attribute] = answer.value;
    }
  }

  return profile;
}

/**
 * §10: "Do not ask unnecessary questions" / §12: only ask what could
 * materially change the output. For onboarding this means: don't re-ask
 * a question the profile already has an answer for. Returns the subset
 * of the question bank still unanswered.
 */
export function remainingQuestions(alreadyAnswered: RawAnswer[]) {
  const answeredIds = new Set(alreadyAnswered.map((a) => a.questionId));
  return BEHAVIORAL_PROFILE_QUESTIONS.filter((q) => !answeredIds.has(q.id));
}
