import type {
  Request,
  Response,
} from "express";

import {
  generateWithFallback,
} from "../services/llm/fallbackService.js";

import {
  retrieveRelevantChunks,
} from "../services/retrieval/retrievalService.js";

import type {
  ChatRequest,
  ChatResponse,
} from "../types/chat.js";

type ChatErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

const buildKnowledgeContext = (
  chunks: Awaited<
    ReturnType<typeof retrieveRelevantChunks>
  >,
): string =>
  chunks
    .map(
      (chunk, index) =>
        [
          `SOURCE ${index + 1}`,
          `File: ${chunk.source}`,
          `Section: ${chunk.section}`,
          chunk.content,
        ].join("\n"),
    )
    .join("\n\n---\n\n");

export const createChatResponse = async (
  request: Request<
    Record<string, never>,
    ChatResponse | ChatErrorResponse,
    ChatRequest
  >,
  response: Response<
    ChatResponse | ChatErrorResponse
  >,
) => {
  try {
    const {
      model,
      messages,
      knowledgeBaseId,
      systemPrompt,
    } = request.body;

    if (!model) {
      return response.status(400).json({
        error: {
          code: "MODEL_REQUIRED",
          message: "A model provider is required.",
        },
      });
    }

    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return response.status(400).json({
        error: {
          code: "MESSAGES_REQUIRED",
          message:
            "At least one conversation message is required.",
        },
      });
    }

    if (!knowledgeBaseId) {
      return response.status(400).json({
        error: {
          code: "KNOWLEDGE_BASE_REQUIRED",
          message:
            "A knowledge base ID is required.",
        },
      });
    }

    const latestUserMessage = [...messages]
      .reverse()
      .find(
        (message) =>
          message.role === "user",
      );

    if (!latestUserMessage) {
      return response.status(400).json({
        error: {
          code: "USER_MESSAGE_REQUIRED",
          message:
            "A user message is required.",
        },
      });
    }

    const retrievedChunks =
      await retrieveRelevantChunks(
        latestUserMessage.content,
        6,
      );

    if (retrievedChunks.length === 0) {
      return response.status(200).json({
        message:
          "I couldn't find that information in the product knowledge base.",
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        model,
        latencyMs: 0,
        sourceChunks: [],
      });
    }

      const llmResult =
      await generateWithFallback(
        model,
        {
          messages,
          systemPrompt:
            systemPrompt?.trim() ||
            "Answer only using the supplied product documentation. If the answer is not supported by the context, clearly say that it was not found in the knowledge base.",
          context:
            buildKnowledgeContext(
              retrievedChunks,
            ),
        },
      );

    const result: ChatResponse = {
      message: llmResult.content,
      inputTokens:
        llmResult.inputTokens,
      outputTokens:
        llmResult.outputTokens,
      cost: llmResult.cost,
      model:
        llmResult.provider,
      latencyMs:
        llmResult.latencyMs,
      sourceChunks:
        retrievedChunks.map(
          (chunk) => ({
            id: chunk.id,
            source:
              chunk.source,
            content:
              chunk.content,
            score:
              chunk.score,
          }),
        ),
    };

    return response
      .status(200)
      .json(result);
  } catch (error: unknown) {
    console.error(
      "Chat request failed:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown chat error.";

    return response.status(500).json({
      error: {
        code: "CHAT_GENERATION_FAILED",
        message,
      },
    });
  }
};