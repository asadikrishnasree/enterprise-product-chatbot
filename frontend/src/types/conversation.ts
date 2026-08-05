import type {
    ChatMessage,
  } from "../redux/slices/chatSlice";
  
  export interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
  }