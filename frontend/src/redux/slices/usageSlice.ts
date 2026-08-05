import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface MessageUsage {
  messageId: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
}

interface UsageState {
  messageUsage: MessageUsage[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  contextWindowSize: number;
}

const initialState: UsageState = {
  messageUsage: [],
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalCost: 0,
  contextWindowSize: 128000,
};

const usageSlice = createSlice({
  name: "usage",
  initialState,
  reducers: {
    addMessageUsage: (
      state,
      action: PayloadAction<MessageUsage>,
    ) => {
      state.messageUsage.push(action.payload);

      state.totalInputTokens +=
        action.payload.inputTokens;

      state.totalOutputTokens +=
        action.payload.outputTokens;

      state.totalCost += action.payload.cost;
    },

    resetUsage: () => initialState,

    setContextWindowSize: (
      state,
      action: PayloadAction<number>,
    ) => {
      state.contextWindowSize = action.payload;
    },
  },
});

export const {
  addMessageUsage,
  resetUsage,
  setContextWindowSize,
} = usageSlice.actions;

export default usageSlice.reducer;