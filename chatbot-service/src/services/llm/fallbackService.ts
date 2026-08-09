import type {
    ModelProvider,
  } from "../../types/chat.js";
  
  import {
    getLlmProvider,
  } from "./providerFactory.js";
  
  import type {
    LlmGenerationRequest,
    LlmGenerationResult,
  } from "./types.js";
  
  const FALLBACK_ORDER: Record<
    ModelProvider,
    ModelProvider[]
  > = {
    openai: ["openai", "claude", "gemini"],
    claude: ["claude", "openai", "gemini"],
    gemini: ["gemini", "openai", "claude"],
  };
  
  export interface FallbackGenerationResult
    extends LlmGenerationResult {
    requestedProvider: ModelProvider;
    fallbackUsed: boolean;
    attemptedProviders: ModelProvider[];
  }
  
  export const generateWithFallback = async (
    requestedProvider: ModelProvider,
    request: LlmGenerationRequest,
  ): Promise<FallbackGenerationResult> => {
    const providerOrder =
      FALLBACK_ORDER[requestedProvider];
  
    const attemptedProviders: ModelProvider[] = [];
    const errors: string[] = [];
  
    for (const providerName of providerOrder) {
      attemptedProviders.push(providerName);
  
      try {
        const provider =
          getLlmProvider(providerName);
  
        const result =
          await provider.generate(request);
  
        return {
          ...result,
          requestedProvider,
          fallbackUsed:
            providerName !== requestedProvider,
          attemptedProviders,
        };
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown provider error.";
  
        errors.push(
          `${providerName}: ${message}`,
        );
  
        console.error(
          `Provider ${providerName} failed:`,
          error,
        );
      }
    }
  
    throw new Error(
      `All configured providers failed. ${errors.join(
        " | ",
      )}`,
    );
  };