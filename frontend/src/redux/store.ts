import { configureStore } from "@reduxjs/toolkit";

import chatReducer from "./slices/chatSlice";
import modelReducer from "./slices/modelSlice";
import usageReducer from "./slices/usageSlice";
import conversationReducer from "./slices/conversationSlice";

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    model: modelReducer,
    usage: usageReducer,
    conversation: conversationReducer,
  },
});

export type RootState = ReturnType<
  typeof store.getState
>;

export type AppDispatch = typeof store.dispatch;