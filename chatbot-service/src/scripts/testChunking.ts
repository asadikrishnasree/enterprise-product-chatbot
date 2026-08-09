import {
    loadKnowledgeDocuments,
  } from "../services/knowledgeBase/documentLoader.js";
  
  import {
    createKnowledgeChunks,
  } from "../services/knowledgeBase/chunkingService.js";
  
  const testChunking = async () => {
    const documents =
      await loadKnowledgeDocuments();
  
    console.log(
      `Loaded ${documents.length} documents.`,
    );
  
    documents.forEach((document) => {
      console.log(
        `- ${document.filename}: ${document.content.length} characters`,
      );
    });
  
    const chunks =
      createKnowledgeChunks(documents);
  
    console.log(
      `\nCreated ${chunks.length} chunks.`,
    );
  
    chunks.slice(0, 5).forEach((chunk) => {
      console.log("\n-----------------------------");
      console.log(`Chunk ID: ${chunk.id}`);
      console.log(`Source: ${chunk.source}`);
      console.log(`Section: ${chunk.section}`);
      console.log(
        `Length: ${chunk.content.length}`,
      );
      console.log(
        chunk.content.slice(0, 250),
      );
    });
  };
  
  testChunking().catch((error: unknown) => {
    console.error(
      "Chunking test failed:",
      error,
    );
  
    process.exit(1);
  });