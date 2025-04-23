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

// In-memory fallback for when database is unavailable
class MemoryFallback {
  private sessions: Map<string, any> = new Map();
  
  getSession(sessionId: string): any {
    return this.sessions.get(sessionId);
  }
  
  setSession(sessionId: string, data: any): void {
    this.sessions.set(sessionId, data);
  }
  
  clearSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages = [];
      this.sessions.set(sessionId, session);
    }
  }
  
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

/**
 * Service for managing persistent conversation storage
 * with fallback to memory when database is unavailable
 */
export class ConversationStorage {
  private memoryFallback: MemoryFallback = new MemoryFallback();
  private useMemoryFallback: boolean = false;
  
  /**
   * Get or create a conversation session
   */
  async getOrCreateSession(sessionId: string, userId?: number): Promise<ConversationHistory> {
    try {
      if (this.useMemoryFallback) {
        throw new Error("Using memory fallback");
      }
      
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
    } catch (error) {
      console.warn("Database error, using memory fallback:", error);
      this.useMemoryFallback = true;
      
      // Use memory fallback
      let session = this.memoryFallback.getSession(sessionId);
      if (!session) {
        session = {
          id: Math.floor(Math.random() * 10000),
          sessionId,
          userId: userId || null,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.memoryFallback.setSession(sessionId, session);
      }
      
      return session;
    }
  }
  
  /**
   * Save messages to a conversation session
   */
  async saveMessages(sessionId: string, messages: ChatMessage[]): Promise<ConversationHistory> {
    try {
      if (this.useMemoryFallback) {
        throw new Error("Using memory fallback");
      }
      
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
    } catch (error) {
      console.warn("Database error in saveMessages, using memory fallback:", error);
      this.useMemoryFallback = true;
      
      // Get existing session or create new one
      const session = await this.getOrCreateSession(sessionId);
      
      // Update the messages in memory
      session.messages = messages;
      session.updatedAt = new Date();
      this.memoryFallback.setSession(sessionId, session);
      
      return session;
    }
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
    try {
      if (this.useMemoryFallback) {
        throw new Error("Using memory fallback");
      }
      
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
    } catch (error) {
      console.warn("Database error in addMessage, using memory fallback:", error);
      this.useMemoryFallback = true;
      
      // Get existing session or create new one
      const session = await this.getOrCreateSession(sessionId);
      
      // Add the message to existing messages
      const messages = [...(session.messages as unknown as ChatMessage[] || []), message];
      session.messages = messages;
      session.updatedAt = new Date();
      this.memoryFallback.setSession(sessionId, session);
      
      return session;
    }
  }
  
  /**
   * Clear messages from a conversation session
   */
  async clearMessages(sessionId: string): Promise<boolean> {
    try {
      if (this.useMemoryFallback) {
        throw new Error("Using memory fallback");
      }
      
      const session = await this.getOrCreateSession(sessionId);
      
      await db
        .update(conversationHistory)
        .set({ 
          messages: [],
          updatedAt: new Date()
        })
        .where(eq(conversationHistory.id, session.id));
        
      return true;
    } catch (error) {
      console.warn("Database error in clearMessages, using memory fallback:", error);
      this.useMemoryFallback = true;
      
      // Clear messages in memory
      this.memoryFallback.clearSession(sessionId);
      return true;
    }
  }
  
  /**
   * Delete a conversation session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      if (this.useMemoryFallback) {
        throw new Error("Using memory fallback");
      }
      
      await db
        .delete(conversationHistory)
        .where(eq(conversationHistory.sessionId, sessionId));
        
      return true;
    } catch (error) {
      console.warn("Database error in deleteSession, using memory fallback:", error);
      this.useMemoryFallback = true;
      
      // Delete session from memory
      this.memoryFallback.deleteSession(sessionId);
      return true;
    }
  }
}

// Export a singleton instance
export const conversationStorage = new ConversationStorage();