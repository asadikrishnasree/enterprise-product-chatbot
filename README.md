React + TypeScript frontend
        |
        | POST /api/chat/stream
        v
Node.js + Express backend
        |
        +---- Query embedding
        |
        +---- ChromaDB similarity search
        |
        +---- Relevant document chunks
        |
        +---- Prompt construction
        |
        +---- OpenAI streaming API
        |
        v
SSE status/delta/done events
        |
        v
Redux updates UI incrementally


<!-- What is the Priority 1 response time in Support Hub? -->