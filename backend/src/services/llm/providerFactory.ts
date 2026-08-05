import type {
    ModelProvider,
  } from "../../types/chat.js";
  
  import type {
    LlmProvider,
  } from "./llmProvider.js";
  
  import {
    OpenAIProvider,
  } from "./providers/openAIProvider.js";
  
  import {
    MockClaudeProvider,
  } from "./providers/mockClaudeProvider.js";

  import {
    MockGeminiProvider,
  } from "./providers/mockGeminiProvider.js";

  const unsupportedProviderError = (
    provider: ModelProvider,
  ): Error =>
    new Error(
      `The ${provider} provider has not been configured yet.`,
    );
  
  export const getLlmProvider = (
    provider: ModelProvider,
  ): LlmProvider => {
    switch (provider) {
      case "openai":
        return new OpenAIProvider();
  
        case "claude":
          return new MockClaudeProvider();

        case "gemini":
          return new MockGeminiProvider();
  
      default: {
        const exhaustiveCheck: never = provider;
  
        throw new Error(
          `Unsupported provider: ${String(exhaustiveCheck)}`,
        );
      }
    }
  };