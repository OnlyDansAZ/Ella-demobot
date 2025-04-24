import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  isDefault?: boolean;
}

/**
 * Server-side persona management system
 * Handles storage, retrieval, and management of bot personas
 */
class PersonaManager {
  private personas: Map<string, Persona> = new Map();
  private filePath: string = path.join(process.cwd(), 'data', 'personas.json');
  private currentSessionPersonas: Map<string, string> = new Map(); // sessionId -> personaId
  
  constructor() {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize with default personas
    this.initializePersonas();
    
    // Load personas from file if available
    this.loadFromFile();

    // Save defaults to file if not already there
    this.saveToFile();
  }
  
  /**
   * Initialize default personas
   */
  private initializePersonas() {
    // Default personas if none are loaded
    const defaultPersonas: Persona[] = [
      {
        id: 'default',
        name: 'Standard Ella',
        description: 'The default helpful and friendly assistant personality.',
        systemPrompt: `You are Ella, an advanced AI assistant created by YoBot. 
You're helpful, friendly, and knowledgeable. You speak in a conversational, personable tone 
that makes users feel comfortable. You provide informative and accurate responses while 
maintaining a positive and supportive attitude. If you don't know something, you admit it 
rather than making up information. You can assist with scheduling appointments, providing information, 
and general conversation.`,
        isDefault: true
      },
      {
        id: 'expert',
        name: 'Expert Consultant',
        description: 'A more formal, technically precise, and professional persona for business contexts.',
        systemPrompt: `You are Ella, an AI consultant with deep expertise across multiple domains.
You communicate with precision and professionalism, providing detailed technical explanations
when appropriate. You're thorough and methodical in your approach, and you maintain a formal, 
business-appropriate tone. Prioritize accuracy and depth in your responses, and organize 
complex information in a clear, structured manner.`
      },
      {
        id: 'friendly',
        name: 'Friendly Companion',
        description: 'A warm, empathetic, and casual conversational partner.',
        systemPrompt: `You are Ella, a warm and friendly AI companion. 
You speak in a casual, warm, and engaging manner, with a touch of humor when appropriate.
Your primary role is to be supportive and understanding. You show empathy for the user's
situations and feelings, and you focus on building rapport through conversation.
You're patient and encouraging, and you adjust your tone to match the user's emotional state.`
      },
      {
        id: 'efficient',
        name: 'Efficient Assistant',
        description: 'A concise, to-the-point assistant focused on efficiency.',
        systemPrompt: `You are Ella, an AI assistant optimized for efficiency and clarity.
You provide concise, direct responses without unnecessary elaboration. You focus on
delivering the most relevant information in the fewest words possible, while still
being complete and accurate. You value the user's time and aim to resolve their queries
quickly and effectively. Use bullet points, short sentences, and clear organization
when appropriate.`
      }
    ];
    
    // Add default personas to the map
    for (const persona of defaultPersonas) {
      this.personas.set(persona.id, persona);
    }
  }
  
  /**
   * Save personas to file
   */
  private saveToFile() {
    try {
      const data = JSON.stringify({
        personas: Array.from(this.personas.values())
      }, null, 2);
      
      fs.writeFileSync(this.filePath, data);
      console.log(`Saved ${this.personas.size} personas to ${this.filePath}`);
    } catch (error) {
      console.error('Error saving personas to file:', error);
    }
  }
  
  /**
   * Load personas from file
   */
  private loadFromFile() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(data);
        
