import { AIOrchestrator } from "@/lib/ai/orchestrator";
import {
  OUTCOME_COMPARISON_SYSTEM_PROMPT_V1,
  buildOutcomeComparisonUserPrompt,
} from "@/lib/ai/prompts/outcome-comparison";
import { OutcomeComparisonSchema } from "@/lib/ai/schemas/scenario";
import { languageNameForLocale } from "@/lib/i18n/config";
import type { z } from "zod";

export type OutcomeComparison = z.infer<typeof OutcomeComparisonSchema>;

export async function compareOutcomeToForecast(params: {
  situationText: string;
  assumptions: string[];
  scenarios: Array<{ title: string; description: string; likelihood: string }>;
  actualOutcome: string;
  locale: string;
}) {
  const languageName = languageNameForLocale(params.locale);
  return AIOrchestrator.run<OutcomeComparison>({
    requestType: "outcome_comparison",
    systemPrompt: OUTCOME_COMPARISON_SYSTEM_PROMPT_V1,
    userPrompt: buildOutcomeComparisonUserPrompt({ ...params, languageName }),
    schema: OutcomeComparisonSchema,
    maxOutputTokens: 3072, // raised proactively — same truncation bug class hit two other endpoints already
  });
}
