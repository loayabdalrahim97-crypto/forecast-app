import { z } from "zod";
import { AIProviderFactory } from "./provider-factory";
import { ModelRouter } from "./model-router";
import type { AICallParams, AICallResult, AIRequestType } from "./provider";

export interface OrchestratedRequest {
  requestType: AIRequestType;
  systemPrompt: string;
  userPrompt: string;
  /** Zod schema the parsed JSON output must satisfy. */
  schema: z.ZodTypeAny;
  maxOutputTokens?: number;
  providerId?: string; // defaults to "anthropic"
  userId?: string;
  forecastId?: string;
}

export interface OrchestratedResult<T> {
  data: T;
  meta: {
    provider: string;
    model: string;
    requestType: AIRequestType;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    cacheCreationTokens: number;
    latencyMs: number;
  };
}

/**
 * AIOrchestrator (§20, §23): the ONLY place the rest of the app is allowed
 * to call an AI model from. Responsibilities:
 *   1. Route the request to the right cost tier (ModelRouter)
 *   2. Call the right vendor (AIProviderFactory)
 *   3. Validate the JSON response against a schema — retry/repair on
 *      failure, never let malformed output reach the database or UI
 *   4. Return usage data so callers can persist an AIRequest row for cost
 *      tracking (§22)
 *
 * NOTE: persisting the AIRequest row is left to the caller (it has the
 * Prisma context); this module stays framework/database-agnostic on
 * purpose so it can be unit tested and reused outside Next.js.
 */
export class AIOrchestrator {
  static async run<T>(req: OrchestratedRequest): Promise<OrchestratedResult<T>> {
    const provider = AIProviderFactory.get(req.providerId ?? "anthropic");
    const tier = ModelRouter.tierFor(req.requestType);

    const params: AICallParams = {
      systemPrompt: req.systemPrompt,
      userPrompt: req.userPrompt,
      maxOutputTokens: req.maxOutputTokens,
      cacheableSystemPrompt: true,
    };

    const result = await this.callWithRetry(provider, params, tier);
    const parsed = this.parseAndValidate<T>(result.rawText, req.schema);

    return {
      data: parsed,
      meta: {
        provider: result.provider,
        model: result.model,
        requestType: req.requestType,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cachedTokens: result.cachedTokens,
        cacheCreationTokens: result.cacheCreationTokens,
        latencyMs: result.latencyMs,
      },
    };
  }

  private static async callWithRetry(
    provider: ReturnType<typeof AIProviderFactory.get>,
    params: AICallParams,
    tier: "cheap" | "standard" | "premium",
    attempt = 1
  ): Promise<AICallResult> {
    try {
      return await provider.complete(params, tier);
    } catch (err) {
      if (attempt >= 2) throw err;
      return this.callWithRetry(provider, params, tier, attempt + 1);
    }
  }

  private static parseAndValidate<T>(rawText: string, schema: z.ZodTypeAny): T {
    let json: unknown;
    try {
      // Strip accidental markdown code fences before parsing.
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      json = JSON.parse(cleaned);
    } catch {
      throw new AIValidationError("Model output was not valid JSON", rawText);
    }

    const result = schema.safeParse(json);
    if (!result.success) {
      throw new AIValidationError(
        `Model output failed schema validation: ${result.error.message}`,
        rawText
      );
    }
    return result.data as T;
  }
}

export class AIValidationError extends Error {
  constructor(message: string, public rawText: string) {
    super(message);
    this.name = "AIValidationError";
  }
}
