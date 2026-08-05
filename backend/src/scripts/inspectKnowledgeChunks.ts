import "dotenv/config";

import {
  getKnowledgeCollection,
} from "../services/vectorStore/chromaService.js";

const inspectKnowledgeChunks = async () => {
  const collection =
    await getKnowledgeCollection();

  const records = await collection.get({
    include: [
      "documents",
      "metadatas",
    ],
  });

  records.ids.forEach((id, index) => {
    const metadata =
      records.metadatas?.[index];

    const document =
      records.documents?.[index];

    console.log("\n============================");
    console.log(`ID: ${id}`);
    console.log(
      `Source: ${String(metadata?.source ?? "")}`,
    );
    console.log(
      `Section: ${String(metadata?.section ?? "")}`,
    );
    console.log("Content:");
    console.log(document ?? "");
  });
};

inspectKnowledgeChunks().catch(
  (error: unknown) => {
    console.error(
      "Failed to inspect knowledge chunks:",
      error,
    );

    process.exit(1);
  },
);