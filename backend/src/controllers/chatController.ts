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

import type {
  ChatRequest,
  ChatResponse,
  ModelProvider,
} from "../types/chat.js";

/*
 * Error response returned by the API.
 */
type ChatErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

/*
 * Infer the type returned by retrieveRelevantChunks()
 * instead of duplicating the chunk interface here.
 */
type RetrievedChunks = Awaited<
  ReturnType<typeof retrieveRelevantChunks>
>;

/*
 * Default system prompt used when the frontend
 * does not provide one.
 *
 * This is important for RAG because we want the
 * model to stay grounded in retrieved documentation.
 */
const DEFAULT_SYSTEM_PROMPT =
  "Answer only using the supplied product documentation. " +
  "If the answer is not supported by the context, clearly say " +
  "that it was not found in the knowledge base. " +
  "Do not invent product features, pricing, integrations, " +
  "support commitments, or version information.";

const NOT_FOUND_MESSAGE =
  "I couldn't find that information in the product knowledge base.";

/*
 * Models supported by the application.
 */
const supportedProviders: ModelProvider[] = [
  "openai",
  "claude",
  "gemini",
];

/*
 * Runtime provider validation.
 */
const isSupportedProvider = (
  provider: unknown,
): provider is ModelProvider =>
  typeof provider === "string" &&
  supportedProviders.includes(
    provider as ModelProvider,
  );

/*
 * Helper for writing Server-Sent Events.
 *
 * Each SSE event looks like:
 *
 * event: delta
 * data: {"text":"hello"}
 *
 */
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

/*
 * Convert the Chroma retrieval results into
 * readable RAG context for the LLM.
 */
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

/*
 * Convert internal retrieval chunks into the
 * smaller source structure returned to the UI.
 */
const mapSourceChunks = (
  chunks: RetrievedChunks,
) =>
  chunks.map((chunk) => ({
    id: chunk.id,
    source: chunk.source,
    content: chunk.content,
    score: chunk.score,
  }));

/*
 * Find the most recent user message.
 *
 * A conversation could look like:
 *
 * user
 * assistant
 * user
 *
 * We want the final user question for retrieval.
 */
const findLatestUserMessage = (
  messages: ChatRequest["messages"],
) =>
  [...messages]
    .reverse()
    .find(
      (message) =>
        message.role === "user",
    );

