import { prisma } from "@/lib/db";
import { MIN_OUTCOMES_FOR_PERSONALIZATION } from "@/lib/personalization/data-gate";

export interface DecisionProfileResult {
  ready: boolean;
  totalDecisions: number;
  totalOutcomesRecorded: number;
  minRequired: number;
  dimensions: {
    outcomeTrackingRate: { value: number; sampleSize: number } | null;
    scenarioEngagementRate: { value: number; sampleSize: number } | null;
    forecastCalibrationRate: { value: number; sampleSize: number } | null;
    assumptionAccuracyRate: { value: number; sampleSize: number } | null;
  };
}

/**
 * §7/§8/§10: only the dimensions that are genuinely computable from
 * what's actually stored — not padded to a round number of
 * "dimensions" with invented or weakly-justified proxies. Each result
 * carries its own sample size so the UI can say "based on N decisions"
 * rather than presenting a bare number as if it were definitive.
 *
 * Reuses the exact same minimum-sample-size gate the personalization
 * engine already uses (§19) — a single forecast or outcome is not
 * evidence of a pattern, here any more than there.
 */
export async function computeDecisionProfile(userId: string): Promise<DecisionProfileResult> {
  const forecasts = await prisma.forecast.findMany({
    where: { userId },
    select: {
      scenarios: { select: { id: true, title: true, outcomeType: true } },
      outcomeRecord: { select: { matchedScenarioTitle: true, wrongAssumptions: true } },
    },
  });

  const totalDecisions = forecasts.length;
  const withOutcome = forecasts.filter((f: (typeof forecasts)[number]) => f.outcomeRecord !== null);
  const totalOutcomesRecorded = withOutcome.length;
  const ready = totalOutcomesRecorded >= MIN_OUTCOMES_FOR_PERSONALIZATION;

  if (!ready) {
    return {
      ready: false,
      totalDecisions,
      totalOutcomesRecorded,
      minRequired: MIN_OUTCOMES_FOR_PERSONALIZATION,
      dimensions: {
        outcomeTrackingRate: null,
        scenarioEngagementRate: null,
        forecastCalibrationRate: null,
        assumptionAccuracyRate: null,
      },
    };
  }

  const withScenarios = forecasts.filter((f: (typeof forecasts)[number]) => f.scenarios.length > 0);

  const calibrationEligible = withOutcome.filter((f: (typeof forecasts)[number]) => f.outcomeRecord?.matchedScenarioTitle);
  const calibrationMatches = calibrationEligible.filter((f: (typeof forecasts)[number]) => {
    const mostLikely = f.scenarios.find((s: { outcomeType: string | null }) => s.outcomeType === "most_likely");
    return mostLikely && mostLikely.title === f.outcomeRecord?.matchedScenarioTitle;
  });

  const assumptionEligible = withOutcome.filter((f: (typeof forecasts)[number]) => f.outcomeRecord?.wrongAssumptions !== null);
  const assumptionAccurate = assumptionEligible.filter((f: (typeof forecasts)[number]) => {
    const wrong = f.outcomeRecord?.wrongAssumptions as unknown[] | null;
    return Array.isArray(wrong) && wrong.length === 0;
  });

  return {
    ready: true,
    totalDecisions,
    totalOutcomesRecorded,
    minRequired: MIN_OUTCOMES_FOR_PERSONALIZATION,
    dimensions: {
      outcomeTrackingRate: { value: totalOutcomesRecorded / totalDecisions, sampleSize: totalDecisions },
      scenarioEngagementRate: { value: withScenarios.length / totalDecisions, sampleSize: totalDecisions },
      forecastCalibrationRate:
        calibrationEligible.length > 0
          ? { value: calibrationMatches.length / calibrationEligible.length, sampleSize: calibrationEligible.length }
          : null,
      assumptionAccuracyRate:
        assumptionEligible.length > 0
          ? { value: assumptionAccurate.length / assumptionEligible.length, sampleSize: assumptionEligible.length }
          : null,
    },
  };
}
