import { pipeline } from "@huggingface/transformers";

const EMBEDDING_MODEL =
  "Xenova/all-MiniLM-L6-v2";

interface EmbeddingOutput {
  tolist: () => unknown;
}

type EmbeddingExtractor = (
  texts: string[],
  options: {
    pooling: "mean";
    normalize: boolean;
  },
) => Promise<EmbeddingOutput>;

let extractorPromise:
  | Promise<EmbeddingExtractor>
  | undefined;

const loadExtractor =
  async (): Promise<EmbeddingExtractor> => {
    if (!extractorPromise) {
      extractorPromise = pipeline(
        "feature-extraction",
        EMBEDDING_MODEL,
      ).then(
        (extractor) =>
          extractor as unknown as EmbeddingExtractor,
      );
    }

    return extractorPromise;
  };

export const generateEmbeddings = async (
  texts: string[],
): Promise<number[][]> => {
  if (texts.length === 0) {
    return [];
  }

  const extractor = await loadExtractor();

  const output = await extractor(texts, {
    pooling: "mean",
    normalize: true,
  });

  const embeddings = output.tolist();

  if (!Array.isArray(embeddings)) {
    throw new Error(
      "The embedding model returned an invalid result.",
    );
  }

  return embeddings as number[][];
};

export const getEmbeddingModelName = (): string =>
  EMBEDDING_MODEL;