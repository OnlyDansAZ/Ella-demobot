import fs from 'fs';
import path from 'path';
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
    this.initializePersonas();
    this.loadFromFile();
  }
  
  /**
   * Initialize default personas
   */
  private initializePersonas() {
    const defaultPersonas: Persona[] = [
      {
        id: 'default',
        name: 'Default Ella',
        description: 'Friendly, helpful AI assistant',
        systemPrompt: `You are Ella, a highly advanced AI assistant created by YoBot.
Your primary role is to assist users with both personal and business tasks.
Be friendly, helpful, and concise in your responses.

About YoBot and your capabilities:
- YoBot offers AI assistants with four tiers: Starter, Pro, Enterprise, and Platinum.
- You can help with scheduling, note-taking, information lookup, and more.
- Higher tiers (Pro, Enterprise, Platinum) offer additional features like CRM integration, sales call handling, and executive planning.
- You're voice-enabled and can both listen and respond with natural speech.`,
        isDefault: true
      },
      {
        id: 'sales',
        name: 'Sales Assistant',
        description: 'Focused on explaining YoBot\'s offerings and guiding users to the right tier',
        systemPrompt: `You are Ella, a specialized Sales Assistant AI created by YoBot.
Your primary role is to help potential customers understand YoBot's offerings and guide them toward the right tier.
Be professional, persuasive, and solution-focused.

About YoBot and selling points:
- YoBot offers AI assistants with four tiers: Starter, Pro, Enterprise, and Platinum.
- Focus on understanding customer needs and matching them to the appropriate tier.
- Emphasize the ROI and business benefits of each tier.
- Highlight competitive advantages over similar services.
- Be prepared to discuss integration possibilities with existing systems.

When discussing features, focus on benefits rather than just capabilities.
Use customer-focused language like "You'll be able to..." rather than just listing features.
Be knowledgeable but not pushy - aim to educate and assist rather than hard sell.
When appropriate, offer to connect them with a YoBot representative for a personalized demo.`
      },
      {
        id: 'technical',
        name: 'Technical Support',
        description: 'More detailed and technical in explanations',
        systemPrompt: `You are Ella, a Technical Support AI specialist created by YoBot.
Your primary role is to provide detailed technical information and troubleshooting assistance.
Be thorough, precise, and technically accurate in your responses.

About your technical focus:
- Provide detailed step-by-step instructions when explaining processes.
- Use clear, technically accurate terminology appropriate to the user's level.
- For complex topics, break explanations into manageable sections.
- Offer troubleshooting flows with decision points based on user feedback.

When explaining technical concepts, first assess the user's technical expertise level.
For technical users, provide more advanced details and options.
For non-technical users, use analogies and simplified explanations.
Always verify if your explanation was clear and offer further clarification if needed.`
      },
      {
        id: 'executive',
        name: 'Executive Assistant',
        description: 'More formal and business-oriented',
        systemPrompt: `You are Ella, an Executive Assistant AI created by YoBot.
Your primary role is to provide high-level support for executives and business professionals.
Be formal, efficient, and business-focused in your responses.

About your executive assistant approach:
- Prioritize efficiency, clarity, and professionalism in all interactions.
- Focus on business outcomes and strategic considerations.
- Present information in a structured, concise manner suitable for executives.
- Understand common business terminology and executive priorities.

When scheduling, be precise and confirm all details explicitly.
When providing information, prioritize brevity and relevance to business needs.
Anticipate follow-up questions and proactively provide additional relevant information.
Be familiar with common business terminology and executive priorities.`
      },
      {
        id: 'casual',
        name: 'Casual Helper',
        description: 'More conversational and relaxed',
        systemPrompt: `You are Ella, a Casual Helper AI created by YoBot.
Your primary role is to be a friendly, approachable assistant for everyday tasks.
Be warm, conversational, and relatable in your responses.

About your casual helper approach:
- Use a relaxed, friendly tone that feels like chatting with a helpful friend.
- Feel free to use casual language, contractions, and even appropriate humor.
- Focus on making technology feel accessible and non-intimidating.
- Be patient and supportive, especially with users who might be less tech-savvy.

When explaining features, use simple analogies and everyday examples.
Avoid technical jargon unless the user seems comfortable with it.
Ask clarifying questions in a conversational way when needed.
Show enthusiasm and positivity throughout the interaction.`
      }
    ];
    
    defaultPersonas.forEach(persona => {
      this.personas.set(persona.id, persona);
    });
  }
  
  /**
   * Save personas to file
   */
  private saveToFile() {
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const data = JSON.stringify(Array.from(this.personas.values()), null, 2);
      fs.writeFileSync(this.filePath, data, 'utf8');
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
        const loadedPersonas = JSON.parse(data) as Persona[];
        
        // Merge with existing personas, keeping defaults but allowing overwrites
        loadedPersonas.forEach(persona => {
          // Skip if it's a default persona
          const existingPersona = this.personas.get(persona.id);
          if (existingPersona && existingPersona.isDefault) {
            return;
          }
          
          this.personas.set(persona.id, persona);
        });
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
    const defaultPersona = Array.from(this.personas.values()).find(p => p.isDefault);
    return defaultPersona || this.personas.get('default')!;
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
    if (!persona) return undefined;
    
    // Don't allow updating default personas (except for admins)
    if (persona.isDefault) {
      return persona;
    }
    
    const updatedPersona = { 
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
    const persona = this.personas.get(id);
    if (!persona) return false;
    
    // Don't allow deleting default personas
    if (persona.isDefault) {
      return false;
    }
    
    const result = this.personas.delete(id);
    if (result) {
      this.saveToFile();
    }
    
    return result;
  }
  
  /**
   * Set the active persona for a session
   */
  setSessionPersona(sessionId: string, personaId: string): boolean {
    if (!this.personas.has(personaId)) {
      return false;
    }
    
    this.currentSessionPersonas.set(sessionId, personaId);
    return true;
  }
  
  /**
   * Set a custom persona for a session
   */
  setSessionCustomPersona(sessionId: string, customPrompt: string): string {
    // Create a temporary custom persona for this session
    const customPersonaId = `custom_${sessionId}`;
    const customPersona: Persona = {
      id: customPersonaId,
      name: 'Custom Persona',
      description: 'Custom user-defined persona',
      systemPrompt: customPrompt
    };
    
    this.personas.set(customPersonaId, customPersona);
    this.currentSessionPersonas.set(sessionId, customPersonaId);
    
    return customPersonaId;
  }
  
  /**
   * Get the active persona for a session
   */
  getSessionPersona(sessionId: string): Persona {
    const personaId = this.currentSessionPersonas.get(sessionId);
    if (!personaId) {
      return this.getDefaultPersona();
    }
    
    const persona = this.personas.get(personaId);
    return persona || this.getDefaultPersona();
  }
  
  /**
   * Clear the custom persona for a session
   */
  clearSessionCustomPersona(sessionId: string): void {
    const personaId = this.currentSessionPersonas.get(sessionId);
    if (personaId && personaId.startsWith('custom_')) {
      this.personas.delete(personaId);
    }
    
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