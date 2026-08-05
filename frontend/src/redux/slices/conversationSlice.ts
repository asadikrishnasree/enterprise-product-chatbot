import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import type {
  Conversation,
} from "../../types/conversation";

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
}

const initialState: ConversationState = {
  conversations: [],
  activeConversationId: null,
};

const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    setConversations: (
      state,
      action: PayloadAction<Conversation[]>,
    ) => {
      state.conversations = action.payload;
    },

    addConversation: (
      state,
      action: PayloadAction<Conversation>,
    ) => {
      state.conversations.unshift(action.payload);
      state.activeConversationId =
        action.payload.id;
    },

    updateConversation: (
      state,
      action: PayloadAction<Conversation>,
    ) => {
      const index =
        state.conversations.findIndex(
          (conversation) =>
            conversation.id === action.payload.id,
        );

      if (index !== -1) {
        state.conversations[index] =
          action.payload;
      }
    },

    deleteConversation: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.conversations =
        state.conversations.filter(
          (conversation) =>
            conversation.id !== action.payload,
        );

      if (
        state.activeConversationId ===
        action.payload
      ) {
        state.activeConversationId = null;
      }
    },

    setActiveConversation: (
      state,
      action: PayloadAction<string | null>,
    ) => {
      state.activeConversationId =
        action.payload;
    },

    clearConversationHistory: (state) => {
      state.conversations = [];
      state.activeConversationId = null;
    },
  },
});

export const {
  setConversations,
  addConversation,
  updateConversation,
  deleteConversation,
  setActiveConversation,
  clearConversationHistory,
} = conversationSlice.actions;

export default conversationSlice.reducer;