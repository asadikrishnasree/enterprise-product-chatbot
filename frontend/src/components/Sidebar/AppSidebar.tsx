import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
  
  import ModelSelector from "../ModelSelector/ModelSelector";
  import UsagePanel from "../UsagePanel/UsagePanel";
  
  import { useAppDispatch, useAppSelector } from "../../redux/hooks";
  import { setMessages } from "../../redux/slices/chatSlice";
  import {
    setActiveConversation,
  } from "../../redux/slices/conversationSlice";
  import { resetUsage } from "../../redux/slices/usageSlice";

  function AppSidebar() {
  const dispatch = useAppDispatch();

  const conversations = useAppSelector(
    (state) => state.conversation.conversations,
  );

  const activeConversationId = useAppSelector(
    (state) => state.conversation.activeConversationId,
  );

  const handleOpenConversation = (
    conversationId: string,
  ) => {
    const conversation = conversations.find(
      (item) => item.id === conversationId,
    );

    if (!conversation) {
      return;
    }

    dispatch(
      setActiveConversation(conversation.id),
    );

    dispatch(
      setMessages(conversation.messages),
    );

    dispatch(resetUsage());
  };

  return (
    <Paper
      component="aside"
      elevation={0}
      sx={{
        width: 320,
        minWidth: 320,
        borderRadius: 0,
        borderRight: 1,
        borderColor: "divider",
        p: 3,
        overflowY: "auto",
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6">
            Conversation History
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Open a previous chat or start a new one.
          </Typography>
        </Box>

        <List disablePadding>
          {conversations.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              No saved conversations yet.
            </Typography>
          ) : (
            conversations.map((conversation) => (
              <ListItemButton
                key={conversation.id}
                selected={
                  conversation.id ===
                  activeConversationId
                }
                onClick={() =>
                  handleOpenConversation(
                    conversation.id,
                  )
                }
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                }}
              >
                <ListItemText
  primary={conversation.title}
  secondary={new Date(
    conversation.updatedAt,
  ).toLocaleString()}
  slotProps={{
    primary: {
      noWrap: true,
    },
  }}
/>
              </ListItemButton>
            ))
          )}
        </List>

        <Divider />

        <Box>
          <Typography variant="h6">
            Configuration
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Choose a provider and monitor session usage.
          </Typography>
        </Box>

        <ModelSelector />

        <Divider />

        <UsagePanel />
      </Stack>
    </Paper>
  );
}

export default AppSidebar;
  