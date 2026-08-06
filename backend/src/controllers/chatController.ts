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

import {
  streamOpenAIResponse,
} from "../services/llm/streaming/openAIStreamingService.js";

import {
  streamMockResponse,
} from "../services/llm/streaming/mockStreamingService.js";

import type {
  ChatRequest,
  ChatResponse,
  ModelProvider,
} from "../types/chat.js";

type ChatErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

type RetrievedChunks = Awaited<
  ReturnType<typeof retrieveRelevantChunks>
>;

const DEFAULT_SYSTEM_PROMPT =
  "Answer only using the supplied product documentation. " +
  "If the answer is not supported by the context, clearly say " +
  "that it was not found in the knowledge base.";

const NOT_FOUND_MESSAGE =
  "I couldn't find that information in the product knowledge base.";

const supportedProviders: ModelProvider[] = [
  "openai",
  "claude",
  "gemini",
];

const isSupportedProvider = (
  provider: unknown,
): provider is ModelProvider =>
  typeof provider === "string" &&
  supportedProviders.includes(
    provider as ModelProvider,
  );

const sendSseEvent = (
  response: Response,
  eventName: string,
  data: unknown,
): void => {
  response.write(
    `event: ${eventName}\n` +
      `data: ${JSON.stringify(data)}\n\n`,
  );
};

