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
  firstName?: string | null;
}) {
  const languageName = languageNameForLocale(params.locale);
  return AIOrchestrator.run<ScenarioGenerationOutput>({
    requestType: "scenario_generation",
    systemPrompt: SCENARIO_GENERATION_SYSTEM_PROMPT_V1,
    userPrompt: buildScenarioGenerationUserPrompt({ ...params, languageName }),
    schema: ScenarioGenerationOutputSchema,
    // 3 scenarios (each with ~10 fields) plus recommendedAction and
    // whatCouldChangeForecast add up fast, and this is now the SECOND
    // time a max_tokens ceiling truncated a real response mid-JSON
    // (confirmed via production error logs both times: 2048->4096,
    // then 4096->4608 wasn't enough for a longer/Arabic situation).
    // Setting a generous ceiling once instead of nudging it up again —
    // the model stops naturally once it's done; this just removes the
    // artificial cutoff as the failure point.
    maxOutputTokens: 8192,
  });
}
