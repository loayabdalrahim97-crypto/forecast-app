import { prisma } from "@/lib/db";
import { estimateCostUsd } from "./pricing";
import type { OrchestratedResult } from "./orchestrator";

/**
 * §22: every AI call must produce an AIRequest row — this is the one
 * place that happens, so cost tracking can't be forgotten by a route
 * that calls AIOrchestrator directly. Never throws: a logging failure
 * must not break the actual feature that was using the AI result.
 */
export async function logAIRequest(
  meta: OrchestratedResult<unknown>["meta"],
  context: { userId?: string | null; forecastId?: string | null }
): Promise<void> {
  try {
    await prisma.aIRequest.create({
      data: {
        userId: context.userId ?? null,
        forecastId: context.forecastId ?? null,
        provider: meta.provider,
        model: meta.model,
        requestType: meta.requestType,
        inputTokens: meta.inputTokens,
        outputTokens: meta.outputTokens,
        cachedTokens: meta.cachedTokens,
        cacheCreationTokens: meta.cacheCreationTokens,
        estimatedCostUsd: estimateCostUsd({
          model: meta.model,
          inputTokens: meta.inputTokens,
          outputTokens: meta.outputTokens,
          cachedTokens: meta.cachedTokens,
        }),
        latencyMs: meta.latencyMs,
      },
    });
  } catch (err) {
    console.error("[ai-cost] failed to log AIRequest:", err);
  }
}
