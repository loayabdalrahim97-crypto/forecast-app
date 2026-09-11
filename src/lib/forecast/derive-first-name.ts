/**
 * §1/§12/§13: the AI prompts personalize with a first name only — never
 * the full legal name, never the email. Derived from the account's
 * `name` field at the point of use (no separate first_name column —
 * one word off an existing field is a smaller change than a new
 * column, and it's recomputed fresh each time rather than stored
 * stale). Returns null on anything that isn't a usable name, so
 * callers can fall back to "you/your" phrasing cleanly.
 */
export function deriveFirstName(fullName: string | null | undefined): string | null {
  if (!fullName) return null;
  const first = fullName.trim().split(/\s+/)[0];
  if (!first || first.length > 40) return null;
  return first;
}
