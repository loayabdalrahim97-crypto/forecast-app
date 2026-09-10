export type RealityCheckBadge = "grounded" | "high_assumption" | "mixed";

export interface RealityCheckResult {
  factsCount: number;
  assumptionsCount: number;
  unknownsCount: number;
  /** 0-100, rounded. Facts as a share of (facts + assumptions + unknowns). */
  solidFactsPct: number;
  /** 0-100, rounded. The complement of solidFactsPct. */
  assumptionsGapsPct: number;
  badge: RealityCheckBadge;
}

/**
 * Pure function: turns the forecast's variable counts into the Reality
 * Check Barometer numbers. Kept separate from any component so the
 * threshold logic (60% cutoffs) is unit-testable without rendering
 * anything.
 */
export function computeRealityCheck(
  factsCount: number,
  assumptionsCount: number,
  unknownsCount: number
): RealityCheckResult {
  const total = factsCount + assumptionsCount + unknownsCount;
  const solidFactsPct = total === 0 ? 0 : Math.round((factsCount / total) * 100);
  const assumptionsGapsPct = 100 - solidFactsPct;

  let badge: RealityCheckBadge = "mixed";
  if (assumptionsGapsPct > 60) badge = "high_assumption";
  else if (solidFactsPct > 60) badge = "grounded";

  return {
    factsCount,
    assumptionsCount,
    unknownsCount,
    solidFactsPct,
    assumptionsGapsPct,
    badge,
  };
}
