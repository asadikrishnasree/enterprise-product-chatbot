import {
    AppBar,
    Box,
    Button,
    Toolbar,
    Typography,
  } from "@mui/material";
  import AddCommentOutlinedIcon from "@mui/icons-material/AddCommentOutlined";
  
  import { useAppDispatch } from "../../redux/hooks";
  import {
    clearMessages,
  } from "../../redux/slices/chatSlice";
  import {
    resetUsage,
  } from "../../redux/slices/usageSlice";
  
  import {
    setActiveConversation,
  } from "../../redux/slices/conversationSlice";
  
  function AppHeader() {
    const dispatch = useAppDispatch();
  
    const handleNewConversation = () => {
      dispatch(setActiveConversation(null));
      dispatch(clearMessages());
      dispatch(resetUsage());
    };
  
    return (
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">
              Enterprise Product Knowledge Chatbot
            </Typography>
  
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Grounded answers from internal product documentation
            </Typography>
          </Box>
  
          <Button
            variant="contained"
            startIcon={<AddCommentOutlinedIcon />}
            onClick={handleNewConversation}
          >
            New Conversation
          </Button>
        </Toolbar>
      </AppBar>
    );
  }
  
  export default AppHeader;