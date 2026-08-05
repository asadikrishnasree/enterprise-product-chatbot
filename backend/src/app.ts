import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import chatRouter from "./routes/chatRoutes.js";

const app = express();

const frontendUrl =
  process.env.FRONTEND_URL ?? "http://localhost:5173";

app.use(helmet());

app.use(
  cors({
    origin: frontendUrl,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use("/api/chat", chatRouter);

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "enterprise-product-chatbot-api",
    timestamp: new Date().toISOString(),
  });
});

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled application error:", error);

    response.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected server error occurred.",
      },
    });
  },
);

export default app;