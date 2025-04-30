import express, { Request, Response } from 'express';
import { conversationStorage, type ChatMessage } from '../conversationStorage';
import { personaManager } from '../personaManager';
import { generateResponse } from '../openai';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../vite';

const router = express.Router();

/**
 * GET /api/session/:sessionId/messages
 * Get messages for a session
 */
router.get('/:sessionId/messages', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { memoryModeOverride } = req.query; // Support query param for GET requests
  
  try {
    // Log the request
    log(`Retrieving messages for session ${sessionId}`);
    
    // Validate memory mode override if present (for demo purposes)
    let validatedMemoryModeOverride: 'persistent' | 'stateless' | undefined = undefined;
    if (
      memoryModeOverride && 
      typeof memoryModeOverride === 'string' && 
      (memoryModeOverride === 'persistent' || memoryModeOverride === 'stateless')
    ) {
      validatedMemoryModeOverride = memoryModeOverride as 'persistent' | 'stateless';
      log(`[DEMO] Memory mode override for GET: ${memoryModeOverride} for session ${sessionId}`);
    }
    
    // Get the messages through the conversationStorage service with optional override
    // This will automatically handle memory modes
    const messages = await conversationStorage.getMessages(sessionId, validatedMemoryModeOverride);
    
    // Return the messages
    res.json(messages);
  } catch (error) {
    console.error(`Error retrieving messages for session ${sessionId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve messages'
    });
  }
});

/**
 * POST /api/session/:sessionId/messages
 * Add a message to a session and get an AI response
 */
router.post('/:sessionId/messages', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { content, memoryModeOverride } = req.body;
  
  if (!content) {
    return res.status(400).json({
      success: false,
      error: 'Message content is required'
    });
  }
  
  // Validate memory mode override if present (for demo purposes)
  let validatedMemoryModeOverride: 'persistent' | 'stateless' | undefined = undefined;
  if (memoryModeOverride && (memoryModeOverride === 'persistent' || memoryModeOverride === 'stateless')) {
    validatedMemoryModeOverride = memoryModeOverride;
    log(`[DEMO] Memory mode override: ${memoryModeOverride} for session ${sessionId}`);
  }
  
  try {
    // Log the request
    log(`Adding user message to session ${sessionId}`);
    
    // Create a user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      isUser: true,
      timestamp: new Date().toISOString()
    };
    
    // Add the message to the session
    await conversationStorage.addMessage(sessionId, userMessage);
    
    // Get the persona for this session
    const persona = personaManager.getSessionPersona(sessionId);
    
    // Generate a response based on the memory mode (with optional override for demo purposes)
    const messages = await conversationStorage.getMessages(sessionId, validatedMemoryModeOverride);
    const aiResponse = await generateResponse(messages, persona, sessionId);
    
    // Create an AI message
    const aiMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: aiResponse,
      isUser: false,
      timestamp: new Date().toISOString()
    };
    
    // Add the AI message to the session
    await conversationStorage.addMessage(sessionId, aiMessage);
    
    // Get the updated messages (with optional override for demo purposes)
    const updatedMessages = await conversationStorage.getMessages(sessionId, validatedMemoryModeOverride);
    
    // Return the messages
    res.json(updatedMessages);
  } catch (error) {
    console.error(`Error adding message to session ${sessionId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to add message'
    });
  }
});

/**
 * DELETE /api/session/:sessionId/messages
 * Clear messages from a session
 */
router.delete('/:sessionId/messages', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  try {
    // Log the request
    log(`Clearing messages for session ${sessionId}`);
    
    // Clear the messages
    const success = await conversationStorage.clearMessages(sessionId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Messages cleared'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
  } catch (error) {
    console.error(`Error clearing messages for session ${sessionId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear messages'
    });
  }
});

/**
 * POST /api/session/:sessionId/persona
 * Set the active persona for a session
 */
router.post('/:sessionId/persona', (req: Request<{sessionId: string}, any, {personaId: string}>, res: Response) => {
  const { sessionId } = req.params;
  const { personaId } = req.body;
  
  // If no persona ID, return error
  if (!personaId) {
    return res.status(400).json({
      success: false,
      error: 'personaId is required'
    });
  }
  
  try {
    // Log the request
    log(`Setting persona ${personaId} for session ${sessionId}`);
    
    // Set the persona
    const success = personaManager.setSessionPersona(sessionId, personaId);
    
    if (success) {
      const persona = personaManager.getSessionPersona(sessionId);
      res.json({
        success: true,
        message: 'Persona set for session',
        persona,
        personaId
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }
  } catch (error) {
    console.error(`Error setting persona for session ${sessionId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to set persona'
    });
  }
});

export default router;