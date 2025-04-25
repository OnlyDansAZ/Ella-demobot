import * as fs from 'fs';
import * as path from 'path';
import { personaManager } from './personaManager';

// Define the message structure
export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

// Define the conversation session structure
export interface ConversationSession {
  id: number;
  sessionId: string;
  userId: number | null;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * File-backed implementation of conversation storage
 */
export class ConversationStorage {
  // Map to store conversation sessions by sessionId
  private sessions: Map<string, ConversationSession> = new Map();
  private filePath: string = path.join(process.cwd(), 'data', 'conversations.json');
  
  constructor() {
    this.loadFromFile();
    
    // Set up periodic cleanup of old sessions (every 6 hours)
    setInterval(() => this.cleanupOldSessions(), 6 * 60 * 60 * 1000);
    
    // Run initial cleanup on startup
    this.cleanupOldSessions();
  }
  
  /**
   * Clean up old sessions to prevent memory leaks
   * - Removes sessions older than 30 days
   * - Removes empty sessions (no messages)
   * - Logs statistics about cleanup
   */
  private cleanupOldSessions(): void {
    try {
      console.log('[ConversationStorage] Starting periodic session cleanup');
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      let oldSessionsRemoved = 0;
      let emptySessionsRemoved = 0;
      let totalMessages = 0;
      let totalSessions = this.sessions.size;
      
      // Convert to array to avoid modification during iteration
      Array.from(this.sessions.entries()).forEach(([sessionId, session]) => {
        // Count total messages for statistics
        totalMessages += session.messages.length;
        
        // Remove old sessions (older than 30 days)
        if (new Date(session.updatedAt) < thirtyDaysAgo) {
          this.sessions.delete(sessionId);
          oldSessionsRemoved++;
          return;
        }
        
        // Remove empty sessions that are older than 1 day
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (session.messages.length === 0 && new Date(session.updatedAt) < oneDayAgo) {
          this.sessions.delete(sessionId);
          emptySessionsRemoved++;
        }
      });
      
      // Save changes to file
      this.saveToFile();
      
      // Log cleanup statistics
      console.log(`[ConversationStorage] Cleanup complete: ${oldSessionsRemoved} old sessions removed, ${emptySessionsRemoved} empty sessions removed`);
      console.log(`[ConversationStorage] Storage statistics: ${this.sessions.size} sessions (down from ${totalSessions}), ${totalMessages} total messages`);
    } catch (error) {
      console.error('[ConversationStorage] Error during session cleanup:', error);
    }
  }
  
  // Save conversations to file
  private saveToFile() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Convert sessions map to array for serialization
      const sessionData = Array.from(this.sessions.entries()).map(([key, session]) => {
        return [key, {
          ...session,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString()
        }];
      });
      
      // Save to file
      fs.writeFileSync(
        this.filePath,
        JSON.stringify({ sessions: sessionData }, null, 2)
      );
    } catch (error) {
      console.error('Error saving conversations to file:', error);
    }
  }
  
  // Load conversations from file
  private loadFromFile() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        
        // Convert sessionData back to sessions map
        if (data.sessions) {
          this.sessions = new Map(
            data.sessions.map(([key, session]: [string, any]) => {
              return [key, {
                ...session,
                createdAt: new Date(session.createdAt),
                updatedAt: new Date(session.updatedAt)
              }];
            })
          );
        }
        
        console.log(`Loaded ${this.sessions.size} conversation sessions from file`);
      } else {
        // Initialize with an empty sessions map
        this.sessions = new Map();
        console.log('No conversation file found, starting with empty sessions');
        
        // Create a sample greeting for any new sessions
        this.saveToFile();
      }
    } catch (error) {
      console.error('Error loading conversations from file:', error);
      this.sessions = new Map();
    }
  }
  
  /**
   * Get or create a conversation session
   */
  async getOrCreateSession(sessionId: string, userId?: number): Promise<ConversationSession> {
    // Check if the session already exists
    let session = this.sessions.get(sessionId);
    
    // Create a new session if it doesn't exist
    if (!session) {
      session = {
        id: Date.now(), // Use timestamp as a simple ID
        sessionId,
        userId: userId || null,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store the new session
      this.sessions.set(sessionId, session);
      this.saveToFile();
    }
    
    return session;
  }
  
  /**
   * Save messages to a conversation session
   */
  async saveMessages(sessionId: string, messages: ChatMessage[]): Promise<ConversationSession> {
    // Get or create the session
    const session = await this.getOrCreateSession(sessionId);
    
    // Update the messages
    session.messages = messages;
    session.updatedAt = new Date();
    
    // Update the session in the map
    this.sessions.set(sessionId, session);
    this.saveToFile();
    
    return session;
  }
  
  /**
   * Get messages from a conversation session
   * If the persona has a stateless memory mode, returns an empty array
   */
  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const session = await this.getOrCreateSession(sessionId);
    
    // Get the current persona for this session
    const persona = personaManager.getSessionPersona(sessionId);
    
    // If the persona uses stateless memory mode, don't return any history
    if (persona.memoryMode === 'stateless') {
      console.log(`Using stateless memory mode for session ${sessionId.substring(0, 8)}... - history not preserved`);
      return [];
    }
    
    // Otherwise return the full message history for persistent memory mode
    console.log(`Using persistent memory mode for session ${sessionId.substring(0, 8)}... - returning ${session.messages.length} messages`);
    return session.messages;
  }
  
  /**
   * Add a message to the conversation
   */
  async addMessage(sessionId: string, message: ChatMessage): Promise<ConversationSession> {
    // Get or create the session
    const session = await this.getOrCreateSession(sessionId);
    
    // Add the new message to the existing messages
    session.messages = [...session.messages, message];
    session.updatedAt = new Date();
    
    // Update the session in the map
    this.sessions.set(sessionId, session);
    this.saveToFile();
    
    return session;
  }
  
  /**
   * Clear messages from a conversation session
   */
  async clearMessages(sessionId: string): Promise<boolean> {
    // Get the session
    const session = await this.getOrCreateSession(sessionId);
    
    // Clear the messages
    session.messages = [];
    session.updatedAt = new Date();
    
    // Update the session in the map
    this.sessions.set(sessionId, session);
    this.saveToFile();
    
    return true;
  }
  
  /**
   * Delete a conversation session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    // Remove the session from the map
    const result = this.sessions.delete(sessionId);
    this.saveToFile();
    return result;
  }

  /**
   * Reset message history for stateless personas
   * This should be called at the end of interactions with stateless personas
   * such as when a sales call ends
   */
  async resetStatelessSession(sessionId: string): Promise<boolean> {
    // Get the current persona for this session
    const persona = personaManager.getSessionPersona(sessionId);
    
    // Only reset history if the persona is stateless
    if (persona.memoryMode === 'stateless') {
      console.log(`Resetting stateless memory for session ${sessionId.substring(0, 8)}...`);
      return this.clearMessages(sessionId);
    }
    
    // For persistent memory, don't reset anything
    console.log(`Skipping reset for persistent memory session ${sessionId.substring(0, 8)}...`);
    return false;
  }
}

// Export a singleton instance
export const conversationStorage = new ConversationStorage();