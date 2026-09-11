import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: { forecast: { findMany: vi.fn() } },
}));

import { prisma } from "@/lib/db";
import { computeDecisionProfile } from "./compute-decision-profile";

describe("computeDecisionProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is not ready with fewer than 3 recorded outcomes, even with many decisions", async () => {
    (prisma.forecast.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { scenarios: [], outcomeRecord: { matchedScenarioTitle: null, wrongAssumptions: null } },
      { scenarios: [], outcomeRecord: null },
      { scenarios: [], outcomeRecord: null },
      { scenarios: [], outcomeRecord: null },
      { scenarios: [], outcomeRecord: null },
    ]);
    const result = await computeDecisionProfile("user-1");
    expect(result.ready).toBe(false);
    expect(result.dimensions.outcomeTrackingRate).toBeNull();
  });

  it("becomes ready at exactly the minimum threshold (3 outcomes)", async () => {
    (prisma.forecast.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { scenarios: [{ id: "s1", title: "A", outcomeType: "most_likely" }], outcomeRecord: { matchedScenarioTitle: "A", wrongAssumptions: [] } },
      { scenarios: [{ id: "s2", title: "B", outcomeType: "most_likely" }], outcomeRecord: { matchedScenarioTitle: "C", wrongAssumptions: ["x"] } },
      { scenarios: [], outcomeRecord: { matchedScenarioTitle: null, wrongAssumptions: null } },
    ]);
    const result = await computeDecisionProfile("user-1");
    expect(result.ready).toBe(true);
    expect(result.dimensions.outcomeTrackingRate).toEqual({ value: 1, sampleSize: 3 });
  });

  it("computes forecast calibration only over outcomes that actually matched a scenario", async () => {
    (prisma.forecast.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { scenarios: [{ id: "s1", title: "Matched one", outcomeType: "most_likely" }], outcomeRecord: { matchedScenarioTitle: "Matched one", wrongAssumptions: [] } },
      { scenarios: [{ id: "s2", title: "Did not match", outcomeType: "most_likely" }], outcomeRecord: { matchedScenarioTitle: "Something else", wrongAssumptions: [] } },
      { scenarios: [{ id: "s3", title: "No scenario matched", outcomeType: "most_likely" }], outcomeRecord: { matchedScenarioTitle: null, wrongAssumptions: [] } },
    ]);
    const result = await computeDecisionProfile("user-1");
    // Only 2 of the 3 outcomes had a matchedScenarioTitle at all —
    // calibration should be measured over those 2, not all 3.
    expect(result.dimensions.forecastCalibrationRate).toEqual({ value: 0.5, sampleSize: 2 });
  });

  it("never reports a dimension with a fabricated sample size of zero", async () => {
    (prisma.forecast.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { scenarios: [], outcomeRecord: { matchedScenarioTitle: null, wrongAssumptions: null } },
      { scenarios: [], outcomeRecord: { matchedScenarioTitle: null, wrongAssumptions: null } },
      { scenarios: [], outcomeRecord: { matchedScenarioTitle: null, wrongAssumptions: null } },
    ]);
    const result = await computeDecisionProfile("user-1");
    expect(result.dimensions.forecastCalibrationRate).toBeNull();
    expect(result.dimensions.assumptionAccuracyRate).toBeNull();
  });
});
