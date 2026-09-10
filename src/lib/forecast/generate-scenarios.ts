import { AIOrchestrator } from "@/lib/ai/orchestrator";
import {
  SCENARIO_GENERATION_SYSTEM_PROMPT_V1,
  buildScenarioGenerationUserPrompt,
} from "@/lib/ai/prompts/scenario-generation";
import { ScenarioGenerationOutputSchema } from "@/lib/ai/schemas/scenario";
import { languageNameForLocale } from "@/lib/i18n/config";
import type { z } from "zod";

export type ScenarioGenerationOutput = z.infer<typeof ScenarioGenerationOutputSchema>;

export async function generateScenarios(params: {
  situationText: string;
  facts: string[];
  assumptions: string[];
  unknowns: string[];
  behavioralVariables: string[];
  externalVariables: string[];
  behavioralProfileSummary: string[];
  locale: string;
}) {
  const languageName = languageNameForLocale(params.locale);
  return AIOrchestrator.run<ScenarioGenerationOutput>({
    requestType: "scenario_generation",
    systemPrompt: SCENARIO_GENERATION_SYSTEM_PROMPT_V1,
    userPrompt: buildScenarioGenerationUserPrompt({ ...params, languageName }),
    schema: ScenarioGenerationOutputSchema,
    // 3 scenarios plus a top-level recommendedAction and
    // whatCouldChangeForecast now add to the response size — bumped
    // headroom again after the earlier 2048->4096 truncation bug to
    // avoid repeating it.
    maxOutputTokens: 4608,
  });
}
