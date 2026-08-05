import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface ChatSource {
  id: string;
  source: string;
  content: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  usage?: ChatMessageUsage;
}

export interface ChatMessageUsage {
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
  model: string;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
}

const initialState: ChatState = {
  messages: [],
  isLoading: false,
};

type AppendMessageDeltaPayload = {
  messageId: string;
  text: string;
};

type CompleteStreamingMessagePayload = {
  messageId: string;
  sources?: ChatMessage["sources"];
  usage?: ChatMessage["usage"];
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (
      state,
      action: PayloadAction<ChatMessage>,
    ) => {
      state.messages.push(action.payload);
    },
    setMessages: (
      state,
      action: PayloadAction<ChatMessage[]>,
    ) => {
      state.messages = action.payload;
      state.isLoading = false;
    },
    setLoading: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.isLoading = action.payload;
    },
    appendMessageDelta: (
      state,
      action: PayloadAction<AppendMessageDeltaPayload>,
    ) => {
      const message = state.messages.find(
        (item) => item.id === action.payload.messageId,
      );
    
      if (!message) {
        return;
      }
    
      message.content += action.payload.text;
    },
    completeStreamingMessage: (
      state,
      action: PayloadAction<CompleteStreamingMessagePayload>,
    ) => {
      const message = state.messages.find(
        (item) => item.id === action.payload.messageId,
      );
    
      if (!message) {
        return;
      }
    
      message.sources = action.payload.sources;
      message.usage = action.payload.usage;
    },
    clearMessages: (state) => {
      state.messages = [];
      state.isLoading = false;
    },
    removeMessage: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.messages =
        state.messages.filter(
          (message) =>
            message.id !== action.payload,
        );
    },
  },
});

export const {
  addMessage,
  removeMessage,
  setMessages,
  setLoading,
  clearMessages,
  appendMessageDelta,
  completeStreamingMessage,
} = chatSlice.actions;

export default chatSlice.reducer;