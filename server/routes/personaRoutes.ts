import { Router, Request, Response } from 'express';
import { personaManager, Persona } from '../personaManager';

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
      message: 'Persona not found'
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
      message: 'Name and system prompt are required'
    });
  }
  
  const newPersona = personaManager.createPersona({
    name,
    description: description || '',
    systemPrompt
  });
  
  res.status(201).json({
    success: true,
    persona: newPersona
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
      message: 'At least one field to update is required'
    });
  }
  
  const updatedPersona = personaManager.updatePersona(id, {
    name,
    description,
    systemPrompt
  });
  
  if (!updatedPersona) {
    return res.status(404).json({
      success: false,
      message: 'Persona not found or cannot be updated'
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
  const result = personaManager.deletePersona(id);
  
  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Persona not found or cannot be deleted'
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
  
  if (customPrompt) {
    // Set custom persona
    const customPersonaId = personaManager.setSessionCustomPersona(sessionId, customPrompt);
    const persona = personaManager.getPersona(customPersonaId);
    
    return res.json({
      success: true,
      personaId: customPersonaId,
      persona,
      message: 'Custom persona set for session'
    });
  } else if (personaId) {
    // Set predefined persona
    const success = personaManager.setSessionPersona(sessionId, personaId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Persona not found'
      });
    }
    
    const persona = personaManager.getPersona(personaId);
    
    return res.json({
      success: true,
      personaId,
      persona,
      message: 'Persona set for session'
    });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Either personaId or customPrompt is required'
    });
  }
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
    personaId: persona.id,
    persona
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
    personaId: defaultPersona.id,
    persona: defaultPersona,
    message: 'Session reset to default persona'
  });
});

export default router;