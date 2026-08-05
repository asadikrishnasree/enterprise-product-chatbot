import "dotenv/config";

import {
  getChromaConfiguration,
  getKnowledgeCollection,
} from "../services/vectorStore/chromaService.js";

const testChromaConnection = async () => {
  const configuration =
    getChromaConfiguration();

  console.log(
    `Connecting to Chroma at ${configuration.host}:${configuration.port}`,
  );

  const collection =
    await getKnowledgeCollection();

  console.log(
    `Connected to collection: ${collection.name}`,
  );

  const count = await collection.count();

  console.log(
    `Current collection document count: ${count}`,
  );
};

testChromaConnection().catch((error: unknown) => {
  console.error(
    "Chroma connection test failed:",
    error,
  );

  process.exit(1);
});