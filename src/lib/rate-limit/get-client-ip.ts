import type { NextRequest } from "next/server";

/**
 * Railway (like most PaaS) terminates TLS at a proxy, so the real
 * client IP arrives in x-forwarded-for, not the raw socket address.
 * Falls back to a constant string when neither header is present
 * (e.g. local dev) so rate limiting still groups requests consistently
 * rather than crashing.
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
