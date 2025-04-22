import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { apiRequest } from '@/lib/queryClient';

// Define message structure
export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

// Define response type for our API
interface ConversationResponse {
  success: boolean;
  messages: Array<{
    id: string;
    content: string;
    isUser: boolean;
    timestamp: string;
  }>;
}

// Main hook for conversation management with persistence
export const useConversation = () => {
  // State for messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Session ID for persistence - generate on first load or restore from storage
  const [sessionId] = useState<string>(() => {
    // Try to get from localStorage first
    const savedSessionId = localStorage.getItem('conversation_session_id');
    if (savedSessionId) {
      return savedSessionId;
    }
    // Create a new one if not found
    const newSessionId = uuidv4();
    localStorage.setItem('conversation_session_id', newSessionId);
    return newSessionId;
  });
  
  // Refs for tracking initialization
  const initialized = useRef(false);
  
  // Load conversation history from API on first mount
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (initialized.current) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/conversations/${sessionId}`);
        const data = await response.json() as ConversationResponse;
        
        if (data.success && data.messages && data.messages.length > 0) {
          // Format dates properly from strings
          const formattedMessages = data.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          
          setMessages(formattedMessages);
        } else {
          // If no history, add initial greeting
          const initialGreeting: ChatMessage = {
            id: uuidv4(),
            content: "Hello! I'm Ella, your AI assistant. How can I help you today?",
            isUser: false,
            timestamp: new Date()
          };
          
          setMessages([initialGreeting]);
          
          // Save this initial greeting to the server
          await apiRequest({
            url: `/api/conversations/${sessionId}/messages`,
            method: 'POST',
            data: {
              content: initialGreeting.content,
              isUser: initialGreeting.isUser
            }
          });
        }
        
        initialized.current = true;
      } catch (err) {
        console.error('Error loading conversation history:', err);
        setError('Failed to load conversation history');
        
        // Fallback to initial greeting if error occurs
        const initialGreeting: ChatMessage = {
          id: uuidv4(),
          content: "Hello! I'm Ella, your AI assistant. How can I help you today?",
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages([initialGreeting]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConversationHistory();
  }, [sessionId]);
  
  // Function to add a message (and persist it)
  const addMessage = useCallback(async (content: string, isUser: boolean): Promise<ChatMessage> => {
    const newMessage: ChatMessage = {
      id: uuidv4(),
      content,
      isUser,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Persist to server
    try {
      await apiRequest({
        url: `/api/conversations/${sessionId}/messages`,
        method: 'POST',
        data: {
          content,
          isUser
        }
      });
    } catch (err) {
      console.error('Error saving message:', err);
      // We don't remove the message from UI even if save fails
      // to avoid user confusion, but log the error
    }
    
    return newMessage;
  }, [sessionId]);
  
  // Function to clear conversation
  const clearConversation = useCallback(async () => {
    try {
      await apiRequest({
        url: `/api/conversations/${sessionId}`,
        method: 'DELETE'
      });
      
      // Add back initial greeting after clearing
      const initialGreeting: ChatMessage = {
        id: uuidv4(),
        content: "Hello! I'm Ella, your AI assistant. How can I help you today?",
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages([initialGreeting]);
      
      // Save this initial greeting to the server
      await apiRequest({
        url: `/api/conversations/${sessionId}/messages`,
        method: 'POST',
        data: {
          content: initialGreeting.content,
          isUser: initialGreeting.isUser
        }
      });
    } catch (err) {
      console.error('Error clearing conversation:', err);
      setError('Failed to clear conversation history');
    }
  }, [sessionId]);
  
  // Function to start a new conversation (new session ID)
  const startNewConversation = useCallback(() => {
    // Generate new session ID
    const newSessionId = uuidv4();
    localStorage.setItem('conversation_session_id', newSessionId);
    
    // Reset UI
    const initialGreeting: ChatMessage = {
      id: uuidv4(),
      content: "Hello! I'm Ella, your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date()
    };
    
    setMessages([initialGreeting]);
    
    // Force page reload to pick up the new session ID
    window.location.reload();
  }, []);
  
  // Return all needed values and functions
  return {
    messages,
    isLoading,
    error,
    sessionId,
    addMessage,
    clearConversation,
    startNewConversation
  };
};