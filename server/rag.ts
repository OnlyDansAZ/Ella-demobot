import { performSimilaritySearch } from './vectordb';
import { ChatMessage } from './openai';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Extract relevant context from the vector database based on the query
 */
export async function getRelevantContext(query: string, conversationHistory: ChatMessage[] = []): Promise<string> {
  try {
    // Get recent messages, but with more context (last 8 messages instead of 5)
    const recentMessages = conversationHistory.slice(-8);
    
    // Extract key topics from the conversation for better context
    const topicKeywords = extractTopics(query, recentMessages);
    
    // Create a more sophisticated enhanced query
    let enhancedQuery = query;
    
    // Add conversation context if available
    if (recentMessages.length > 0) {
      // Get only user messages for a cleaner context
      const userMessages = recentMessages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content);
      
      if (userMessages.length > 0) {
        enhancedQuery += ` (Recent user queries: ${userMessages.join(' ')})`;
      }
    }
    
    // Add topic keywords for better semantic search
    if (topicKeywords.length > 0) {
      enhancedQuery += ` (Topics: ${topicKeywords.join(', ')})`;
    }
    
    // Increase number of results from 3 to 4 for better coverage
    const searchResults = await performSimilaritySearch(enhancedQuery, 4);
    
    if (!searchResults || searchResults.length === 0) {
      return "";
    }
    
    // Improved formatting with metadata for better context
    const context = searchResults.map((doc, index) => {
      const metadataStr = Object.entries(doc.metadata)
        .filter(([key]) => key !== 'text') // Exclude the text itself from metadata
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      return `Source ${index + 1} (${doc.metadata.title || 'Untitled'}, ${metadataStr}): ${doc.pageContent}`;
    }).join('\n\n');
    
    return context;
  } catch (error) {
    console.error("Error retrieving context from vector database:", error);
    return "";
  }
}

/**
 * Extract key topics from the query and recent conversation
 * to enhance vector search
 */
function extractTopics(query: string, recentMessages: ChatMessage[]): string[] {
  // Common words to filter out
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
    'have', 'has', 'had', 'do', 'does', 'did', 'to', 'from', 'in', 'out',
    'for', 'of', 'on', 'by', 'with', 'about', 'against', 'between', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'this', 'that', 'these', 'those', 'am', 'can', 'will', 'should', 'would',
    'could', 'may', 'might', 'must', 'shall'
  ]);

  // Business and product-specific keywords to prioritize
  const businessKeywords = new Set([
    'tier', 'plan', 'pricing', 'starter', 'pro', 'enterprise', 'platinum',
    'feature', 'capability', 'integration', 'assistant', 'ai', 'voice',
    'schedule', 'meeting', 'calendar', 'email', 'workflow', 'automate',
    'business', 'personal', 'support', 'sales', 'marketing', 'technical',
    'custom', 'price', 'cost', 'roi', 'investment', 'trial', 'demo'
  ]);

  // Combine query and messages for topic extraction
  const allText = [
    query,
    ...recentMessages.map(msg => msg.content)
  ].join(' ');

  // Tokenize and normalize
  const words = allText.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)            // Split on whitespace
    .filter(word => word.length > 2 && !stopWords.has(word)); // Filter stop words and short words

  // Count word frequencies
  const wordFrequency: Record<string, number> = {};
  for (const word of words) {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  }

  // Sort by frequency and prioritize business keywords
  const sortedWords = Object.entries(wordFrequency)
    .sort((a, b) => {
      // Prioritize business keywords
      const aIsBusiness = businessKeywords.has(a[0]);
      const bIsBusiness = businessKeywords.has(b[0]);
      
      if (aIsBusiness && !bIsBusiness) return -1;
      if (!aIsBusiness && bIsBusiness) return 1;
      
      // Then sort by frequency
      return b[1] - a[1];
    })
    .slice(0, 8) // Take top 8 keywords
    .map(([word]) => word);

  return sortedWords;
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
The following information from YoBot's official knowledge base is directly relevant to this conversation. This information is the MOST ACCURATE and UP-TO-DATE source of truth about YoBot's products, features, and capabilities. Prioritize this information over any other knowledge you may have about YoBot or AI assistants.

${relevantContext}

INSTRUCTIONS FOR USING KNOWLEDGE BASE INFORMATION:
1. When discussing YoBot's products, features, tiers, or capabilities, ALWAYS use this knowledge base information first and foremost
2. Provide accurate and specific details about features, including which tier they belong to
3. When comparing tiers, be precise about what each tier offers based on the knowledge base
4. If a user asks about something not covered in the knowledge base, say something like "Let me check on that specific detail for you" rather than making up information
5. Incorporate this information naturally without mentioning the "knowledge base" or that you're referencing specific sources
6. Use the exact terminology from the knowledge base when describing features (e.g., use "Voice Recognition" rather than "Speech Recognition" if that's how it's described)
7. If the user asks about competitors or how YoBot compares to other products, be honest but diplomatic, emphasizing YoBot's unique strengths`;
}