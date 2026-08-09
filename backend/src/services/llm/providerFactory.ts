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
  ClaudeProvider,
} from "./providers/claudeProvider.js";

import {
  GeminiProvider,
} from "./providers/geminiProvider.js";

export const getLlmProvider = (
  provider: ModelProvider,
): LlmProvider => {
  switch (provider) {
    case "openai":
      return new OpenAIProvider();

    case "claude":
      return new ClaudeProvider();

    case "gemini":
      return new GeminiProvider();

    default: {
      const exhaustiveCheck: never =
        provider;

      throw new Error(
        `Unsupported provider: ${String(
          exhaustiveCheck,
        )}`,
      );
    }
  }
};