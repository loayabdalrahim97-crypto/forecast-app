/**
 * §19: personalization identifies tendencies from PATTERNS, not one-off
 * events. Drawing a conclusion from a single forecast would be exactly
 * the kind of unfounded generalization the whole product is designed
 * to avoid making about the user's situations — so it can't make that
 * mistake about the user themselves either.
 *
 * This is deliberately a plain, hard-coded threshold rather than
 * something configurable per user: the whole point is a floor that
 * can't be bypassed by accident.
 */
export const MIN_OUTCOMES_FOR_PERSONALIZATION = 3;

export function hasEnoughDataForPersonalization(outcomeCount: number): boolean {
  return outcomeCount >= MIN_OUTCOMES_FOR_PERSONALIZATION;
}
