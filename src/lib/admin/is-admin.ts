/**
 * §26/§32: admin endpoints need real authorization, not just "signed
 * in". There's no role system yet, so this uses an explicit allowlist
 * from ADMIN_EMAILS (comma-separated). Deliberately fails CLOSED: if
 * the env var isn't set, isAdminEmail returns false for everyone
 * rather than defaulting to "let anyone in" or "let the first user
 * in" — an unconfigured admin panel should be unreachable, not open.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}
