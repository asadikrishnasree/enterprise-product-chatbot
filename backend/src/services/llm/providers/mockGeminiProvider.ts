import type {
    LlmProvider,
  } from "../llmProvider.js";
  
  import type {
    LlmGenerationRequest,
    LlmGenerationResult,
  } from "../types.js";
  
  export class MockGeminiProvider implements LlmProvider {
    readonly provider = "gemini" as const;
  
    private readonly model = "gemini-mock";
  
    async generate(
      request: LlmGenerationRequest,
    ): Promise<LlmGenerationResult> {
      const startedAt = performance.now();
  
      const latestUserMessage = [...request.messages]
        .reverse()
        .find(
          (message) =>
            message.role === "user",
        );
  
      const question =
        latestUserMessage?.content ??
        "Unknown question";
  
      const contextPreview =
        request.context.length > 1800
          ? `${request.context.slice(0, 1800)}\n\n[Context truncated for mock response]`
          : request.context;
  
      const content = [
        "Mock Gemini response generated from the retrieved product documentation.",
        "",
        `Question: ${question}`,
        "",
        "Relevant knowledge-base context:",
        contextPreview,
      ].join("\n");
  
      const inputTokens = Math.ceil(
        (
          request.systemPrompt +
          request.context +
          question
        ).length / 4,
      );
  
      const outputTokens = Math.ceil(
        content.length / 4,
      );
  
      return {
        content,
        provider: this.provider,
        model: this.model,
        inputTokens,
        outputTokens,
        cost: 0,
        latencyMs: Math.round(
          performance.now() - startedAt,
        ),
      };
    }
  }