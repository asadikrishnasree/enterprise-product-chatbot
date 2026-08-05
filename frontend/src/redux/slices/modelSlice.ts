import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type ModelProvider = "openai" | "claude" | "gemini";

export interface ModelOption {
  id: ModelProvider;
  name: string;
  description: string;
}

interface ModelState {
  selectedModel: ModelProvider;
  fallbackModel: ModelProvider;
  availableModels: ModelOption[];
}

const initialState: ModelState = {
  selectedModel: "openai",
  fallbackModel: "claude",
  availableModels: [
    {
      id: "openai",
      name: "OpenAI GPT",
      description: "Fast, general-purpose reasoning and chat model.",
    },
    {
      id: "claude",
      name: "Claude",
      description: "Strong long-context understanding and document reasoning.",
    },
    {
      id: "gemini",
      name: "Gemini",
      description: "Google model with strong multimodal and general reasoning support.",
    },
  ],
};

const modelSlice = createSlice({
  name: "model",
  initialState,
  reducers: {
    setSelectedModel: (
      state,
      action: PayloadAction<ModelProvider>,
    ) => {
      state.selectedModel = action.payload;
    },

    setFallbackModel: (
      state,
      action: PayloadAction<ModelProvider>,
    ) => {
      state.fallbackModel = action.payload;
    },
  },
});

export const {
  setSelectedModel,
  setFallbackModel,
} = modelSlice.actions;

export default modelSlice.reducer;