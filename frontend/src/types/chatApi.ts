import type {
    ChatMessage,
  } from "../redux/slices/chatSlice";
  
  import type {
    ModelProvider,
  } from "../redux/slices/modelSlice";
  
  export interface ChatApiRequest {
    model: ModelProvider;
    messages: Array<{
      role: ChatMessage["role"];
      content: string;
    }>;
    systemPrompt?: string;
    knowledgeBaseId: string;
  }
  
  export interface SourceChunk {
    id: string;
    source: string;
    content: string;
    score: number;
  }
  
  export interface ChatApiResponse {
    message: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    model: ModelProvider;
    latencyMs: number;
    sourceChunks: SourceChunk[];
  }