/*
 * Shared validation used by both:
 *
 * POST /api/chat
 *
 * and
 *
 * POST /api/chat/stream
 */
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

  /*
   * Model must be supplied.
   */
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

  /*
   * Only OpenAI, Claude and Gemini
   * are supported.
   */
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

  /*
   * Conversation must contain at least
   * one message.
   */
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

  /*
   * Require a knowledge-base identifier.
   */
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

  /*
   * Retrieval requires an actual user
   * question.
   */
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
 * ============================================================
 * NON-STREAMING CHAT
 * ============================================================
 *
 * POST /api/chat
 *
 * Used for normal request/response generation.
 *
 * All three providers now use the real provider layer:
 *
 * OpenAI
 * Claude
 * Gemini
 *
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
    /*
     * Validate incoming request.
     */
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

    /*
     * ========================================================
     * STEP 1
     * Retrieve relevant knowledge-base chunks from ChromaDB.
     * ========================================================
     */
    const retrievedChunks =
      await retrieveRelevantChunks(
        latestUserMessage.content,
        6,
      );

    /*
     * If Chroma returned no documents,
     * do not call an LLM.
     */
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
     * ========================================================
     * STEP 2
     * Generate response through our provider abstraction.
     *
     * model = openai
     *      -> OpenAIProvider
     *
     * model = claude
     *      -> ClaudeProvider
     *
     * model = gemini
     *      -> GeminiProvider
     *
     * generateWithFallback() handles provider failures.
     * ========================================================
     */
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

    /*
     * ========================================================
     * STEP 3
     * Map provider response into API response.
     * ========================================================
     */
    const result: ChatResponse = {
      message:
        llmResult.content,

      inputTokens:
        llmResult.inputTokens,

      outputTokens:
        llmResult.outputTokens,

      cost:
        llmResult.cost,

      /*
       * Important:
       *
       * generateWithFallback() might use a different provider
       * if the requested provider failed.
       */
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
 * ============================================================
 * SIMPLE SSE TEST
 * ============================================================
 *
 * GET /api/chat/stream/test
 *
 * This does not call an LLM.
 *
 * It exists only to verify that:
 *
 * Express
 *      ↓
 * SSE
 *      ↓
 * browser/curl
 *
 * works correctly.
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
        /*
         * Finished sending test words.
         */
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

        /*
         * Send one small piece of text.
         */
        sendSseEvent(
          response,
          "delta",
          {
            text: words[index],
          },
        );

        index += 1;
      }, 300);

    /*
     * Browser/user disconnected.
     */
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
 * ============================================================
 * MAIN STREAMING CHAT
 * ============================================================
 *
 * POST /api/chat/stream
 *
 * Current behavior:
 *
 * OpenAI
 *   -> real OpenAI API
 *   -> real token/text-delta streaming
 *
 * Claude
 *   -> real Anthropic API
 *   -> complete answer returned as one SSE delta
 *
 * Gemini
 *   -> real Gemini API
 *   -> complete answer returned as one SSE delta
 *
 * Later we can implement native Claude and Gemini
 * streaming as separate streaming services.
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
    /*
     * Validate BEFORE opening the SSE stream.
     *
     * Once we start SSE headers, we cannot easily
     * switch back to a normal JSON error response.
     */
    const validation =
      validateChatRequest(
        request.body,
      );

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

    /*
     * Allows us to cancel OpenAI generation
     * when the client disconnects.
     */
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

    /*
     * Open SSE response.
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

    /*
     * Prevent Nginx from buffering the stream.
     */
    response.setHeader(
      "X-Accel-Buffering",
      "no",
    );

    response.flushHeaders();

    try {
      /*
       * ======================================================
       * STEP 1
       * Tell the frontend retrieval has started.
       * ======================================================
       */
      sendSseEvent(
        response,
        "status",
        {
          stage: "retrieving",

          message:
            "Searching the knowledge base...",
        },
      );

      /*
       * ======================================================
       * STEP 2
       * Retrieve relevant ChromaDB chunks.
       * ======================================================
       */
      const retrievedChunks =
        await retrieveRelevantChunks(
          latestUserMessage.content,
          6,
        );

      /*
       * No documents found.
       */
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

      /*
       * ======================================================
       * STEP 3
       * Notify frontend that LLM generation is starting.
       * ======================================================
       */
      const providerDisplayName =
        model === "openai"
          ? "OpenAI"
          : model === "claude"
            ? "Claude"
            : "Gemini";

      sendSseEvent(
        response,
        "status",
        {
          stage: "generating",

          message:
            `Generating the answer with ${providerDisplayName}...`,
        },
      );

      /*
       * ======================================================
       * OPENAI
       * ======================================================
       *
       * OpenAI already has a real streaming service
       * in this project.
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

            /*
             * Called every time OpenAI produces
             * another text delta.
             */
            (textDelta) => {
              /*
               * Client may already have disconnected.
               */
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

        /*
         * Final event carries metadata,
         * token usage and source chunks.
         */
        if (
          !response.writableEnded &&
          !response.destroyed
        ) {
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
               * Your current OpenAI streaming service
               * does not yet calculate price.
               */
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
        }

        return;
      }

      /*
       * ======================================================
       * CLAUDE / GEMINI
       * ======================================================
       *
       * These are now REAL API providers.
       *
       * They currently use the non-streaming generate()
       * interface.
       *
       * We still use the SSE connection expected by the
       * frontend, but send the complete generated answer
       * as one delta.
       *
       * Later:
       *
       * Claude -> native Anthropic streaming
       * Gemini -> native Gemini streaming
       */
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

      /*
       * Client could disconnect while we were
       * waiting for Claude/Gemini.
       */
      if (
        response.writableEnded ||
        response.destroyed
      ) {
        return;
      }

      /*
       * Send complete real model response.
       *
       * Because Claude/Gemini native streaming
       * isn't implemented yet, this arrives as
       * one SSE delta rather than many deltas.
       */
      sendSseEvent(
        response,
        "delta",
        {
          text:
            llmResult.content,
        },
      );

      /*
       * Send metadata.
       */
      sendSseEvent(
        response,
        "done",
        {
          message:
            llmResult.content,

          inputTokens:
            llmResult.inputTokens,

          outputTokens:
            llmResult.outputTokens,

          cost:
            llmResult.cost,

          /*
           * Important for fallback:
           *
           * The provider that actually generated
           * the response may differ from the one
           * originally requested.
           */
          model:
            llmResult.provider,

          providerMode: "live",

          providerModel:
            llmResult.model,

          latencyMs:
            llmResult.latencyMs,

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

      /*
       * If SSE connection is still alive,
       * send the error through the stream.
       */
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