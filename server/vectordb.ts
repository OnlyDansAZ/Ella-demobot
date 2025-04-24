import { OpenAIEmbeddings } from "@langchain/openai";
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { Document } from 'langchain/document';
import { safeDbOperation, isDatabaseAvailable } from './db';

// Use the shared pool from db.ts instead of creating a new one

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
  // Check if database is available first
  if (!isDatabaseAvailable && process.env.DATABASE_URL) {
    console.log("Database is not available yet. Will retry initialization when needed.");
    return false;
  }
  
  return await safeDbOperation(
    async () => {
      // Initialize PGVector store
      // Direct connection config for PGVector which expects a direct client config, not a pool
      vectorStore = await PGVectorStore.initialize(embeddings, {
        postgresConnectionOptions: {
          // TypeScript error: 'type' is not a recognized property in PoolConfig
          // Removing 'type' property as it's not needed for connection to work
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
    },
    // Fallback operation - just return false if initialization fails
    () => {
      console.log("Using fallback for vector database initialization");
      return false;
    },
    "Vector database initialization"
  );
}

/**
 * Add documents to the vector store
 */
export async function addDocuments(documents: Document[]) {
  // Use our safe database operation wrapper with fallback
  return await safeDbOperation(
    async () => {
      if (!vectorStore) {
        await initVectorDB();
      }
      
      // Add documents to the vector store
      await vectorStore.addDocuments(documents);
      console.log(`Added ${documents.length} documents to vector store`);
      return true;
    },
    // Fallback operation - return false if we can't add the documents
    () => {
      console.log("Could not add documents to vector store due to database issues");
      return false;
    },
    "Vector store document addition"
  );
}

/**
 * Perform a similarity search in the vector store
 */
export async function performSimilaritySearch(query: string, maxResults: number = 5) {
  // Use our safe database operation wrapper with fallback
  return await safeDbOperation(
    async () => {
      if (!vectorStore) {
        await initVectorDB();
      }
      return await vectorStore.similaritySearch(query, maxResults);
    },
    // Fallback operation - return empty array if search fails
    () => {
      console.log("Using fallback for similarity search - returning empty results");
      return [];
    },
    "Vector similarity search"
  );
}