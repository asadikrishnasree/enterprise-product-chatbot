import { Router } from "express";

import {
  createChatResponse,
  createChatStream,
  createTestChatStream
} from "../controllers/chatController.js";



const chatRouter = Router();

chatRouter.post("/", createChatResponse);
chatRouter.post(
  "/stream",
  createChatStream,
);
chatRouter.get(
  "/stream/test",
  createTestChatStream,
);

export default chatRouter;