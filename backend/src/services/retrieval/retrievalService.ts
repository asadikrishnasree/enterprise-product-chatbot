import {
    generateEmbeddings,
  } from "../embedding/embeddingService.js";
  
  import {
    getKnowledgeCollection,
  } from "../vectorStore/chromaService.js";
  
  export interface RetrievedChunk {
    id: string;
    source: string;
    section: string;
    content: string;
    score: number;
  }
  
  export const retrieveRelevantChunks = async (
    query: string,
    limit = 4,
  ): Promise<RetrievedChunk[]> => {
    const trimmedQuery = query.trim();
  
    if (!trimmedQuery) {
      return [];
    }
  
    const [queryEmbedding] =
      await generateEmbeddings([trimmedQuery]);
  
    if (!queryEmbedding) {
      throw new Error(
        "Failed to generate the query embedding.",
      );
    }
  
    const collection =
      await getKnowledgeCollection();
  
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      include: [
        "documents",
        "metadatas",
        "distances",
      ],
    });
  
    const ids = results.ids[0] ?? [];
    const documents =
      results.documents?.[0] ?? [];
    const metadatas =
      results.metadatas?.[0] ?? [];
    const distances =
      results.distances?.[0] ?? [];
  
    return ids.map((id, index) => {
      const metadata = metadatas[index];
  
      const distance =
        distances[index] ?? 1;
      const score = Number.isFinite(distance)
        ? 1 / (1 + Math.max(distance, 0))
        : 0;
      return {
        id,
        source:
          typeof metadata?.source === "string"
            ? metadata.source
            : "unknown",
        section:
          typeof metadata?.section === "string"
            ? metadata.section
            : "Unknown section",
        content:
          documents[index] ?? "",
          score,     
         };
    });
  };