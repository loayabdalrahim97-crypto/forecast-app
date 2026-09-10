import { AIOrchestrator } from "@/lib/ai/orchestrator";
import {
  DECISION_ANALYSIS_SYSTEM_PROMPT_V1,
  buildDecisionAnalysisUserPrompt,
} from "@/lib/ai/prompts/decision-analysis";
import { DecisionAnalysisOutputSchema } from "@/lib/ai/schemas/scenario";
import { languageNameForLocale } from "@/lib/i18n/config";
import type { z } from "zod";

export type DecisionAnalysisOutput = z.infer<typeof DecisionAnalysisOutputSchema>;

export async function analyzeDecision(params: {
  situationText: string;
  facts: string[];
  assumptions: string[];
  explicitOptions: string[];
  locale: string;
}) {
  const languageName = languageNameForLocale(params.locale);
  return AIOrchestrator.run<DecisionAnalysisOutput>({
    requestType: "decision_analysis",
    systemPrompt: DECISION_ANALYSIS_SYSTEM_PROMPT_V1,
    userPrompt: buildDecisionAnalysisUserPrompt({ ...params, languageName }),
    schema: DecisionAnalysisOutputSchema,
    maxOutputTokens: 4096, // raised proactively — same truncation bug class hit two other endpoints already
  });
}
