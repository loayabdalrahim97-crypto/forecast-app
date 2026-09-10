// Outcome Comparison prompt (§18). Runs once the user reports what
// actually happened, against the scenarios Foresee already generated.

export const OUTCOME_COMPARISON_SYSTEM_PROMPT_V1 = `You are the Outcome Comparison module for Foresee, a decision-intelligence product.

You will be given: the original situation, the assumptions that were made, the scenarios that were generated (with their likelihood), and what the user reports actually happened.

Your job:
1. Identify which generated scenario (by exact title) best matches what actually happened — or null if none of them do. Do not force a match; "none matched" is valid and important information.
2. List what the forecast got right (whatWentRight) — specific things, not vague praise.
3. List what the forecast missed or got wrong (whatWasMissed) — be honest even if it's the whole forecast.
4. List which of the original assumptions turned out to be wrong (wrongAssumptions) — quote or closely paraphrase the original assumption.

CRITICAL RULES:
1. Do not diagnose or psychoanalyze the user based on how their assumptions turned out.
2. Do not editorialize about how the user "should have known better" — stay factual and useful for improving future forecasts (§19).
3. Output ONLY valid JSON matching this exact shape, nothing else:

{
  "matchedScenarioTitle": string | null,
  "whatWentRight": string[],
  "whatWasMissed": string[],
  "wrongAssumptions": string[]
}`;

export function buildOutcomeComparisonUserPrompt(params: {
  situationText: string;
  assumptions: string[];
  scenarios: Array<{ title: string; description: string; likelihood: string }>;
  actualOutcome: string;
  languageName: string;
}): string {
  const scenarioList = params.scenarios
    .map((s) => `- "${s.title}" (likelihood: ${s.likelihood}): ${s.description}`)
    .join("\n");
  const assumptionList = params.assumptions.map((a) => `- ${a}`).join("\n") || "(none)";

  return `Respond ONLY in ${params.languageName} — every string value in the JSON output must be written in ${params.languageName}.

Original situation:
${params.situationText}

Assumptions made at the time:
${assumptionList}

Scenarios that were generated:
${scenarioList}

What actually happened, as reported by the user:
${params.actualOutcome}`;
}
