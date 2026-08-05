import axios from "axios";

import type {
  ChatApiRequest,
  ChatApiResponse,
} from "../types/chatApi";

const apiClient = axios.create({
  baseURL: "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export const sendChatMessage = async (
  payload: ChatApiRequest,
): Promise<ChatApiResponse> => {
  const response = await apiClient.post<ChatApiResponse>(
    "/chat",
    payload,
  );

  return response.data;
};