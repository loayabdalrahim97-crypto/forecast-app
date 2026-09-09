import type { AIProvider } from "./provider";
import { AnthropicProvider } from "./providers/anthropic";
// import { OpenAIProvider } from "./providers/openai";   // add when needed
// import { GoogleProvider } from "./providers/google";   // add when needed

const registry: Record<string, () => AIProvider> = {
  anthropic: () => new AnthropicProvider(),
  // openai: () => new OpenAIProvider(),
  // google: () => new GoogleProvider(),
};

export class AIProviderFactory {
  static get(providerId: string): AIProvider {
    const factory = registry[providerId];
    if (!factory) {
      throw new Error(
        `Unknown AI provider "${providerId}". Registered providers: ${Object.keys(registry).join(", ")}`
      );
    }
    return factory();
  }
}
