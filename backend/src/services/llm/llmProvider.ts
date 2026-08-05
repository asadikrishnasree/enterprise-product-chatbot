import type {
    ModelProvider,
  } from "../../types/chat.js";
  
  import type {
    LlmGenerationRequest,
    LlmGenerationResult,
  } from "./types.js";
  
  export interface LlmProvider {
    readonly provider: ModelProvider;
  
    generate(
      request: LlmGenerationRequest,
    ): Promise<LlmGenerationResult>;
  }