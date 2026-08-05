export type StreamChatMessage = {
    role: "user" | "assistant";
    content: string;
  };
  
  export type StreamSourceChunk = {
    id: string;
    source: string;
    content: string;
    score: number;
  };
  
  export type StreamUsage = {
    inputTokens: number;
    outputTokens: number;
    cost: number;
    latencyMs: number;
    model: string;
  };
  
  export type StreamChatRequest = {
    model: "openai";
    knowledgeBaseId: string;
    messages: StreamChatMessage[];
    systemPrompt?: string;
  };
  
  export type StreamStatusEvent = {
    stage: "retrieving" | "generating";
    message: string;
  };
  
  export type StreamDoneEvent = StreamUsage & {
    message: string;
    sourceChunks: StreamSourceChunk[];
  };
  
  export type StreamErrorEvent = {
    code: string;
    message: string;
  };
  
  type StreamChatCallbacks = {
    onStatus?: (
      status: StreamStatusEvent,
    ) => void;
  
    onDelta: (text: string) => void;
  
    onDone: (
      result: StreamDoneEvent,
    ) => void;
  
    onError?: (
      error: StreamErrorEvent,
    ) => void;
  };
  
  type ParsedSseEvent = {
    event: string;
    data: string;
  };
  
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:3001/api";
  
  const parseSseBlock = (
    block: string,
  ): ParsedSseEvent | null => {
    const lines = block.split(/\r?\n/);
  
    let eventName = "message";
    const dataLines: string[] = [];
  
    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line
          .slice("event:".length)
          .trim();
  
        continue;
      }
  
      if (line.startsWith("data:")) {
        dataLines.push(
          line
            .slice("data:".length)
            .trimStart(),
        );
      }
    }
  
    if (dataLines.length === 0) {
      return null;
    }
  
    return {
      event: eventName,
      data: dataLines.join("\n"),
    };
  };
  
  const handleSseEvent = (
    parsedEvent: ParsedSseEvent,
    callbacks: StreamChatCallbacks,
  ): void => {
    let parsedData: unknown;
  
    try {
      parsedData = JSON.parse(
        parsedEvent.data,
      );
    } catch {
      throw new Error(
        `Invalid SSE JSON received: ${parsedEvent.data}`,
      );
    }
  
    switch (parsedEvent.event) {
      case "status": {
        callbacks.onStatus?.(
          parsedData as StreamStatusEvent,
        );
  
        break;
      }
  
      case "delta": {
        const delta = parsedData as {
          text?: unknown;
        };
  
        if (
          typeof delta.text === "string"
        ) {
          callbacks.onDelta(delta.text);
        }
  
        break;
      }
  
      case "done": {
        callbacks.onDone(
          parsedData as StreamDoneEvent,
        );
  
        break;
      }
  
      case "error": {
        const streamError =
          parsedData as StreamErrorEvent;
  
        callbacks.onError?.(streamError);
  
        throw new Error(
          streamError.message ||
            "The chat stream failed.",
        );
      }
  
      default: {
        console.warn(
          "Unknown SSE event:",
          parsedEvent.event,
          parsedData,
        );
      }
    }
  };
  
  export const streamChatMessage = async (
    payload: StreamChatRequest,
    callbacks: StreamChatCallbacks,
    signal?: AbortSignal,
  ): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/chat/stream`,
      {
        method: "POST",
  
        headers: {
          "Content-Type":
            "application/json",
          Accept: "text/event-stream",
        },
  
        body: JSON.stringify(payload),
        signal,
      },
    );
  
    /*
     * Validation failures happen before the backend
     * opens the SSE connection, so they may be normal
     * JSON responses instead of event streams.
     */
    if (!response.ok) {
      let errorMessage =
        `Chat request failed with status ${response.status}.`;
  
      try {
        const errorResponse =
          (await response.json()) as {
            error?: {
              message?: string;
            };
          };
  
        if (
          errorResponse.error?.message
        ) {
          errorMessage =
            errorResponse.error.message;
        }
      } catch {
        // Keep the status-based error message.
      }
  
      throw new Error(errorMessage);
    }
  
    if (!response.body) {
      throw new Error(
        "Streaming is not supported because the response body is unavailable.",
      );
    }
  
    const reader =
      response.body.getReader();
  
    const decoder = new TextDecoder();
  
    let buffer = "";
  
    try {
      while (true) {
        const {
          value,
          done,
        } = await reader.read();
  
        if (done) {
          break;
        }
  
        /*
         * A network chunk is not necessarily one SSE event.
         * One event may be split across multiple reads,
         * or several events may arrive in one read.
         */
        buffer += decoder.decode(value, {
          stream: true,
        });
  
        /*
         * Normalize Windows-style newlines to simplify
         * identifying the blank line between SSE events.
         */
        buffer = buffer.replace(
          /\r\n/g,
          "\n",
        );
  
        let eventBoundary =
          buffer.indexOf("\n\n");
  
        while (eventBoundary >= 0) {
          const eventBlock = buffer
            .slice(0, eventBoundary)
            .trim();
  
          buffer = buffer.slice(
            eventBoundary + 2,
          );
  
          if (eventBlock.length > 0) {
            const parsedEvent =
              parseSseBlock(eventBlock);
  
            if (parsedEvent) {
              handleSseEvent(
                parsedEvent,
                callbacks,
              );
            }
          }
  
          eventBoundary =
            buffer.indexOf("\n\n");
        }
      }
  
      /*
       * Flush any remaining decoded characters.
       */
      buffer += decoder.decode();
  
      const finalBlock = buffer.trim();
  
      if (finalBlock.length > 0) {
        const parsedEvent =
          parseSseBlock(finalBlock);
  
        if (parsedEvent) {
          handleSseEvent(
            parsedEvent,
            callbacks,
          );
        }
      }
    } finally {
      reader.releaseLock();
    }
  };