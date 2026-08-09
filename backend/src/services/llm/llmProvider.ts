import type {
  LlmGenerationRequest,
  LlmGenerationResult,
} from "./types.js";

/**
 * Common interface implemented by every
 * supported LLM provider.
 *
 * The rest of the application does not need
 * to know whether it is talking to OpenAI,
 * Anthropic, or Google.
 */
export interface LlmProvider {
  generate(
    request: LlmGenerationRequest,
  ): Promise<LlmGenerationResult>;
}