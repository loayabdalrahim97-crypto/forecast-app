import type { SituationAnalysis } from "./analyze-situation";

export interface ForecastVariableRow {
  kind:
    | "fact"
    | "assumption"
    | "unknown"
    | "behavioral"
    | "external"
    | "controllable"
    | "uncontrollable";
  content: string;
}

const CATEGORY_MAP: Array<{ key: keyof SituationAnalysis; kind: ForecastVariableRow["kind"] }> = [
  { key: "facts", kind: "fact" },
  { key: "assumptions", kind: "assumption" },
  { key: "unknowns", kind: "unknown" },
  { key: "behavioralVariables", kind: "behavioral" },
  { key: "externalVariables", kind: "external" },
  { key: "controllableVariables", kind: "controllable" },
  { key: "uncontrollableVariables", kind: "uncontrollable" },
];

/**
 * Flattens a SituationAnalysis into rows ready for
 * ForecastVariable.createMany. Each category stays a separate row with
 * its own `kind` — this is the structural enforcement of §50 (an
 * assumption can never silently become a fact) at the persistence layer,
 * not just in the prompt.
 *
 * Note: `keyVariables` is intentionally omitted — it's a derived summary
 * of the other categories (§11 lists it as "most likely to influence the
 * outcome"), not a distinct evidentiary category, so persisting it
 * separately would duplicate rows without adding information.
 */
export function analysisToVariableRows(analysis: SituationAnalysis): ForecastVariableRow[] {
  const rows: ForecastVariableRow[] = [];
  for (const { key, kind } of CATEGORY_MAP) {
    for (const content of analysis[key] as string[]) {
      rows.push({ kind, content });
    }
  }
  return rows;
}

/**
 * Inverse of analysisToVariableRows: groups stored ForecastVariable rows
 * back into flat string lists by kind, for handing to the Scenario
 * Engine prompt. Unknown/unrecognized kinds are ignored rather than
 * throwing — a forecast should never fail to generate scenarios because
 * of one stray row.
 */
export function groupVariablesByKind(
  rows: ForecastVariableRow[]
): Record<
  "facts" | "assumptions" | "unknowns" | "behavioralVariables" | "externalVariables",
  string[]
> {
  const grouped = {
    facts: [] as string[],
    assumptions: [] as string[],
    unknowns: [] as string[],
    behavioralVariables: [] as string[],
    externalVariables: [] as string[],
  };

  const kindToGroup: Record<string, keyof typeof grouped> = {
    fact: "facts",
    assumption: "assumptions",
    unknown: "unknowns",
    behavioral: "behavioralVariables",
    external: "externalVariables",
  };

  for (const row of rows) {
    const group = kindToGroup[row.kind];
    if (group) grouped[group].push(row.content);
  }

  return grouped;
}
