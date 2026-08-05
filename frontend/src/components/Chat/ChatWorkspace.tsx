import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

import {
  useAppDispatch,
  useAppSelector,
} from "../../redux/hooks";
import {
  addMessage,
  setLoading,
} from "../../redux/slices/chatSlice";

import { sendChatMessage } from "../../api/chatApi";
import { addMessageUsage } from "../../redux/slices/usageSlice";
import {
  addConversation,
  updateConversation,
} from "../../redux/slices/conversationSlice";

import {
  saveConversations,
} from "../../services/conversationStorage";

function ChatWorkspace() {
  const dispatch = useAppDispatch();
  const [question, setQuestion] = useState("");

  const messages = useAppSelector(
    (state) => state.chat.messages,
  );

  const isLoading = useAppSelector(
    (state) => state.chat.isLoading,
  );

  const selectedModel = useAppSelector(
    (state) => state.model.selectedModel,
  );
  const conversations = useAppSelector(
    (state) => state.conversation.conversations,
  );
  
  const activeConversationId = useAppSelector(
    (state) => state.conversation.activeConversationId,
  );
  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);
  
  useEffect(() => {
    if (messages.length === 0) {
      return;
    }
  
    const now = new Date().toISOString();
  
    if (!activeConversationId) {
      const firstUserMessage = messages.find(
        (message) => message.role === "user",
      );
  
      const newConversation = {
        id: crypto.randomUUID(),
        title:
          firstUserMessage?.content.slice(0, 50) ||
          "New Conversation",
        messages,
        createdAt: now,
        updatedAt: now,
      };
  
      dispatch(addConversation(newConversation));
      return;
    }
  
    const existingConversation =
      conversations.find(
        (conversation) =>
          conversation.id === activeConversationId,
      );
  
    if (!existingConversation) {
      return;
    }
  
    const messagesHaveChanged =
      JSON.stringify(existingConversation.messages) !==
      JSON.stringify(messages);
  
    if (!messagesHaveChanged) {
      return;
    }
  
    dispatch(
      updateConversation({
        ...existingConversation,
        messages,
        updatedAt: now,
      }),
    );
  }, [
    messages,
    activeConversationId,
    conversations,
    dispatch,
  ]);

  const handleSend = async () => {
  const trimmedQuestion = question.trim();

  if (!trimmedQuestion || isLoading) {
    return;
  }

  const userMessage = {
    id: crypto.randomUUID(),
    role: "user" as const,
    content: trimmedQuestion,
  };

  const conversationMessages = [
    ...messages,
    userMessage,
  ];

  dispatch(addMessage(userMessage));
  setQuestion("");
  dispatch(setLoading(true));

  try {
    const response = await sendChatMessage({
      model: selectedModel,
      messages: conversationMessages.map(
        ({ role, content }) => ({
          role,
          content,
        }),
      ),
      systemPrompt:
        "Answer only using the provided product knowledge base. If the answer is unavailable, say so clearly.",
      knowledgeBaseId: "default",
    });

    const assistantMessageId =
      crypto.randomUUID();

      dispatch(
        addMessage({
          id: assistantMessageId,
          role: "assistant",
          content: response.message,
          sources: response.sourceChunks,
          usage: {
            inputTokens: response.inputTokens,
            outputTokens: response.outputTokens,
            cost: response.cost,
            latencyMs: response.latencyMs,
            model: response.model,
          },
        }),
      );

    dispatch(
      addMessageUsage({
        messageId: assistantMessageId,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        cost: response.cost,
        latencyMs: response.latencyMs,
      }),
    );
  } catch (error) {
    console.error("Chat request failed:", error);

    dispatch(
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "I couldn't connect to the chatbot service. Please confirm the backend is running and try again.",
      }),
    );
  } finally {
    dispatch(setLoading(false));
  }
};

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 4,
        }}
      >
        {messages.length === 0 ? (
          <Stack
          spacing={2}
          sx={{
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
            <Typography variant="h5">
              Ask a product question
            </Typography>

            <Typography
  color="text.secondary"
  sx={{
    textAlign: "center",
    maxWidth: 560,
  }}
>
              Ask about pricing, integrations, release
              notes, troubleshooting, support SLAs, or
              product features.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2}>
            {messages.map((message) => (
  <Paper
    key={message.id}
    elevation={0}
    sx={{
      p: 2,
      maxWidth: "75%",
      alignSelf:
        message.role === "user"
          ? "flex-end"
          : "flex-start",
      bgcolor:
        message.role === "user"
          ? "primary.main"
          : "background.paper",
      color:
        message.role === "user"
          ? "primary.contrastText"
          : "text.primary",
      border:
        message.role === "assistant"
          ? 1
          : 0,
      borderColor: "divider",
    }}
  >
    <Typography
      variant="caption"
      sx={{
        display: "block",
        mb: 1,
        fontWeight: 600,
        opacity: 0.8,
      }}
    >
      {message.role === "user"
        ? "You"
        : "Assistant"}
    </Typography>

    {/* Actual question or answer */}
    <Typography
      variant="body1"
      sx={{
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
      }}
    >
      {message.content}
    </Typography>

    {/* Retrieved source documents */}
    {message.role === "assistant" &&
      message.sources &&
      message.sources.length > 0 && (
        <Stack
          spacing={1}
          sx={{
            mt: 2,
            pt: 1.5,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 600 }}
          >
            Sources
          </Typography>

          {message.sources.map((source) => (
            <Paper
              key={source.id}
              variant="outlined"
              sx={{ p: 1.25 }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontWeight: 600,
                }}
              >
                {source.source}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Relevance:{" "}
                {(source.score * 100).toFixed(1)}%
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 0.75,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {source.content}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}

    {/* Per-message usage */}
    {message.role === "assistant" &&
      message.usage && (
        <Stack
          direction="row"
          spacing={2}
          sx={{
            mt: 1.5,
            pt: 1.25,
            borderTop: 1,
            borderColor: "divider",
            flexWrap: "wrap",
            rowGap: 0.5,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Model: {message.usage.model}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Input: {message.usage.inputTokens}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Output: {message.usage.outputTokens}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Cost: ${message.usage.cost.toFixed(4)}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Latency: {message.usage.latencyMs} ms
          </Typography>
        </Stack>
      )}
  </Paper>
))}

            {isLoading && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  alignSelf: "flex-start",
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <Stack
  direction="row"
  spacing={1.5}
  sx={{
    alignItems: "center",
  }}
>
                  <CircularProgress size={18} />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Generating response...
                  </Typography>
                </Stack>
              </Paper>
            )}

            <div ref={messagesEndRef} />
          </Stack>
        )}
      </Box>

      <Paper
        elevation={0}
        square
        sx={{
          borderTop: 1,
          borderColor: "divider",
          p: 2,
        }}
      >
        <Stack direction="row" spacing={1.5}>
          <TextField
            fullWidth
            value={question}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Ask about products, pricing, integrations, or troubleshooting..."
            multiline
            maxRows={4}
            disabled={isLoading}
          />

          <Button
            variant="contained"
            endIcon={<SendRoundedIcon />}
            disabled={!question.trim() || isLoading}
            onClick={handleSend}
          >
            Send
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default ChatWorkspace;