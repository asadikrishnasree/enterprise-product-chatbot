import {
    ChromaClient,
    type Collection,
  } from "chromadb";
  
  const CHROMA_HOST =
    process.env.CHROMA_HOST ?? "localhost";
  
  const CHROMA_PORT = Number(
    process.env.CHROMA_PORT ?? 8000,
  );
  
  const COLLECTION_NAME =
    "enterprise-product-knowledge";
  
  const chromaClient = new ChromaClient({
    host: CHROMA_HOST,
    port: CHROMA_PORT,
    ssl: false,
  });
  
  export const getKnowledgeCollection =
  async (): Promise<Collection> => {
    return chromaClient.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: {
        description:
          "Enterprise product documentation chunks",
      },
    });
  };
  
  export const getChromaConfiguration = () => ({
    host: CHROMA_HOST,
    port: CHROMA_PORT,
    collectionName: COLLECTION_NAME,
  });