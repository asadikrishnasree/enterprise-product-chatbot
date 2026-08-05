import type {
    Conversation,
  } from "../types/conversation";
  
  const STORAGE_KEY =
    "enterprise-chatbot-conversations";
  
  export const loadConversations =
    (): Conversation[] => {
      try {
        const storedValue =
          localStorage.getItem(STORAGE_KEY);
  
        if (!storedValue) {
          return [];
        }
  
        const parsedValue: unknown =
          JSON.parse(storedValue);
  
        return Array.isArray(parsedValue)
          ? (parsedValue as Conversation[])
          : [];
      } catch (error) {
        console.error(
          "Failed to load conversation history:",
          error,
        );
  
        return [];
      }
    };
  
  export const saveConversations = (
    conversations: Conversation[],
  ): void => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(conversations),
      );
    } catch (error) {
      console.error(
        "Failed to save conversation history:",
        error,
      );
    }
  };
  
  export const clearStoredConversations =
    (): void => {
      localStorage.removeItem(STORAGE_KEY);
    };