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
 * Pure in-memory implementation of conversation storage
 */
export class ConversationStorage {
  // Map to store conversation sessions by sessionId
  private sessions: Map<string, ConversationSession> = new Map();
  
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
    
    return session;
  }
  
  /**
   * Get messages from a conversation session
   */
  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const session = await this.getOrCreateSession(sessionId);
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
    
    return true;
  }
  
  /**
   * Delete a conversation session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    // Remove the session from the map
    this.sessions.delete(sessionId);
    return true;
  }
}

// Export a singleton instance
export const conversationStorage = new ConversationStorage();