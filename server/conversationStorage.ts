import * as fs from 'fs';
import * as path from 'path';

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
}

// Export a singleton instance
export const conversationStorage = new ConversationStorage();