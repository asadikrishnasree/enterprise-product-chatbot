import { Box } from "@mui/material";

import AppHeader from "./components/Header/AppHeader";
import AppSidebar from "./components/Sidebar/AppSidebar";
import ChatWorkspace from "./components/Chat/ChatWorkspace";
import { useEffect } from "react";

import { useAppDispatch } from "./redux/hooks";
import {
  setConversations,
} from "./redux/slices/conversationSlice";

import {
  loadConversations,
} from "./services/conversationStorage";


function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const savedConversations =
      loadConversations();

    dispatch(
      setConversations(
        savedConversations,
      ),
    );
  }, [dispatch]);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppHeader />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          minHeight: 0,
        }}
      >
        <AppSidebar />
        <ChatWorkspace />
      </Box>
    </Box>
  );
}
export default App;