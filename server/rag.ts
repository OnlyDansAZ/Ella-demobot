import { performSimilaritySearch } from './vectordb';
import { ChatMessage } from './openai';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Extract relevant context from the vector database based on the query
 */
export async function getRelevantContext(query: string, conversationHistory: ChatMessage[] = []): Promise<string> {
  try {
    // Extract potential context-seeking information from recent conversation
    const recentMessages = conversationHistory.slice(-5);
    
    // Build a combined query from the current message and recent context
    const enhancedQuery = recentMessages.length > 0
      ? `${query} (Previous context: ${recentMessages.map(msg => msg.content).join(' ')})`
      : query;
    
    // Perform similarity search in vector database
    const searchResults = await performSimilaritySearch(enhancedQuery, 3);
    
    if (!searchResults || searchResults.length === 0) {
      return "";
    }
    
    // Extract and format the content from search results
    const context = searchResults.map((doc, index) => {
      return `Document ${index + 1} (${doc.metadata.title || 'Untitled'}): ${doc.pageContent}`;
    }).join('\n\n');
    
    return context;
  } catch (error) {
    console.error("Error retrieving context from vector database:", error);
    return "";
  }
}

/**
 * Generate a prompt that includes relevant knowledge base information
 */
export function createEnhancedSystemPrompt(systemPrompt: string, relevantContext: string): string {
  if (!relevantContext) {
    return systemPrompt;
  }
  
  return `${systemPrompt}

KNOWLEDGE BASE CONTEXT:
The following information from YoBot's knowledge base may be relevant to the user's query. Use this information to enhance your response, but only if it's directly relevant to what the user is asking about.

${relevantContext}

When using information from the knowledge base:
1. Provide accurate and specific details based on the context above
2. If the knowledge base doesn't contain the information needed, rely on your general knowledge but make it clear when you're doing so
3. Don't mention that you're using a "knowledge base" or "vector database" - just incorporate the information naturally`;
}