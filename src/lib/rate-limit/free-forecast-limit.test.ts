import { describe, expect, it } from "vitest";
import { isWithinRateLimit, FREE_FORECAST_RATE_LIMIT } from "./free-forecast-limit";

const now = new Date("2026-01-01T12:00:00Z");
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);

describe("isWithinRateLimit", () => {
  it("allows the request when there is no prior history", () => {
    expect(isWithinRateLimit([], now)).toBe(true);
  });

  it("allows the request when under the max", () => {
    const recent = [minutesAgo(10), minutesAgo(20)];
    expect(isWithinRateLimit(recent, now, { maxRequests: 5, windowMs: 60 * 60 * 1000 })).toBe(
      true
    );
  });

  it("blocks the request once the max within the window is reached", () => {
    const recent = [minutesAgo(5), minutesAgo(10), minutesAgo(15)];
    expect(isWithinRateLimit(recent, now, { maxRequests: 3, windowMs: 60 * 60 * 1000 })).toBe(
      false
    );
  });

  it("ignores requests outside the window", () => {
    // 3 requests, but 2 of them are outside a 60-minute window.
    const recent = [minutesAgo(5), minutesAgo(90), minutesAgo(120)];
    expect(isWithinRateLimit(recent, now, { maxRequests: 3, windowMs: 60 * 60 * 1000 })).toBe(
      true
    );
  });

  it("uses the default config when none is passed", () => {
    const recent = Array(FREE_FORECAST_RATE_LIMIT.maxRequests).fill(minutesAgo(1));
    expect(isWithinRateLimit(recent, now)).toBe(false);
  });
});