const buildKnowledgeContext = (
  chunks: RetrievedChunks,
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

const buildMockRetrievedContent = (
  chunks: RetrievedChunks,
): string =>
  chunks
    .slice(0, 3)
    .map(
      (chunk, index) =>
        [
          `Source ${index + 1}: ${chunk.source}`,
          chunk.section
            ? `Section: ${chunk.section}`
            : null,
          chunk.content,
        ]
          .filter(
            (
              value,
            ): value is string =>
              Boolean(value),
          )
          .join("\n"),
    )
    .join("\n\n");

const mapSourceChunks = (
  chunks: RetrievedChunks,
) =>
  chunks.map((chunk) => ({
    id: chunk.id,
    source: chunk.source,
    content: chunk.content,
    score: chunk.score,
  }));

const findLatestUserMessage = (
  messages: ChatRequest["messages"],
) =>
  [...messages]
    .reverse()
    .find(
      (message) =>
        message.role === "user",
    );

const validateChatRequest = (
  requestBody: ChatRequest,
):
  | {
      valid: true;
      model: ModelProvider;
      latestUserMessage: {
        role: "user";
        content: string;
      };
    }
  | {
      valid: false;
      status: number;
      error: ChatErrorResponse;
    } => {
  const {
    model,
    messages,
    knowledgeBaseId,
  } = requestBody;

  if (!model) {
    return {
      valid: false,
      status: 400,
      error: {
        error: {
          code: "MODEL_REQUIRED",
          message:
            "A model provider is required.",
        },
      },
    };
  }

  if (!isSupportedProvider(model)) {
    return {
      valid: false,
      status: 400,
      error: {
        error: {
          code: "MODEL_NOT_SUPPORTED",
          message:
            "Supported providers are openai, claude, and gemini.",
        },
      },
    };
  }

  if (
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    return {
      valid: false,
      status: 400,
      error: {
        error: {
          code: "MESSAGES_REQUIRED",
          message:
            "At least one conversation message is required.",
        },
      },
    };
  }

  if (!knowledgeBaseId) {
    return {
      valid: false,
      status: 400,
      error: {
        error: {
          code:
            "KNOWLEDGE_BASE_REQUIRED",
          message:
            "A knowledge base ID is required.",
        },
      },
    };
  }

  const latestUserMessage =
    findLatestUserMessage(messages);

  if (!latestUserMessage) {
    return {
      valid: false,
      status: 400,
      error: {
        error: {
          code:
            "USER_MESSAGE_REQUIRED",
          message:
            "A user message is required.",
        },
      },
    };
  }

  return {
    valid: true,
    model,
    latestUserMessage: {
      role: "user",
      content:
        latestUserMessage.content,
    },
  };
};

/*
 * Non-streaming endpoint.
 *
 * This keeps your existing provider fallback flow.
 * The streaming mock behavior is handled separately below.
 */
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
    const validation =
      validateChatRequest(
        request.body,
      );

    if (!validation.valid) {
      return response
        .status(validation.status)
        .json(validation.error);
    }

    const {
      model,
      latestUserMessage,
    } = validation;

    const {
      messages,
      systemPrompt,
    } = request.body;

    const retrievedChunks =
      await retrieveRelevantChunks(
        latestUserMessage.content,
        6,
      );

    if (
      retrievedChunks.length === 0
    ) {
      return response
        .status(200)
        .json({
          message:
            NOT_FOUND_MESSAGE,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          model,
          latencyMs: 0,
          sourceChunks: [],
        });
    }

    /*
     * Claude and Gemini use the local mock
     * response when this non-streaming
     * endpoint is called.
     */
    if (
      model === "claude" ||
      model === "gemini"
    ) {
      let completeContent = "";

      const mockResult =
        await streamMockResponse(
          {
            provider: model,
            question:
              latestUserMessage.content,
            retrievedContent:
              buildMockRetrievedContent(
                retrievedChunks,
              ),
          },
          (textDelta) => {
            completeContent +=
              textDelta;
          },
        );

      return response
        .status(200)
        .json({
          message:
            completeContent,
          inputTokens:
            mockResult.inputTokens,
          outputTokens:
            mockResult.outputTokens,
          cost: 0,
          model,
          latencyMs:
            mockResult.latencyMs,
          sourceChunks:
            mapSourceChunks(
              retrievedChunks,
            ),
        });
    }

    const llmResult =
      await generateWithFallback(
        model,
        {
          messages,
          systemPrompt:
            systemPrompt?.trim() ||
            DEFAULT_SYSTEM_PROMPT,
          context:
            buildKnowledgeContext(
              retrievedChunks,
            ),
        },
      );

    const result: ChatResponse = {
      message:
        llmResult.content,
      inputTokens:
        llmResult.inputTokens,
      outputTokens:
        llmResult.outputTokens,
      cost:
        llmResult.cost,
      model:
        llmResult.provider,
      latencyMs:
        llmResult.latencyMs,
      sourceChunks:
        mapSourceChunks(
          retrievedChunks,
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

    return response
      .status(500)
      .json({
        error: {
          code:
            "CHAT_GENERATION_FAILED",
          message,
        },
      });
  }
};

/*
 * Simple SSE test endpoint.
 */
export const createTestChatStream =
  async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    response.status(200);

    response.setHeader(
      "Content-Type",
      "text/event-stream",
    );

    response.setHeader(
      "Cache-Control",
      "no-cache, no-transform",
    );

    response.setHeader(
      "Connection",
      "keep-alive",
    );

    response.setHeader(
      "X-Accel-Buffering",
      "no",
    );

    response.flushHeaders();

    const words = [
      "This",
      " is",
      " a",
      " test",
      " SSE",
      " response",
      " from",
      " the",
      " Node",
      " backend.",
    ];

    let index = 0;

    const interval =
      setInterval(() => {
        if (
          index >= words.length
        ) {
          sendSseEvent(
            response,
            "done",
            {
              completed: true,
            },
          );

          clearInterval(interval);
          response.end();
          return;
        }

        sendSseEvent(
          response,
          "delta",
          {
            text: words[index],
          },
        );

        index += 1;
      }, 300);

    request.on(
      "close",
      () => {
        clearInterval(interval);

        if (
          !response.writableEnded
        ) {
          response.end();
        }
      },
    );
  };

/*
 * Main streaming chat endpoint.
 *
 * OpenAI:
 *   Uses the real OpenAI API.
 *
 * Claude and Gemini:
 *   Use the local mock streaming service.
 */
