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

import {
  streamOpenAIResponse,
} from "../services/llm/streaming/openAIStreamingService.js";

type ChatErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};
const sendSseEvent = (
  response: Response,
  eventName: string,
  data: unknown,
): void => {
  response.write(
    `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`,
  );
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

export const createTestChatStream = async (
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

  // Prevent proxies such as Nginx from buffering the response.
  response.setHeader(
    "X-Accel-Buffering",
    "no",
  );

  // Immediately send the HTTP headers.
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

  const interval = setInterval(() => {
    if (index >= words.length) {
      response.write(
        `event: done\ndata: ${JSON.stringify({
          completed: true,
        })}\n\n`,
      );

      clearInterval(interval);
      response.end();
      return;
    }

    response.write(
      `event: delta\ndata: ${JSON.stringify({
        text: words[index],
      })}\n\n`,
    );

    index += 1;
  }, 300);

  request.on("close", () => {
    clearInterval(interval);

    if (!response.writableEnded) {
      response.end();
    }
  });
};

export const createChatStream = async (
  request: Request<
    Record<string, never>,
    unknown,
    ChatRequest
  >,
  response: Response,
): Promise<void> => {
  const {
    model,
    messages,
    knowledgeBaseId,
    systemPrompt,
  } = request.body;

  /*
   * Validate before opening the SSE connection.
   * This allows us to return normal JSON errors for
   * invalid requests.
   */
  if (!model) {
    response.status(400).json({
      error: {
        code: "MODEL_REQUIRED",
        message:
          "A model provider is required.",
      },
    });

    return;
  }

  if (model !== "openai") {
    response.status(400).json({
      error: {
        code:
          "STREAMING_PROVIDER_NOT_SUPPORTED",
        message:
          "Streaming currently supports only the OpenAI provider.",
      },
    });

    return;
  }

  if (
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    response.status(400).json({
      error: {
        code: "MESSAGES_REQUIRED",
        message:
          "At least one conversation message is required.",
      },
    });

    return;
  }

  if (!knowledgeBaseId) {
    response.status(400).json({
      error: {
        code: "KNOWLEDGE_BASE_REQUIRED",
        message:
          "A knowledge base ID is required.",
      },
    });

    return;
  }

  const latestUserMessage = [...messages]
    .reverse()
    .find(
      (message) =>
        message.role === "user",
    );

  if (!latestUserMessage) {
    response.status(400).json({
      error: {
        code: "USER_MESSAGE_REQUIRED",
        message:
          "A user message is required.",
      },
    });

    return;
  }

  /*
   * The AbortController lets us stop the OpenAI request
   * if the browser closes the SSE connection.
   */
  const abortController =
    new AbortController();

  response.on("close", () => {
    if (!response.writableEnded) {
      abortController.abort();
    }
  });

  /*
   * Open the SSE response.
   */
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

    if (retrievedChunks.length === 0) {
      sendSseEvent(
        response,
        "delta",
        {
          text:
            "I couldn't find that information in the product knowledge base.",
        },
      );

      sendSseEvent(
        response,
        "done",
        {
          message:
            "I couldn't find that information in the product knowledge base.",
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
          "Generating the answer...",
      },
    );

    const streamingResult =
      await streamOpenAIResponse(
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
              text: textDelta,
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

        /*
         * We will connect the pricing service
         * in a later step.
         */
        cost: 0,

        model: "openai",
        latencyMs:
          streamingResult.latencyMs,

        sourceChunks:
          retrievedChunks.map(
            (chunk) => ({
              id: chunk.id,
              source: chunk.source,
              content: chunk.content,
              score: chunk.score,
            }),
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