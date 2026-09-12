import { describe, expect, it } from "vitest";
import { forecastLimitForPlan, currentCalendarMonthStart, nextCalendarMonthStart, PLANS } from "./plans";

describe("PLANS", () => {
  it("matches the official pricing exactly", () => {
    expect(PLANS.free.priceUsd).toBe(0);
    expect(PLANS.free.forecastsPerMonth).toBe(3);
    expect(PLANS.pro_monthly.priceUsd).toBe(9.99);
    expect(PLANS.pro_monthly.forecastsPerMonth).toBe(30);
    expect(PLANS.pro_annual.priceUsd).toBe(79.99);
    expect(PLANS.pro_annual.forecastsPerMonth).toBe(30);
  });
});

describe("forecastLimitForPlan", () => {
  it("returns the correct limit for each real plan", () => {
    expect(forecastLimitForPlan("free")).toBe(3);
    expect(forecastLimitForPlan("pro_monthly")).toBe(30);
    expect(forecastLimitForPlan("pro_annual")).toBe(30);
  });

  it("fails closed to the Free limit for an unrecognized plan string", () => {
    expect(forecastLimitForPlan("something_invented")).toBe(3);
  });
});

describe("calendar month boundaries", () => {
  it("returns the first instant of the current UTC month", () => {
    const mid = new Date(Date.UTC(2026, 2, 15, 13, 45));
    expect(currentCalendarMonthStart(mid).toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });

  it("returns the first instant of the following UTC month", () => {
    const mid = new Date(Date.UTC(2026, 2, 15, 13, 45));
    expect(nextCalendarMonthStart(mid).toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });

  it("rolls over the year boundary correctly (December -> January)", () => {
    const dec = new Date(Date.UTC(2026, 11, 20));
    expect(nextCalendarMonthStart(dec).toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});
