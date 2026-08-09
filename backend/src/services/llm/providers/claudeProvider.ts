import Anthropic from "@anthropic-ai/sdk";

import type {
  LlmGenerationRequest,
  LlmGenerationResult,
} from "../types.js";

import type {
  LlmProvider,
} from "../llmProvider.js";

const CLAUDE_MODEL =
  process.env.CLAUDE_MODEL?.trim() ||
  "claude-sonnet-4-6";

export class ClaudeProvider implements LlmProvider {
  readonly provider = "claude" as const;

  async generate(
    request: LlmGenerationRequest,
  ): Promise<LlmGenerationResult> {
    const apiKey =
      process.env.ANTHROPIC_API_KEY?.trim();

    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not configured.",
      );
    }

    const client = new Anthropic({
      apiKey,
    });

    const startedAt = Date.now();

    const system = [
      request.systemPrompt,
      "",
      "PRODUCT KNOWLEDGE CONTEXT:",
      request.context,
      "",
      "IMPORTANT:",
      "Answer using only the product knowledge context above.",
      "If the context does not contain enough information to answer the question, clearly say that the information was not found in the product knowledge base.",
      "Do not invent product features, pricing, support commitments, integrations, or version information.",
    ].join("\n");

    const messages: Anthropic.MessageParam[] =
      request.messages
        .filter(
          (message) =>
            message.role === "user" ||
            message.role === "assistant",
        )
        .map((message) => ({
          role: message.role as
            | "user"
            | "assistant",
          content: message.content,
        }));

    if (messages.length === 0) {
      throw new Error(
        "Claude request contains no user or assistant messages.",
      );
    }

    const response =
      await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1200,
        system,
        messages,
      });

    const content = response.content
      .filter(
        (
          block,
        ): block is Anthropic.TextBlock =>
          block.type === "text",
      )
      .map((block) => block.text)
      .join("\n")
      .trim();

    const inputTokens =
      response.usage.input_tokens ?? 0;

    const outputTokens =
      response.usage.output_tokens ?? 0;

    return {
      content:
        content ||
        "Claude returned an empty response.",

      provider: this.provider,

      model: CLAUDE_MODEL,

      inputTokens,

      outputTokens,

      cost: 0,

      latencyMs:
        Date.now() - startedAt,
    };
  }
}