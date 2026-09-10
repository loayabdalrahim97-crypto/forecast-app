/**
 * §22: AI cost tracking needs a price to multiply token counts by.
 * These are USD per 1M tokens, current as of this codebase's writing —
 * Anthropic updates pricing periodically, so treat this as the one
 * place to update it, not a value to duplicate elsewhere.
 *
 * Kept approximate and clearly labeled as such in the AIRequest row
 * (estimatedCostUsd) — this is for internal cost visibility and
 * budgeting, not an invoice.
 */
export const MODEL_PRICING_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 1.0, output: 5.0 },
  "claude-sonnet-5": { input: 3.0, output: 15.0 },
  "claude-opus-5": { input: 15.0, output: 75.0 },
};

const DEFAULT_PRICING = { input: 3.0, output: 15.0 };

export function estimateCostUsd(params: {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
}): number {
  const pricing = MODEL_PRICING_PER_MILLION_TOKENS[params.model] ?? DEFAULT_PRICING;
  // Cached input tokens are billed far cheaper than fresh input tokens
  // (typically ~90% off) — approximate that here rather than counting
  // them as full price, which would overstate real spend.
  const freshInputTokens = Math.max(0, params.inputTokens - (params.cachedTokens ?? 0));
  const cachedCost = ((params.cachedTokens ?? 0) / 1_000_000) * pricing.input * 0.1;
  const freshInputCost = (freshInputTokens / 1_000_000) * pricing.input;
  const outputCost = (params.outputTokens / 1_000_000) * pricing.output;
  return freshInputCost + cachedCost + outputCost;
}
