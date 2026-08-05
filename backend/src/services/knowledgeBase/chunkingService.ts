import type {
    KnowledgeDocument,
  } from "./documentLoader.js";
  
  export interface KnowledgeChunk {
    id: string;
    documentId: string;
    source: string;
    section: string;
    content: string;
    chunkIndex: number;
  }
  
  const MAX_CHUNK_LENGTH = 900;
  const CHUNK_OVERLAP = 120;
  
  interface MarkdownSection {
    heading: string;
    content: string;
  }
  
  const splitMarkdownIntoSections = (
    markdown: string,
  ): MarkdownSection[] => {
    const lines = markdown.split(/\r?\n/);
  
    const sections: MarkdownSection[] = [];
  
    let currentHeading = "Document";
    let currentLines: string[] = [];
  
    const saveCurrentSection = () => {
      const body = currentLines
        .join("\n")
        .trim();
  
      if (body) {
        sections.push({
          heading: currentHeading,
          content:
            currentHeading === "Document"
              ? body
              : `## ${currentHeading}\n\n${body}`,
        });
      }
  
      currentLines = [];
    };
  
    for (const line of lines) {
      const headingMatch = line.match(
        /^(#{1,6})\s+(.+)$/,
      );
  
      if (headingMatch) {
        saveCurrentSection();
  
        currentHeading =
          headingMatch[2]?.trim() ??
          "Untitled Section";
      } else {
        currentLines.push(line);
      }
    }
  
    saveCurrentSection();
  
    return sections;
  };
  
  const splitLargeText = (
    text: string,
    maxLength = MAX_CHUNK_LENGTH,
    overlap = CHUNK_OVERLAP,
  ): string[] => {
    if (text.length <= maxLength) {
      return [text];
    }
  
    const chunks: string[] = [];
  
    let start = 0;
  
    while (start < text.length) {
      let end = Math.min(
        start + maxLength,
        text.length,
      );
  
      if (end < text.length) {
        const preferredBreak = Math.max(
          text.lastIndexOf("\n\n", end),
          text.lastIndexOf("\n", end),
          text.lastIndexOf(". ", end),
        );
  
        if (
          preferredBreak > start +
            Math.floor(maxLength * 0.5)
        ) {
          end = preferredBreak + 1;
        }
      }
  
      const chunk = text
        .slice(start, end)
        .trim();
  
      if (chunk) {
        chunks.push(chunk);
      }
  
      if (end >= text.length) {
        break;
      }
  
      start = Math.max(
        end - overlap,
        start + 1,
      );
    }
  
    return chunks;
  };
  
  export const createKnowledgeChunks = (
    documents: KnowledgeDocument[],
  ): KnowledgeChunk[] => {
    const chunks: KnowledgeChunk[] = [];
  
    for (const document of documents) {
      const sections = splitMarkdownIntoSections(
        document.content,
      );
  
      let chunkIndex = 0;
  
      for (const section of sections) {
        const sectionChunks = splitLargeText(
          section.content,
        );
  
        for (const content of sectionChunks) {
          chunks.push({
            id: `${document.id}-chunk-${chunkIndex}`,
            documentId: document.id,
            source: document.filename,
            section: section.heading,
            content,
            chunkIndex,
          });
  
          chunkIndex += 1;
        }
      }
    }
  
    return chunks;
  };