export const createChatStream =
  async (
    request: Request<
      Record<string, never>,
      unknown,
      ChatRequest
    >,
    response: Response,
  ): Promise<void> => {
    const validation =
      validateChatRequest(
        request.body,
      );

    /*
     * Validate before starting SSE so
     * errors can be returned as JSON.
     */
    if (!validation.valid) {
      response
        .status(validation.status)
        .json(validation.error);

      return;
    }

    const {
      model,
      latestUserMessage,
    } = validation;

    const {
      messages,
      systemPrompt,
    } = request.body;

    const abortController =
      new AbortController();

    response.on(
      "close",
      () => {
        if (
          !response.writableEnded
        ) {
          abortController.abort();
        }
      },
    );

    response.status(200);

    response.setHeader(
      "Content-Type",
      "text/event-stream",
    );

    response.setHeader(
      "Cache-Control",
      "no-cache, no-transform",
    );

    response.setHeader(
      "Connection",
      "keep-alive",
    );

    /*
     * Prevent Nginx from buffering
     * token-by-token responses.
     */
    response.setHeader(
      "X-Accel-Buffering",
      "no",
    );

    response.flushHeaders();

    try {
      sendSseEvent(
        response,
        "status",
        {
          stage: "retrieving",
          message:
            "Searching the knowledge base...",
        },
      );

      const retrievedChunks =
        await retrieveRelevantChunks(
          latestUserMessage.content,
          6,
        );

      if (
        retrievedChunks.length === 0
      ) {
        sendSseEvent(
          response,
          "delta",
          {
            text:
              NOT_FOUND_MESSAGE,
          },
        );

        sendSseEvent(
          response,
          "done",
          {
            message:
              NOT_FOUND_MESSAGE,
            inputTokens: 0,
            outputTokens: 0,
            cost: 0,
            model,
            latencyMs: 0,
            sourceChunks: [],
          },
        );

        response.end();
        return;
      }

      sendSseEvent(
        response,
        "status",
        {
          stage: "generating",
          message:
            model === "openai"
              ? "Generating the answer with OpenAI..."
              : `Generating a mock ${model} answer...`,
        },
      );

      /*
       * OpenAI uses the actual API.
       */
      if (model === "openai") {
        const streamingResult =
          await streamOpenAIResponse(
            {
              messages,
              systemPrompt:
                systemPrompt?.trim() ||
                DEFAULT_SYSTEM_PROMPT,
              context:
                buildKnowledgeContext(
                  retrievedChunks,
                ),
            },
            (textDelta) => {
              if (
                response.writableEnded ||
                response.destroyed
              ) {
                return;
              }

              sendSseEvent(
                response,
                "delta",
                {
                  text:
                    textDelta,
                },
              );
            },
            abortController.signal,
          );

        sendSseEvent(
          response,
          "done",
          {
            message:
              streamingResult.content,
            inputTokens:
              streamingResult.inputTokens,
            outputTokens:
              streamingResult.outputTokens,
            cost: 0,
            model: "openai",
            providerMode: "live",
            providerModel:
              streamingResult.model,
            latencyMs:
              streamingResult.latencyMs,
            sourceChunks:
              mapSourceChunks(
                retrievedChunks,
              ),
          },
        );

        response.end();
        return;
      }

      /*
       * Claude and Gemini are mocked locally.
       * No Claude or Gemini API keys are needed.
       */
      const mockResult =
        await streamMockResponse(
          {
            provider: model,
            question:
              latestUserMessage.content,
            retrievedContent:
              buildMockRetrievedContent(
                retrievedChunks,
              ),
          },
          (textDelta) => {
            if (
              response.writableEnded ||
              response.destroyed
            ) {
              return;
            }

            sendSseEvent(
              response,
              "delta",
              {
                text:
                  textDelta,
              },
            );
          },
          abortController.signal,
        );

      sendSseEvent(
        response,
        "done",
        {
          message:
            mockResult.content,
          inputTokens:
            mockResult.inputTokens,
          outputTokens:
            mockResult.outputTokens,
          cost: 0,
          model,
          providerMode: "mock",
          providerModel:
            mockResult.model,
          latencyMs:
            mockResult.latencyMs,
          sourceChunks:
            mapSourceChunks(
              retrievedChunks,
            ),
        },
      );

      response.end();
    } catch (error: unknown) {
      console.error(
        "Streaming chat request failed:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unknown streaming error.";

      if (
        !response.writableEnded &&
        !response.destroyed
      ) {
        sendSseEvent(
          response,
          "error",
          {
            code:
              "CHAT_STREAM_FAILED",
            message,
          },
        );

        response.end();
      }
    }
  };