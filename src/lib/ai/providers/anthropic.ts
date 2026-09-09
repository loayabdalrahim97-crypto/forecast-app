import type { AICallParams, AICallResult, AIProvider } from "../provider";

// Model names are configuration, not hard-coded business logic — change
// them here (or move to a config table) without touching the orchestrator
// or the Forecast Engine.
const MODEL_TIERS = {
  cheap: "claude-haiku-4-5-20251001",
  standard: "claude-sonnet-5",
  premium: "claude-opus-5",
} as const;

export class AnthropicProvider implements AIProvider {
  readonly id = "anthropic";

  modelForTier(tier: keyof typeof MODEL_TIERS): string {
    return MODEL_TIERS[tier];
  }

  async complete(params: AICallParams, tier: keyof typeof MODEL_TIERS): Promise<AICallResult> {
    const model = this.modelForTier(tier);
    const start = Date.now();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: params.maxOutputTokens ?? 1024,
        system: params.systemPrompt,
        messages: [{ role: "user", content: params.userPrompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const rawText = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n");

    return {
      rawText,
      provider: this.id,
      model,
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
      cachedTokens: data.usage?.cache_read_input_tokens ?? 0,
      cacheCreationTokens: data.usage?.cache_creation_input_tokens ?? 0,
      latencyMs: Date.now() - start,
    };
  }
}
