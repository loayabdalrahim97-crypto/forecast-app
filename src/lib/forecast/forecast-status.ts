export type ForecastStatus = "active" | "updated" | "resolved";

/**
 * §2/§3 of the dashboard spec: Active / Updated / Resolved / Unresolved
 * labels, computed purely from what's actually stored — never a
 * separate status column to keep in sync. "Unresolved" in the spec's
 * filter language means the same underlying state as "active"/"updated"
 * (no outcome yet), so it's expressed as a boolean elsewhere rather
 * than a fourth status value here.
 */
export function computeForecastStatus(input: { hasOutcome: boolean; hasUpdates: boolean }): ForecastStatus {
  if (input.hasOutcome) return "resolved";
  if (input.hasUpdates) return "updated";
  return "active";
}

export const STATUS_LABEL: Record<ForecastStatus, { en: string; ar: string }> = {
  active: { en: "Active", ar: "نشط" },
  updated: { en: "Updated", ar: "مُحدَّث" },
  resolved: { en: "Resolved", ar: "محلول" },
};
