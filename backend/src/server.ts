import "dotenv/config";

import app from "./app.js";

const port = Number(process.env.PORT ?? 3001);

const server = app.listen(port, () => {
  console.log(
    `Enterprise chatbot API running at http://localhost:${port}`,
  );
});

const shutdown = (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);

  server.close((error) => {
    if (error) {
      console.error("Error while closing the server:", error);
      process.exit(1);
    }

    console.log("Server stopped.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));