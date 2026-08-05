import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface KnowledgeDocument {
  id: string;
  filename: string;
  sourcePath: string;
  content: string;
}

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

const knowledgeBaseDirectory =
  process.env.KNOWLEDGE_BASE_PATH
    ? path.resolve(process.env.KNOWLEDGE_BASE_PATH)
    : path.resolve(
        currentDirectory,
        "../../../../knowledge-base",
      );

export const loadKnowledgeDocuments =
  async (): Promise<KnowledgeDocument[]> => {
    const filenames = await readdir(
      knowledgeBaseDirectory,
    );

    const markdownFiles = filenames.filter((filename) =>
      filename.endsWith(".md"),
    );

    const documents = await Promise.all(
      markdownFiles.map(async (filename) => {
        const sourcePath = path.join(
          knowledgeBaseDirectory,
          filename,
        );

        const content = await readFile(
          sourcePath,
          "utf-8",
        );

        return {
          id: filename.replace(/\.md$/i, ""),
          filename,
          sourcePath,
          content,
        };
      }),
    );

    return documents.sort((first, second) =>
      first.filename.localeCompare(second.filename),
    );
  };