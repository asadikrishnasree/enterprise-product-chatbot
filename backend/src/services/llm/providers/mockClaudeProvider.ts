import type {
    LlmProvider,
  } from "../llmProvider.js";
  
  import type {
    LlmGenerationRequest,
    LlmGenerationResult,
  } from "../types.js";
  
  export class MockClaudeProvider implements LlmProvider {
    readonly provider = "claude" as const;
  
    private readonly model = "claude-mock";
  
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
  
      const content = [
        "Mock Claude response based on the retrieved knowledge base.",
        "",
        `Question: ${question}`,
        "",
        "Retrieved knowledge:",
        request.context,
      ].join("\n");
  
      const inputTokens = Math.ceil(
        (
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