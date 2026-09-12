import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

// The orchestrator gets its provider through AIProviderFactory.get(),
// so mocking that module lets us control exactly what "the model"
// returns without hitting a real API.
vi.mock("./provider-factory", () => {
  return {
    AIProviderFactory: {
      get: vi.fn(),
    },
  };
});

import { AIOrchestrator, AIValidationError } from "./orchestrator";
import { AIProviderFactory } from "./provider-factory";

const TestSchema = z.object({ facts: z.array(z.string()) });

function mockProviderReturning(rawText: string) {
  (AIProviderFactory.get as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    id: "anthropic",
    modelForTier: () => "test-model",
    complete: vi.fn().mockResolvedValue({
      rawText,
      provider: "anthropic",
      model: "test-model",
      inputTokens: 10,
      outputTokens: 10,
      cachedTokens: 0,
      cacheCreationTokens: 0,
      latencyMs: 1,
    }),
  });
}

describe("AIOrchestrator JSON extraction", () => {
  // Reproduces the real production bug: the model sometimes wraps the
  // required JSON in explanatory prose before AND after it, instead of
  // outputting only the JSON as instructed. This previously failed
  // parsing every time for the affected situation (not randomly), so a
  // retry alone never recovered it — the extraction itself had to
  // find the JSON inside the surrounding text.
  it("extracts JSON from a fenced block even with prose before and after it", async () => {
    mockProviderReturning(
      'بعض الشرح الإضافي قبل الجواب...\n\n```json\n{"facts": ["a", "b"]}\n```\n\n---\n**ملخص إضافي بعد الجواب**\nنص زيادة هنا.'
    );

    const result = await AIOrchestrator.run<{ facts: string[] }>({
      requestType: "situation_analysis",
      systemPrompt: "system",
      userPrompt: "user",
      schema: TestSchema,
    });

    expect(result.data.facts).toEqual(["a", "b"]);
  });

  it("extracts JSON from a plain (non-json-tagged) fenced block", async () => {
    mockProviderReturning('```\n{"facts": ["x"]}\n```');

    const result = await AIOrchestrator.run<{ facts: string[] }>({
      requestType: "situation_analysis",
      systemPrompt: "system",
      userPrompt: "user",
      schema: TestSchema,
    });

    expect(result.data.facts).toEqual(["x"]);
  });

  it("extracts the outermost {...} span when there are no code fences at all", async () => {
    mockProviderReturning('Here is the answer: {"facts": ["y"]} — hope that helps!');

    const result = await AIOrchestrator.run<{ facts: string[] }>({
      requestType: "situation_analysis",
      systemPrompt: "system",
      userPrompt: "user",
      schema: TestSchema,
    });

    expect(result.data.facts).toEqual(["y"]);
  });

  it("still parses a clean, unwrapped JSON response (the common case)", async () => {
    mockProviderReturning('{"facts": ["z"]}');

    const result = await AIOrchestrator.run<{ facts: string[] }>({
      requestType: "situation_analysis",
      systemPrompt: "system",
      userPrompt: "user",
      schema: TestSchema,
    });

    expect(result.data.facts).toEqual(["z"]);
  });

  it("throws AIValidationError when nothing JSON-shaped is present, after retrying", async () => {
    mockProviderReturning("Sorry, I can't help with that.");

    await expect(
      AIOrchestrator.run<{ facts: string[] }>({
        requestType: "situation_analysis",
        systemPrompt: "system",
        userPrompt: "user",
        schema: TestSchema,
      })
    ).rejects.toBeInstanceOf(AIValidationError);
  });
});