        if (parsed.personas && Array.isArray(parsed.personas)) {
          // Clear existing personas (except default ones)
          const defaultPersonas = Array.from(this.personas.values())
            .filter(p => p.isDefault);
          
          this.personas.clear();
          
          // Add back default personas first
          for (const persona of defaultPersonas) {
            this.personas.set(persona.id, persona);
          }
          
          // Add personas from file, potentially overwriting defaults
          for (const persona of parsed.personas) {
            this.personas.set(persona.id, persona);
          }
          
          console.log(`Loaded ${parsed.personas.length} personas from file`);
        }
      }
    } catch (error) {
      console.error('Error loading personas from file:', error);
    }
  }
  
  /**
   * Get all available personas
   */
  getAllPersonas(): Persona[] {
    return Array.from(this.personas.values());
  }
  
  /**
   * Get a specific persona by ID
   */
  getPersona(id: string): Persona | undefined {
    return this.personas.get(id);
  }
  
  /**
   * Get the default persona
   */
  getDefaultPersona(): Persona {
    // Find persona marked as default
    const defaultPersona = Array.from(this.personas.values())
      .find(p => p.isDefault);
    
    // If found, return it
    if (defaultPersona) {
      return defaultPersona;
    }
    
    // Otherwise, return the first persona or create a basic one
    const firstPersona = Array.from(this.personas.values())[0];
    if (firstPersona) {
      return firstPersona;
    }
    
    // Fallback to a basic persona if there are none
    return {
      id: 'default',
      name: 'Standard Ella',
      description: 'The default helpful assistant personality.',
      systemPrompt: 'You are a helpful AI assistant named Ella.',
      isDefault: true
    };
  }
  
  /**
   * Create a new custom persona
   */
  createPersona(persona: Omit<Persona, 'id'>): Persona {
    const id = uuidv4();
    
    const newPersona: Persona = { 
      ...persona, 
      id 
    };
    
    this.personas.set(id, newPersona);
    this.saveToFile();
    
    return newPersona;
  }
  
  /**
   * Update an existing persona
   */
  updatePersona(id: string, updates: Partial<Persona>): Persona | undefined {
    const persona = this.personas.get(id);
    
    if (!persona) {
      return undefined;
    }
    
    // Apply updates
    const updatedPersona: Persona = {
      ...persona,
      ...updates,
      id // Ensure ID doesn't change
    };
    
    this.personas.set(id, updatedPersona);
    this.saveToFile();
    
    return updatedPersona;
  }
  
  /**
   * Delete a persona
   */
  deletePersona(id: string): boolean {
    // Don't allow deleting default personas
    const persona = this.personas.get(id);
    if (!persona || persona.isDefault) {
      return false;
    }
    
    const result = this.personas.delete(id);
    
    if (result) {
      // Update any sessions using this persona to the default
      const defaultPersona = this.getDefaultPersona();
      
      // Convert entries to array first to avoid TypeScript iteration error
      Array.from(this.currentSessionPersonas.entries()).forEach(([sessionId, personaId]) => {
        if (personaId === id) {
          this.currentSessionPersonas.set(sessionId, defaultPersona.id);
        }
      });
      
      this.saveToFile();
    }
    
    return result;
  }
  
  /**
   * Set the active persona for a session
   */
  setSessionPersona(sessionId: string, personaId: string): boolean {
    const persona = this.personas.get(personaId);
    
    if (!persona) {
      return false;
    }
    
    this.currentSessionPersonas.set(sessionId, personaId);
    return true;
  }
  
  /**
   * Set a custom persona for a session
   */
  setSessionCustomPersona(sessionId: string, customPrompt: string): string {
    // Create a new temporary persona for this session
    const customPersonaId = `custom-${sessionId}`;
    
    const customPersona: Persona = {
      id: customPersonaId,
      name: 'Custom Persona',
      description: 'A custom persona created specifically for this session.',
      systemPrompt: customPrompt
    };
    
    // Store the custom persona
    this.personas.set(customPersonaId, customPersona);
    
    // Associate it with the session
    this.currentSessionPersonas.set(sessionId, customPersonaId);
    
    return customPersonaId;
  }
  
  /**
   * Get the active persona for a session
   */
  getSessionPersona(sessionId: string): Persona {
    const personaId = this.currentSessionPersonas.get(sessionId);
    
    if (personaId) {
      const persona = this.personas.get(personaId);
      if (persona) {
        return persona;
      }
    }
    
    // Fall back to default persona if none set or not found
    return this.getDefaultPersona();
  }
  
  /**
   * Clear the custom persona for a session
   */
  clearSessionCustomPersona(sessionId: string): void {
    const personaId = this.currentSessionPersonas.get(sessionId);
    
    if (personaId && personaId.startsWith('custom-')) {
      // Remove from personas map if it's a custom one
      this.personas.delete(personaId);
    }
    
    // Reset to default by deleting the entry
    this.currentSessionPersonas.delete(sessionId);
  }
  
  /**
   * Get system prompt for a session
   */
  getSystemPromptForSession(sessionId: string): string {
    const persona = this.getSessionPersona(sessionId);
    return persona.systemPrompt;
  }
}

export const personaManager = new PersonaManager();