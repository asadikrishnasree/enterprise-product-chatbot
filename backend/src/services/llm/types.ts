import type {
    ModelProvider,
  } from "../../types/chat.js";
  
  export interface LlmMessage {
    role: "system" | "user" | "assistant";
    content: string;
  }
  
  export interface LlmGenerationRequest {
    messages: LlmMessage[];
    systemPrompt: string;
    context: string;
  }
  
  export interface LlmGenerationResult {
    content: string;
  
    provider: ModelProvider;
  
    model: string;
  
    inputTokens: number;
  
    outputTokens: number;
  
    cost: number;
  
    latencyMs: number;
  }