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
  /**
   * Retries the ENTIRE call (transport + schema validation) as one
   * unit, not just the transport request. Previously, a transport
   * error (network/5xx) was retried but a schema-validation failure
   * (malformed or truncated JSON from the model — which happens
   * occasionally with any LLM, independent of network conditions) was
   * not: it threw immediately on the first bad response, surfacing a
   * generic error to the user, who then had to manually resubmit two
   * or three times until the model happened to return valid JSON.
   * Folding validation into the same retry loop makes that recovery
   * automatic instead of requiring the user to notice and retry by hand.
   */
  static async run<T>(req: OrchestratedRequest): Promise<OrchestratedResult<T>> {
    const provider = AIProviderFactory.get(req.providerId ?? "anthropic");
    const tier = ModelRouter.tierFor(req.requestType);

    const params: AICallParams = {
      systemPrompt: req.systemPrompt,
      userPrompt: req.userPrompt,
      maxOutputTokens: req.maxOutputTokens,
      cacheableSystemPrompt: true,
    };

    const maxAttempts = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await provider.complete(params, tier);
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
      } catch (err) {
        lastError = err;
        // Nothing to gain from retrying a request body the model will
        // never be able to satisfy differently on retry vs. one where
        // the failure is plausibly transient/random (network hiccup,
        // occasional truncation, occasional malformed JSON) — but we
        // can't distinguish those cheaply here, so retry uniformly and
        // let the final attempt's error surface if it never recovers.
        if (attempt === maxAttempts) break;
      }
    }

    throw lastError;
  }

  /**
   * The model is instructed to "output ONLY valid JSON, nothing else",
   * but for some situations (long, emotionally loaded, or otherwise
   * complex inputs) it doesn't reliably follow that — it sometimes
   * wraps the JSON in explanatory prose before and/or after it. That
   * previously broke parsing 100% of the time for those inputs (not
   * randomly — the same situation would fail on every retry), because
   * the old code only stripped ```json/``` markers and assumed
   * whatever was left was pure JSON. Root fix: actively find and
   * extract the JSON object from within the response instead of
   * assuming the whole response is one, trying a few strategies from
   * most to least specific.
   */
  private static extractJsonCandidate(rawText: string): string {
    const trimmed = rawText.trim();

    // 1) Prefer the first fenced ```json ... ``` block — this is what
    // the model is asked to produce, so if it's present it's the most
    // reliable signal even when surrounded by other prose.
    const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i);
    if (fenced) return fenced[1].trim();

    // 2) Any fenced block at all (model sometimes omits the "json" tag).
    const anyFence = trimmed.match(/```\s*([\s\S]*?)```/);
    if (anyFence) return anyFence[1].trim();

    // 3) No fences: fall back to the outermost {...} span — handles
    // plain prose-then-JSON or JSON-then-prose with no code fence at
    // all, by matching from the first "{" to the LAST "}" in the text
    // (the JSON payload is always the largest brace-delimited region).
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return trimmed.slice(firstBrace, lastBrace + 1);
    }

    // 4) Nothing brace-shaped found at all — return as-is so the
    // caller's JSON.parse fails with the original text for debugging.
    return trimmed;
  }

  private static parseAndValidate<T>(rawText: string, schema: z.ZodTypeAny): T {
    let json: unknown;
    try {
      json = JSON.parse(this.extractJsonCandidate(rawText));
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
