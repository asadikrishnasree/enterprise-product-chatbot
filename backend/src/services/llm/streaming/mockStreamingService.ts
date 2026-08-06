import type {
    ModelProvider,
  } from "../../../types/chat.js";
  
  export type MockStreamingProvider =
    Exclude<ModelProvider, "openai">;
  
  export interface MockStreamingRequest {
    provider: MockStreamingProvider;
    question: string;
    retrievedContent: string;
  }
  
  export interface MockStreamingResult {
    content: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    model: string;
  }
  
  type StreamTextHandler = (
    textDelta: string,
  ) => void;
  
  const MOCK_STREAM_DELAY_MS = 35;
  
  const providerDisplayNames: Record<
    MockStreamingProvider,
    string
  > = {
    claude: "Claude",
    gemini: "Gemini",
  };
  
  const estimateTokens = (
    value: string,
  ): number => {
    /*
     * This is only an approximation for mock mode.
     * Real providers return actual token usage.
     */
    return Math.max(
      1,
      Math.ceil(value.length / 4),
    );
  };
  
  const wait = async (
    milliseconds: number,
    abortSignal?: AbortSignal,
  ): Promise<void> => {
    if (abortSignal?.aborted) {
      throw new Error(
        "Mock streaming request was cancelled.",
      );
    }
  
    await new Promise<void>(
      (resolve, reject) => {
        const timeoutId = setTimeout(
          resolve,
          milliseconds,
        );
  
        const handleAbort = () => {
          clearTimeout(timeoutId);
  
          reject(
            new Error(
              "Mock streaming request was cancelled.",
            ),
          );
        };
  
        abortSignal?.addEventListener(
          "abort",
          handleAbort,
          {
            once: true,
          },
        );
      },
    );
  };
  
  const buildMockAnswer = (
    request: MockStreamingRequest,
  ): string => {
    const providerName =
      providerDisplayNames[request.provider];
  
    const cleanRetrievedContent =
      request.retrievedContent.trim();
  
    if (!cleanRetrievedContent) {
      return [
        `[Mock ${providerName} response]`,
        "",
        "I couldn't find that information in the product knowledge base.",
        "",
        "This response was generated in mock mode because an API key is not configured.",
      ].join("\n");
    }
  
    return [
      `[Mock ${providerName} response]`,
      "",
      cleanRetrievedContent,
      "",
      "This response is based on the retrieved product knowledge content. No external model API was called.",
    ].join("\n");
  };
  
  export const streamMockResponse = async (
    request: MockStreamingRequest,
    onTextDelta: StreamTextHandler,
    abortSignal?: AbortSignal,
  ): Promise<MockStreamingResult> => {
    const startedAt = Date.now();
  
    const completeContent =
      buildMockAnswer(request);
  
    /*
     * Split the response into small word-like pieces.
     * This makes the mock response appear token-by-token,
     * similar to a real LLM stream.
     */
    const textParts =
      completeContent.match(/\S+\s*/g) ?? [
        completeContent,
      ];
  
    for (const textPart of textParts) {
      if (abortSignal?.aborted) {
        throw new Error(
          "Mock streaming request was cancelled.",
        );
      }
  
      onTextDelta(textPart);
  
      await wait(
        MOCK_STREAM_DELAY_MS,
        abortSignal,
      );
    }
  
    const inputText = [
      request.question,
      request.retrievedContent,
    ].join("\n");
  
    return {
      content: completeContent,
      inputTokens:
        estimateTokens(inputText),
      outputTokens:
        estimateTokens(completeContent),
      latencyMs:
        Date.now() - startedAt,
      model: `${request.provider}-mock`,
    };
  };