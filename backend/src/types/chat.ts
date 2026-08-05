export type ModelProvider =
  | "openai"
  | "claude"
  | "gemini";

export type MessageRole =
  | "system"
  | "user"
  | "assistant";

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface ChatRequest {
  model: ModelProvider;
  messages: ChatMessage[];
  systemPrompt?: string;
  knowledgeBaseId: string;
}

export interface SourceChunk {
  id: string;
  source: string;
  content: string;
  score: number;
}

export interface ChatResponse {
  message: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  model: ModelProvider;
  latencyMs: number;
  sourceChunks: SourceChunk[];
}