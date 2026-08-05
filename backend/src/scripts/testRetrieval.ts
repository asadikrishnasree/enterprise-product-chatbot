import "dotenv/config";

import {
  retrieveRelevantChunks,
} from "../services/retrieval/retrievalService.js";

const testQuestions = [
  "Does CRM Pro support Salesforce and what API version is required?",
  "What should I check when the CRM API returns a 403 error?",
  "What new features were released in Analytics Cloud version 4.2?",
  "What is the Priority 1 response time in Support Hub?",
];

const testRetrieval = async () => {
  for (const question of testQuestions) {
    console.log("\n================================");
    console.log(`Question: ${question}`);

    const chunks =
      await retrieveRelevantChunks(
        question,
        3,
      );

    chunks.forEach((chunk, index) => {
      console.log(
        `\nResult ${index + 1}`,
      );

      console.log(
        `Source: ${chunk.source}`,
      );

      console.log(
        `Section: ${chunk.section}`,
      );

      console.log(
        `Score: ${chunk.score.toFixed(4)}`,
      );

      console.log(
        chunk.content.slice(0, 350),
      );
    });
  }
};

testRetrieval().catch((error: unknown) => {
  console.error(
    "Retrieval test failed:",
    error,
  );

  process.exit(1);
});