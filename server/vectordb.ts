import { Pool, neonConfig } from '@neondatabase/serverless';
import { OpenAIEmbeddings } from "@langchain/openai";
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { Document } from 'langchain/document';
import ws from 'ws';

// Configure Neon for WebSocket support
neonConfig.webSocketConstructor = ws;

// Database connection for Neon DB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Initialize the embeddings model
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "text-embedding-3-small" // Using the latest embeddings model
});

// Set up the PGVector store with our PostgreSQL pool
let vectorStore: PGVectorStore;

/**
 * Initialize the vector database - creates tables if they don't exist
 */
export async function initVectorDB() {
  try {
    // Initialize PGVector store
    // Direct connection config for PGVector which expects a direct client config, not a pool
    vectorStore = await PGVectorStore.initialize(embeddings, {
      postgresConnectionOptions: {
        type: "neon",
        connectionString: process.env.DATABASE_URL,
      },
      tableName: "documents", // Table name to use
      columns: {
        idColumnName: "id",
        vectorColumnName: "embedding",
        contentColumnName: "content",
        metadataColumnName: "metadata",
      },
    });
    
    console.log("Vector database initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing vector database:", error);
    return false;
  }
}

/**
 * Add documents to the vector store
 */
export async function addDocuments(documents: Document[]) {
  try {
    if (!vectorStore) {
      await initVectorDB();
    }
    
    // Add documents to the vector store
    await vectorStore.addDocuments(documents);
    console.log(`Added ${documents.length} documents to vector store`);
    return true;
  } catch (error) {
    console.error("Error adding documents to vector store:", error);
    return false;
  }
}

/**
 * Perform a similarity search in the vector store
 */
export async function performSimilaritySearch(query: string, maxResults: number = 5) {
  try {
    if (!vectorStore) {
      await initVectorDB();
    }
    
    // Perform similarity search
    const results = await vectorStore.similaritySearch(query, maxResults);
    return results;
  } catch (error) {
    console.error("Error performing similarity search:", error);
    return [];
  }
}