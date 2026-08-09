import OpenAI from "openai";

import type {
  LlmGenerationRequest,
} from "../types.js";

export type OpenAIStreamingResult = {
  content: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  model: string;
};

type StreamTextHandler = (
  textDelta: string,
) => void;

const OPENAI_MODEL =
  process.env.OPENAI_MODEL?.trim() ||
  "gpt-5-mini";

const buildStreamingInput = (
  request: LlmGenerationRequest,
): string => {
  const conversation = request.messages
    .map(
      (message) =>
        `${message.role.toUpperCase()}: ${message.content}`,
    )
    .join("\n\n");

  return [
    "SYSTEM INSTRUCTIONS:",
    request.systemPrompt,
    "",
    "PRODUCT KNOWLEDGE CONTEXT:",
    request.context,
    "",
    "CONVERSATION:",
    conversation,
  ].join("\n");
};

export const streamOpenAIResponse = async (
  request: LlmGenerationRequest,
  onTextDelta: StreamTextHandler,
  abortSignal?: AbortSignal,
): Promise<OpenAIStreamingResult> => {
  const apiKey =
    process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured.",
    );
  }

  const client = new OpenAI({
    apiKey,
  });

  const startedAt = Date.now();
  let completeContent = "";
  let inputTokens = 0;
  let outputTokens = 0;

  const stream =
    await client.responses.create(
      {
        model: OPENAI_MODEL,
        input: buildStreamingInput(
          request,
        ),
        stream: true,
      },
      abortSignal
        ? {
            signal: abortSignal,
          }
        : undefined,
    );

  for await (const event of stream) {
    if (
      event.type ===
      "response.output_text.delta"
    ) {
      const textDelta = event.delta;

      completeContent += textDelta;
      onTextDelta(textDelta);
    }

    if (
      event.type ===
      "response.completed"
    ) {
      inputTokens =
        event.response.usage
          ?.input_tokens ?? 0;

      outputTokens =
        event.response.usage
          ?.output_tokens ?? 0;
    }

    if (event.type === "error") {
      throw new Error(
        event.message ||
          "OpenAI streaming failed.",
      );
    }
  }

  return {
    content: completeContent,
    inputTokens,
    outputTokens,
    latencyMs:
      Date.now() - startedAt,
    model: OPENAI_MODEL,
  };
};