import { db } from "./db";
import { 
  conversationHistory, 
  type ConversationHistory, 
  type InsertConversation,
  type UpdateConversation 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Define the message structure
export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

/**
 * Service for managing persistent conversation storage
 */
export class ConversationStorage {
  
  /**
   * Get or create a conversation session
   */
  async getOrCreateSession(sessionId: string, userId?: number): Promise<ConversationHistory> {
    // First try to find an existing session
    const [existingSession] = await db
      .select()
      .from(conversationHistory)
      .where(eq(conversationHistory.sessionId, sessionId));
    
    if (existingSession) {
      return existingSession;
    }
    
    // Create a new session if one doesn't exist
    const newSession: InsertConversation = {
      sessionId,
      userId: userId || null,
      messages: [],
    };
    
    const [createdSession] = await db
      .insert(conversationHistory)
      .values(newSession)
      .returning();
      
    return createdSession;
  }
  
  /**
   * Save messages to a conversation session
   */
  async saveMessages(sessionId: string, messages: ChatMessage[]): Promise<ConversationHistory> {
    // Get or create session
    const session = await this.getOrCreateSession(sessionId);
    
    // Update the messages
    const [updatedSession] = await db
      .update(conversationHistory)
      .set({ 
        messages: messages as any, // TypeScript workaround for JSONB
        updatedAt: new Date()
      })
      .where(eq(conversationHistory.id, session.id))
      .returning();
      
    return updatedSession;
  }
  
  /**
   * Get messages from a conversation session
   */
  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const session = await this.getOrCreateSession(sessionId);
    return session.messages as unknown as ChatMessage[];
  }
  
  /**
   * Add a message to the conversation
   */
  async addMessage(sessionId: string, message: ChatMessage): Promise<ConversationHistory> {
    const session = await this.getOrCreateSession(sessionId);
    
    // Get existing messages and add the new one
    const messages = [...(session.messages as unknown as ChatMessage[] || []), message];
    
    // Update the session with new messages
    const [updatedSession] = await db
      .update(conversationHistory)
      .set({ 
        messages: messages as any,
        updatedAt: new Date()
      })
      .where(eq(conversationHistory.id, session.id))
      .returning();
      
    return updatedSession;
  }
  
  /**
   * Clear messages from a conversation session
   */
  async clearMessages(sessionId: string): Promise<boolean> {
    const session = await this.getOrCreateSession(sessionId);
    
    await db
      .update(conversationHistory)
      .set({ 
        messages: [],
        updatedAt: new Date()
      })
      .where(eq(conversationHistory.id, session.id));
      
    return true;
  }
  
  /**
   * Delete a conversation session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    await db
      .delete(conversationHistory)
      .where(eq(conversationHistory.sessionId, sessionId));
      
    return true;
  }
}

// Export a singleton instance
export const conversationStorage = new ConversationStorage();