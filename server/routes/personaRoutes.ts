import { Router, Request, Response } from 'express';
import { personaManager } from '../personaManager';

const router = Router();

/**
 * GET /api/personas
 * Get all available personas
 */
router.get('/', (req: Request, res: Response) => {
  const personas = personaManager.getAllPersonas();
  
  res.json({
    success: true,
    personas
  });
});

/**
 * GET /api/personas/:id
 * Get a specific persona by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const persona = personaManager.getPersona(id);
  
  if (!persona) {
    return res.status(404).json({
      success: false,
      error: 'Persona not found'
    });
  }
  
  res.json({
    success: true,
    persona
  });
});

/**
 * POST /api/personas
 * Create a new persona
 */
router.post('/', (req: Request, res: Response) => {
  const { name, description, systemPrompt } = req.body;
  
  if (!name || !systemPrompt) {
    return res.status(400).json({
      success: false,
      error: 'Name and systemPrompt are required'
    });
  }
  
  const persona = personaManager.createPersona({
    name,
    description: description || `Custom persona: ${name}`,
    systemPrompt
  });
  
  res.status(201).json({
    success: true,
    persona
  });
});

/**
 * PUT /api/personas/:id
 * Update an existing persona
 */
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, systemPrompt } = req.body;
  
  if (!name && !description && !systemPrompt) {
    return res.status(400).json({
      success: false,
      error: 'At least one field to update is required'
    });
  }
  
  const updates: {
    name?: string;
    description?: string;
    systemPrompt?: string;
  } = {};
  
  if (name) updates.name = name;
  if (description) updates.description = description;
  if (systemPrompt) updates.systemPrompt = systemPrompt;
  
  const updatedPersona = personaManager.updatePersona(id, updates);
  
  if (!updatedPersona) {
    return res.status(404).json({
      success: false,
      error: 'Persona not found'
    });
  }
  
  res.json({
    success: true,
    persona: updatedPersona
  });
});

/**
 * DELETE /api/personas/:id
 * Delete a persona
 */
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = personaManager.deletePersona(id);
  
  if (!success) {
    return res.status(404).json({
      success: false,
      error: 'Persona not found or cannot be deleted'
    });
  }
  
  res.json({
    success: true,
    message: 'Persona deleted successfully'
  });
});

/**
 * POST /api/personas/session/:sessionId
 * Set the active persona for a session
 */
router.post('/session/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { personaId, customPrompt } = req.body;
  
  // If a custom prompt is provided, create a custom persona
  if (customPrompt) {
    const customPersonaId = personaManager.setSessionCustomPersona(sessionId, customPrompt);
    const persona = personaManager.getPersona(customPersonaId);
    
    return res.json({
      success: true,
      message: 'Custom persona set for session',
      persona,
      personaId: customPersonaId
    });
  }
  
  // Otherwise, use the provided persona ID
  if (!personaId) {
    return res.status(400).json({
      success: false,
      error: 'Either personaId or customPrompt must be provided'
    });
  }
  
  const success = personaManager.setSessionPersona(sessionId, personaId);
  
  if (!success) {
    return res.status(404).json({
      success: false,
      error: 'Persona not found'
    });
  }
  
  const persona = personaManager.getSessionPersona(sessionId);
  
  res.json({
    success: true,
    message: 'Persona set for session',
    persona,
    personaId
  });
});

/**
 * GET /api/personas/session/:sessionId
 * Get the active persona for a session
 */
router.get('/session/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const persona = personaManager.getSessionPersona(sessionId);
  
  res.json({
    success: true,
    persona,
    personaId: persona.id
  });
});

/**
 * DELETE /api/personas/session/:sessionId
 * Reset the session to use the default persona
 */
router.delete('/session/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  personaManager.clearSessionCustomPersona(sessionId);
  const defaultPersona = personaManager.getDefaultPersona();
  
  res.json({
    success: true,
    message: 'Session reset to default persona',
    persona: defaultPersona,
    personaId: defaultPersona.id
  });
});

export default router;