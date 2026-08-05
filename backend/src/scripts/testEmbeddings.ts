import {
    generateEmbeddings,
    getEmbeddingModelName,
  } from "../services/embedding/embeddingService.js";
  
  const testEmbeddingGeneration = async () => {
    const texts = [
      "CRM Pro supports Salesforce integration.",
      "Analytics Cloud provides business intelligence dashboards.",
    ];
  
    console.log(
      `Loading embedding model: ${getEmbeddingModelName()}`,
    );
  
    const embeddings =
      await generateEmbeddings(texts);
  
    console.log(
      `Generated ${embeddings.length} embeddings.`,
    );
  
    embeddings.forEach((embedding, index) => {
      console.log(
        `Text ${index + 1}: vector dimensions = ${embedding.length}`,
      );
  
      console.log(
        `First five values:`,
        embedding.slice(0, 5),
      );
    });
  };
  
  testEmbeddingGeneration().catch((error: unknown) => {
    console.error(
      "Embedding test failed:",
      error,
    );
  
    process.exit(1);
  });