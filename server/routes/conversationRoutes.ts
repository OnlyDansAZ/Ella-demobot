import express, { Router, Request, Response } from "express";
import { conversationStorage, ChatMessage, ConversationSession } from "../conversationStorage";
import { v4 as uuidv4 } from "uuid";

const router = Router();

/**
 * API endpoint to get conversation history
 * GET /api/conversations/:sessionId
 * 
 * Retrieves the conversation history for a given session
 */
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    const messages = await conversationStorage.getMessages(sessionId);
    
    return res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return res.status(500).json({ message: 'Failed to retrieve conversation history' });
  }
});

/**
 * API endpoint to save a message to conversation history
 * POST /api/conversations/:sessionId/messages
 * 
 * Adds a new message to the conversation history
 */
router.post('/:sessionId/messages', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { content, isUser } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    if (content === undefined) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    const message: ChatMessage = {
      id: uuidv4(),
      content,
      isUser: !!isUser,
      timestamp: new Date().toISOString()
    };
    
    const session = await conversationStorage.addMessage(sessionId, message);
    
    return res.status(200).json({
      success: true,
      message,
      messageCount: session.messages.length
    });
  } catch (error) {
    console.error('Error saving message to conversation history:', error);
    return res.status(500).json({ message: 'Failed to save message' });
  }
});

/**
 * API endpoint to save complete conversation history
 * PUT /api/conversations/:sessionId
 * 
 * Overwrites the existing conversation with a new set of messages
 */
router.put('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { messages } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    if (!Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages must be an array' });
    }
    
    const session = await conversationStorage.saveMessages(sessionId, messages);
    
    return res.status(200).json({
      success: true,
      messageCount: session.messages.length
    });
  } catch (error) {
    console.error('Error saving conversation history:', error);
    return res.status(500).json({ message: 'Failed to save conversation history' });
  }
});

/**
 * API endpoint to clear conversation history
 * DELETE /api/conversations/:sessionId
 * 
 * Clears all messages from the conversation
 */
router.delete('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    await conversationStorage.clearMessages(sessionId);
    
    return res.status(200).json({
      success: true,
      message: 'Conversation history cleared'
    });
  } catch (error) {
    console.error('Error clearing conversation history:', error);
    return res.status(500).json({ message: 'Failed to clear conversation history' });
  }
});

export default router;