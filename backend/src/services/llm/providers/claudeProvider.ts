import Anthropic from "@anthropic-ai/sdk";

import type {
  LlmProvider,
} from "../llmProvider.js";

import type {
  LlmGenerationRequest,
  LlmGenerationResult,
} from "../types.js";

const DEFAULT_CLAUDE_MODEL =
  "claude-sonnet-5";

const buildKnowledgePrompt = (
  request: LlmGenerationRequest,
): string => {
  const conversation = request.messages
    .filter((message) => message.role !== "system")
    .map(
      (message) =>
        `${message.role.toUpperCase()}: ${message.content}`,
    )
    .join("\n\n");

  return [
    "KNOWLEDGE-BASE CONTEXT:",
    request.context,
    "",
    "CONVERSATION:",
    conversation,
    "",
    "Answer the latest user question using only the supplied knowledge-base context.",
    "If the answer is not present in the context, clearly say that it was not found in the knowledge base.",
  ].join("\n");
};

export class ClaudeProvider implements LlmProvider {
  readonly provider = "claude" as const;

  private readonly client: Anthropic;

  private readonly model: string;

  constructor() {
    const apiKey =
      process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not configured.",
      );
    }

    this.client = new Anthropic({
      apiKey,
    });

    this.model =
      process.env.ANTHROPIC_MODEL?.trim() ||
      DEFAULT_CLAUDE_MODEL;
  }

  async generate(
    request: LlmGenerationRequest,
  ): Promise<LlmGenerationResult> {
    const startedAt = performance.now();

    const response =
      await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: request.systemPrompt,
        messages: [
          {
            role: "user",
            content:
              buildKnowledgePrompt(request),
          },
        ],
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

    if (!content) {
      throw new Error(
        "Claude returned an empty response.",
      );
    }

    const inputTokens =
      response.usage.input_tokens;

    const outputTokens =
      response.usage.output_tokens;

    return {
      content,
      provider: this.provider,
      model: this.model,
      inputTokens,
      outputTokens,

      // Claude pricing will be added to
      // pricingService in a later step.
      cost: 0,

      latencyMs: Math.round(
        performance.now() - startedAt,
      ),
    };
  }
}