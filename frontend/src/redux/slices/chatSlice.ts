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

    clearMessages: (state) => {
      state.messages = [];
      state.isLoading = false;
    },
  },
});

export const {
  addMessage,
  setMessages,
  setLoading,
  clearMessages,
} = chatSlice.actions;

export default chatSlice.reducer;