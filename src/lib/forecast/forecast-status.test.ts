import { describe, expect, it } from "vitest";
import { computeForecastStatus } from "./forecast-status";

describe("computeForecastStatus", () => {
  it("is 'active' with no updates and no outcome", () => {
    expect(computeForecastStatus({ hasOutcome: false, hasUpdates: false })).toBe("active");
  });

  it("is 'updated' when updates exist but no outcome yet", () => {
    expect(computeForecastStatus({ hasOutcome: false, hasUpdates: true })).toBe("updated");
  });

  it("is 'resolved' once an outcome is recorded, regardless of updates", () => {
    expect(computeForecastStatus({ hasOutcome: true, hasUpdates: false })).toBe("resolved");
    expect(computeForecastStatus({ hasOutcome: true, hasUpdates: true })).toBe("resolved");
  });
});
