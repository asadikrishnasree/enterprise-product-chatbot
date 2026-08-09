import {
    GoogleGenAI,
  } from "@google/genai";
  
  import type {
    LlmGenerationRequest,
    LlmGenerationResult,
  } from "../types.js";
  
  import type {
    LlmProvider,
  } from "../llmProvider.js";
  
  const GEMINI_MODEL =
    process.env.GEMINI_MODEL?.trim() ||
    "gemini-3.6-flash";
  
  /**
   * GeminiProvider
   *
   * Real Google Gemini implementation of
   * our common LlmProvider interface.
   */
  export class GeminiProvider implements LlmProvider {
    
    readonly provider = "claude" as const;

    async generate(
      request: LlmGenerationRequest,
    ): Promise<LlmGenerationResult> {
      const apiKey =
        process.env.GEMINI_API_KEY?.trim();
  
      if (!apiKey) {
        throw new Error(
          "GEMINI_API_KEY is not configured.",
        );
      }
  
      const client = new GoogleGenAI({
        apiKey,
      });
  
      const startedAt = Date.now();
  
      /*
       * For this first Gemini integration we build
       * one complete prompt from:
       *
       * 1. system instructions
       * 2. retrieved RAG context
       * 3. conversation
       *
       * This matches the architecture already used
       * by your OpenAI provider and avoids changing
       * the rest of the application.
       */
      const conversation =
        request.messages
          .map(
            (message) =>
              `${message.role.toUpperCase()}: ${message.content}`,
          )
          .join("\n\n");
  
      const prompt = [
        "SYSTEM INSTRUCTIONS:",
        request.systemPrompt,
  
        "",
  
        "PRODUCT KNOWLEDGE CONTEXT:",
        request.context,
  
        "",
  
        "IMPORTANT:",
        "Answer using only the product knowledge context above.",
        "If the context does not contain enough information to answer the question, clearly say that the information was not found in the product knowledge base.",
        "Do not invent product features, pricing, integrations, support commitments, or version information.",
  
        "",
  
        "CONVERSATION:",
        conversation,
      ].join("\n");
  
      const response =
        await client.models.generateContent({
          model: GEMINI_MODEL,
  
          contents: prompt,
        });
  
      const content =
        response.text?.trim() ?? "";
  
      /*
       * Gemini exposes token information through
       * usageMetadata.
       */
      const inputTokens =
        response.usageMetadata
          ?.promptTokenCount ?? 0;
  
      const outputTokens =
        response.usageMetadata
          ?.candidatesTokenCount ?? 0;
  
      /*
       * Keep cost at 0 until Gemini pricing is
       * added to your centralized pricing service.
       */
      const cost = 0;
  
      return {
        content:
          content ||
          "Gemini returned an empty response.",
  
        provider: "gemini",
  
        model: GEMINI_MODEL,
  
        inputTokens,
  
        outputTokens,
  
        cost,
  
        latencyMs:
          Date.now() - startedAt,
      };
    }
  }