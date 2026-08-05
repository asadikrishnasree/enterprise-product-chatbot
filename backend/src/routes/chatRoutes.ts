import { Router } from "express";

import {
  createChatResponse,
} from "../controllers/chatController.js";

const chatRouter = Router();

chatRouter.post("/", createChatResponse);

export default chatRouter;