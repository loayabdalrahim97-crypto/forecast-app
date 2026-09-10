// §8: "Implement abuse prevention and rate limiting" for the Free
// Forecast flow specifically — it's the one endpoint that runs a real
// AI call with no auth and no credit system in front of it yet (§29
// credits come in a later phase). Until then, this is the only thing
// standing between the public internet and the ANTHROPIC_API_KEY bill.

/** Requests allowed per IP address within the window. */
export const FREE_FORECAST_RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
};

/**
 * Pure decision function: given the timestamps of an IP's recent
 * requests (already filtered to "this endpoint"), decide whether one
 * more is allowed right now. Kept separate from the DB query that
 * fetches those timestamps so the actual rate-limit MATH is unit
 * testable without a database.
 */
export function isWithinRateLimit(
  recentRequestTimestamps: Date[],
  now: Date,
  config: { maxRequests: number; windowMs: number } = FREE_FORECAST_RATE_LIMIT
): boolean {
  const windowStart = now.getTime() - config.windowMs;
  const countInWindow = recentRequestTimestamps.filter(
    (t) => t.getTime() >= windowStart
  ).length;
  return countInWindow < config.maxRequests;
}
