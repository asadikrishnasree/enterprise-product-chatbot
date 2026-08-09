import OpenAI from "openai";

import type {
  LlmProvider,
} from "../llmProvider.js";

import type {
  LlmGenerationRequest,
  LlmGenerationResult,
} from "../types.js";

import {
  calculateModelCost,
} from "../../pricing/pricingService.js";

const DEFAULT_OPENAI_MODEL = "gpt-5-mini";

const buildConversationInput = (
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
    "Use only the supplied knowledge-base context.",
    "",
    "KNOWLEDGE-BASE CONTEXT:",
    request.context,
    "",
    "CONVERSATION:",
    conversation,
    "",
    "Answer the latest user question.",
    "If the context does not contain the answer, clearly say that the information was not found in the knowledge base.",
  ].join("\n");
};

export class OpenAIProvider implements LlmProvider {
  readonly provider = "openai" as const;

  private readonly client: OpenAI;

  private readonly model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not configured.",
      );
    }

    this.client = new OpenAI({
      apiKey,
    });

    this.model =
      process.env.OPENAI_MODEL?.trim() ||
      DEFAULT_OPENAI_MODEL;
  }

  async generate(
    request: LlmGenerationRequest,
  ): Promise<LlmGenerationResult> {
    const startedAt = performance.now();

    const response =
      await this.client.responses.create({
        model: this.model,
        instructions: request.systemPrompt,
        input: buildConversationInput(request),
      });

    const content = response.output_text.trim();

    if (!content) {
      throw new Error(
        "OpenAI returned an empty response.",
      );
    }

    const inputTokens =
      response.usage?.input_tokens ?? 0;

    const outputTokens =
      response.usage?.output_tokens ?? 0;

    const costCalculation =
      calculateModelCost(
        this.model,
        inputTokens,
        outputTokens,
      );
    return {
      content,
      provider: this.provider,
      model: this.model,
      inputTokens,
      outputTokens,

      // We will add a centralized pricing configuration later.
      cost: costCalculation.totalCost,

      latencyMs: Math.round(
        performance.now() - startedAt,
      ),
    };
  }
}