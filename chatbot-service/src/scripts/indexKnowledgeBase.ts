import "dotenv/config";

import {
  generateEmbeddings,
  getEmbeddingModelName,
} from "../services/embedding/embeddingService.js";

import {
  loadKnowledgeDocuments,
} from "../services/knowledgeBase/documentLoader.js";

import {
  createKnowledgeChunks,
} from "../services/knowledgeBase/chunkingService.js";

import {
  getKnowledgeCollection,
} from "../services/vectorStore/chromaService.js";

const BATCH_SIZE = 16;

const indexKnowledgeBase = async () => {
  console.log("Loading knowledge-base documents...");

  const documents =
    await loadKnowledgeDocuments();

  console.log(
    `Loaded ${documents.length} documents.`,
  );

  const chunks =
    createKnowledgeChunks(documents);

  console.log(
    `Created ${chunks.length} searchable chunks.`,
  );

  const collection =
    await getKnowledgeCollection();

  const existingCount =
    await collection.count();

  if (existingCount > 0) {
    console.log(
      `Removing ${existingCount} existing records...`,
    );

    const existingRecords =
      await collection.get();

    if (existingRecords.ids.length > 0) {
      await collection.delete({
        ids: existingRecords.ids,
      });
    }
  }

  console.log(
    `Generating embeddings with ${getEmbeddingModelName()}...`,
  );

  for (
    let start = 0;
    start < chunks.length;
    start += BATCH_SIZE
  ) {
    const batch = chunks.slice(
      start,
      start + BATCH_SIZE,
    );

    const embeddings =
      await generateEmbeddings(
        batch.map((chunk) => chunk.content),
      );

    await collection.add({
      ids: batch.map((chunk) => chunk.id),

      documents: batch.map(
        (chunk) => chunk.content,
      ),

      embeddings,

      metadatas: batch.map((chunk) => ({
        documentId: chunk.documentId,
        source: chunk.source,
        section: chunk.section,
        chunkIndex: chunk.chunkIndex,
      })),
    });

    console.log(
      `Indexed ${Math.min(
        start + batch.length,
        chunks.length,
      )}/${chunks.length} chunks.`,
    );
  }

  const finalCount =
    await collection.count();

  console.log(
    `Knowledge-base indexing completed.`,
  );

  console.log(
    `Stored records: ${finalCount}`,
  );
};

indexKnowledgeBase().catch((error: unknown) => {
  console.error(
    "Knowledge-base indexing failed:",
    error,
  );

  process.exit(1);
});