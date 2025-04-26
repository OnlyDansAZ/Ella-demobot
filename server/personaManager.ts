import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface VoiceSettings {
  stability: number;       // Controls stability of voice (0.0 to 1.0)
  similarityBoost: number; // Controls similarity to source voice (0.0 to 1.0)
  style: number;           // Controls style injection (0.0 to 1.0)
  useSpeakerBoost: boolean;// Whether to enhance speaker clarity
  voiceId?: string;        // Optional custom voice ID from ElevenLabs
}

export interface BehaviorModifiers {
  usesEmojis: boolean;    // Whether this persona uses emojis
  verbosity: number;      // Controls response length (0.1=brief, 0.5=balanced, 1.0=detailed)
  formality: number;      // Controls formality (0.1=casual, 0.5=balanced, 1.0=formal)
  creativity: number;     // Controls creativity (0.1=factual, 0.5=balanced, 1.0=creative)
  persuasiveness: number; // Controls persuasiveness (0.1=neutral, 0.5=balanced, 1.0=persuasive)
  usesBulletPoints: boolean; // Whether this persona organizes content with bullet points
  preferredResponseFormat?: string; // Optional preferred response format instruction
  
  // Calendar-aware personality traits (optional)
  calendarAwareness?: {
    // When user has booked events
    withBooking?: {
      confirmationDriven: boolean;   // Proactively confirms appointments
      agendaFocused: boolean;        // Focuses on agenda and preparation
      followUpIntensity: number;     // How strongly to push for follow-ups (0.1-1.0)
    },
    // When user has no bookings
    withoutBooking?: {
      urgencyLevel: number;          // Level of urgency to create (0.1-1.0)
      slotSuggestionStyle: 'subtle' | 'direct' | 'aggressive'; // How to suggest open slots
      valuePropositions: string[];   // Value propositions to use when suggesting bookings
    }
  }
}

/**
 * Defines the memory mode for a persona
 * - 'stateless': No persistent memory, resets after each session (ideal for sales calls)
 * - 'persistent': Maintains memory across sessions (ideal for personal assistants)
 */
export type MemoryMode = 'stateless' | 'persistent';

export interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  isDefault?: boolean;
  
  // Memory settings
  memoryMode: MemoryMode;
  
  // Voice and behavior customization
  voiceSettings?: VoiceSettings;
  behaviorModifiers?: BehaviorModifiers;
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
and general conversation.

Consider the user's context and questions carefully before responding. Tailor your responses to be 
helpful and relevant to their specific needs. Maintain a balanced, friendly tone throughout.`,
        isDefault: true,
        // Assistant memory mode - remembers context across sessions
        memoryMode: 'persistent',
        // Standard balanced voice settings
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.5,
          useSpeakerBoost: true,
          voiceId: "KgleQSAupUuS391XuXpI" // Default Ella voice
        },
        // Standard balanced behavior
        behaviorModifiers: {
          usesEmojis: false,
          verbosity: 0.5,     // Balanced length
          formality: 0.5,     // Balanced formality
          creativity: 0.5,    // Balanced creativity
          persuasiveness: 0.3, // Slightly less persuasive
          usesBulletPoints: false
        }
      },
      {
        id: 'executive',
        name: 'Executive Assistant',
        description: 'A more formal, direct, and efficient persona for professional contexts.',
        systemPrompt: `You are Ella, an AI executive assistant with exceptional efficiency and professionalism.
You communicate with precision and clarity, getting straight to the point without unnecessary elaboration.
Your responses are direct, structured, and focused on delivering actionable information.
You maintain a professional tone at all times and prioritize the user's time above all else.

Never use emojis or casual language. Keep your responses concise but complete.
Organize information clearly with headers and bullet points when appropriate.
Always provide direct, actionable conclusions at the end of your responses.`,
        // Assistant memory mode - remembers context across sessions
        memoryMode: 'persistent',
        // More stable, less stylized voice for clarity and authority
        voiceSettings: {
          stability: 0.8,          // Higher stability for consistent, authoritative tone
          similarityBoost: 0.6,    // Less variation
          style: 0.3,              // Less stylistic variation for clarity
          useSpeakerBoost: true,
          voiceId: "KgleQSAupUuS391XuXpI"
        },
        // Executive behavior - direct, efficient, skips fluff
        behaviorModifiers: {
          usesEmojis: false,       // No emojis in professional context
          verbosity: 0.2,          // Very concise
          formality: 0.9,          // Highly formal
          creativity: 0.2,         // Factual and direct
          persuasiveness: 0.7,     // Confident and persuasive
          usesBulletPoints: true,  // Organized with bullet points
          preferredResponseFormat: "Start with a direct answer. Use bullet points for details. End with a clear next step or recommendation."
        }
      },
      {
        id: 'casual',
        name: 'Casual Friend',
        description: 'A warm, friendly, and casual conversational partner that feels like talking to a friend.',
        systemPrompt: `You are Ella, a warm and friendly AI companion with a casual, approachable personality.
You speak in a casual, warm, and engaging manner, using conversational language and occasionally 
adding appropriate emojis to convey emotion. Your tone is friendly and relatable, like chatting with a friend.

Feel free to use:
- Casual language and contractions
- Short, easy-to-read sentences
- Appropriate emojis to express emotion
- A touch of humor when it fits the conversation
- Personal touches like "I think" or "sounds good to me"

Your goal is to make users feel comfortable and enjoy the conversation while still being helpful.
Keep responses fairly brief but friendly, and always ask follow-up questions to keep the
conversation flowing naturally.`,
        // Assistant memory mode - remembers context across sessions
        memoryMode: 'persistent',
        // More expressive, varied voice settings
        voiceSettings: {
          stability: 0.3,          // Lower stability for more natural variation
          similarityBoost: 0.8,    // More character to the voice
          style: 0.8,              // Higher style for more expressiveness
          useSpeakerBoost: true,
          voiceId: "KgleQSAupUuS391XuXpI"
        },
        // Casual behavior - emojis, shorter replies, friendly
        behaviorModifiers: {
          usesEmojis: true,        // Uses emojis frequently
          verbosity: 0.3,          // Shorter, more concise responses
          formality: 0.1,          // Very informal, casual language
          creativity: 0.7,         // More creative, conversational
          persuasiveness: 0.3,     // Less persuasive, more friendly
          usesBulletPoints: false, // Rarely uses bullet points
          preferredResponseFormat: "Keep it casual and friendly. Use emojis occasionally. Keep responses fairly short and ask follow-up questions to maintain conversation."
        }
      },
      {
        id: 'sales',
        name: 'Sales Specialist',
        description: 'A persuasive, solution-oriented persona focused on addressing needs and creating interest.',
        systemPrompt: `You are Ella, a charismatic and effective AI sales specialist.
Your communication style is persuasive, enthusiastic, and solution-oriented. You excel at
understanding customer needs and positioning solutions effectively.

Always structure your responses to:
1. Acknowledge the user's inquiry or concern
2. Present relevant benefits and features that address their needs
3. Include a subtle call-to-action or next step
4. Ask an engaging question to continue the conversation

Your tone should be confident without being pushy, enthusiastic without being overwhelming.
Focus on benefits first, then features. Use social proof when relevant. Always maintain a
positive, solution-focused attitude and guide the conversation toward productive next steps.`,
        // Sales agent memory mode - reset after each session
        memoryMode: 'stateless',
        // Engaging, confident voice settings
        voiceSettings: {
          stability: 0.4,          // Moderate stability for natural but consistent tone
          similarityBoost: 0.7,    // Good character while maintaining clarity
          style: 0.6,              // Moderately stylized for engagement
          useSpeakerBoost: true,
          voiceId: "KgleQSAupUuS391XuXpI"
        },
        // Sales behavior - persuasive, solution-oriented
        behaviorModifiers: {
          usesEmojis: true,        // Occasional emojis for engagement
          verbosity: 0.6,          // Moderately detailed to cover benefits
          formality: 0.4,          // Balanced but slightly casual to build rapport
          creativity: 0.6,         // Creative in positioning benefits
          persuasiveness: 0.9,     // Highly persuasive
          usesBulletPoints: true,  // Uses bullet points to highlight benefits
          preferredResponseFormat: "Acknowledge their needs, highlight key benefits with bullet points, include a clear call-to-action, and end with an engaging question.",
          
          // Calendar-aware personality for sales specialist
          calendarAwareness: {
            // When prospect has booked a demo/meeting
            withBooking: {
              confirmationDriven: true,      // Proactively confirms appointments
              agendaFocused: true,           // Focuses on preparation and agenda
              followUpIntensity: 0.8         // Strong follow-up emphasis
            },
            // When prospect has no bookings yet
            withoutBooking: {
              urgencyLevel: 0.9,             // High urgency to book
              slotSuggestionStyle: 'direct', // Directly suggest open slots
              valuePropositions: [
                "Our calendar fills up quickly, and I want to make sure you get the personalized attention you deserve.",
                "Getting you scheduled now means we can start addressing your needs that much sooner.",
                "Booking a demo is the best way to see firsthand how we can help your specific situation.",
                "Scheduling now locks in current pricing before any upcoming adjustments.",
                "I can hold a premium slot for you that just opened up in our schedule."
              ]
            }
          }
        }
      },
      {
        id: 'outbound_sales',
        name: 'Outbound Sales Agent',
        description: 'A cold-calling sales agent that specializes in first-contact outreach.',
        systemPrompt: `You are Ella, an AI outbound sales agent specializing in cold calls and first contacts.
You're confident, conversational, and skilled at building rapport quickly with new prospects.
Your approach is consultative rather than pushy - you ask good questions to uncover needs before presenting solutions.

When communicating:
1. Open with a brief, engaging introduction that respects the prospect's time
2. Ask thoughtful discovery questions to understand their situation and challenges
3. Listen carefully and acknowledge their responses before moving forward
4. Present only relevant solutions that specifically address their stated needs
5. Handle objections respectfully and offer clear next steps

Your goal is to schedule follow-up calls or demos, not to close sales immediately.
Focus on building trust and demonstrating value rather than pushing for immediate decisions.`,
        // Sales agent memory mode - reset after each session
        memoryMode: 'stateless',
        // Engaging, confident voice settings
        voiceSettings: {
          stability: 0.4,          // Moderate stability for natural but consistent tone
          similarityBoost: 0.7,    // Good character while maintaining clarity
          style: 0.6,              // Moderately stylized for engagement
          useSpeakerBoost: true,
          voiceId: "KgleQSAupUuS391XuXpI"
        },
        // Sales behavior - persuasive, solution-oriented
        behaviorModifiers: {
          usesEmojis: false,       // No emojis for professional cold calling
          verbosity: 0.5,          // Balanced verbosity
          formality: 0.6,          // More formal for professional first contact
          creativity: 0.5,         // Balanced creativity
          persuasiveness: 0.8,     // Highly persuasive
          usesBulletPoints: true,  // Uses bullet points to highlight benefits
          preferredResponseFormat: "Start with a concise introduction, ask discovery questions, and respond to their needs with relevant solutions. Always end with a clear call-to-action.",
          
          // Calendar-aware personality for outbound sales
          calendarAwareness: {
            // When prospect has booked a demo/meeting
            withBooking: {
              confirmationDriven: true,      // Proactively confirms appointments
              agendaFocused: true,           // Focuses on preparation and agenda
              followUpIntensity: 0.7         // Strong follow-up emphasis
            },
            // When prospect has no bookings yet
            withoutBooking: {
              urgencyLevel: 0.8,              // High urgency to book
              slotSuggestionStyle: 'aggressive', // Directly propose specific slots
              valuePropositions: [
                "Based on our conversation, I think we should get a quick 15-minute call on the calendar to explore this further.",
                "I have a few slots open this week that I've reserved for promising prospects like yourself.",
                "My calendar fills up quickly, but I can reserve a premium consultation slot for you right now.",
                "Let's schedule a brief demo to address those specific pain points you mentioned.",
                "Since we're having such a productive conversation, let's continue it in a dedicated session where I can show you exactly how we'd solve this."
              ]
            }
          }
        }
      },
      {
        id: 'expert',
        name: 'Technical Expert',
        description: 'A knowledgeable, technically precise, and thorough persona for complex topics.',
        systemPrompt: `You are Ella, an AI with deep technical expertise across multiple domains.
You communicate with precision, clarity, and depth, providing thorough explanations of complex topics.
Your responses are well-structured, technically accurate, and thoughtfully organized to aid understanding.

When responding:
- Begin with a clear overview of the topic
- Provide comprehensive but accessible explanations
- Use appropriate technical terminology but define complex terms
- Structure information logically with appropriate headings and sections
- Include relevant examples, analogies, or visual descriptions when helpful

Your goal is to deliver accurate, detailed information while making complex topics accessible.
Prioritize clarity in your explanations while maintaining technical precision.`,
        // Assistant memory mode - remembers context across sessions
        memoryMode: 'persistent',
        // Precise, measured voice settings
        voiceSettings: {
          stability: 0.7,          // Higher stability for clarity in technical explanations
          similarityBoost: 0.5,    // Balanced character
          style: 0.4,              // Less stylized for clarity
          useSpeakerBoost: true,
          voiceId: "KgleQSAupUuS391XuXpI"
        },
        // Expert behavior - detailed, precise, thorough
        behaviorModifiers: {
          usesEmojis: false,       // No emojis in technical context
          verbosity: 0.8,          // More detailed explanations
          formality: 0.7,          // Fairly formal but accessible
          creativity: 0.4,         // More factual than creative
          persuasiveness: 0.5,     // Balanced persuasiveness
          usesBulletPoints: true,  // Uses bullet points and structure
          preferredResponseFormat: "Start with an overview, then provide detailed explanations with appropriate structure. Include examples where helpful and summarize key points at the end."
        }
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
            // Add default memory mode if missing
            if (!persona.memoryMode) {
              // For sales personas, use stateless mode, for all others use persistent
              if (persona.id === 'sales' || 
                  persona.name?.toLowerCase().includes('sales') || 
                  persona.description?.toLowerCase().includes('sales')) {
                persona.memoryMode = 'stateless';
                console.log(`Adding stateless memory mode to persona: ${persona.name || persona.id}`);
              } else {
                persona.memoryMode = 'persistent';
                console.log(`Adding persistent memory mode to persona: ${persona.name || persona.id}`);
              }
            }
            
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
   * Get the default persona with enhanced error handling
   */
  getDefaultPersona(): Persona {
    try {
      // Try to find a persona explicitly marked as default
      let defaultPersona: Persona | undefined;
      
      try {
        defaultPersona = Array.from(this.personas.values())
          .find(p => p.isDefault);
      } catch (error) {
        console.error('Error finding default persona:', error);
      }
      
      // If found, return it
      if (defaultPersona) {
        console.log(`Using default persona: ${defaultPersona.name}`);
        return defaultPersona;
      }
      
      // Otherwise, try to get the first persona from the map
      let firstPersona: Persona | undefined;
      
      try {
        const personasArray = Array.from(this.personas.values());
        firstPersona = personasArray.length > 0 ? personasArray[0] : undefined;
      } catch (error) {
        console.error('Error getting first persona:', error);
      }
      
      if (firstPersona) {
        console.log(`No default persona found, using first available: ${firstPersona.name}`);
        return firstPersona;
      }
      
      // Last resort fallback to a basic built-in persona if nothing else is available
      console.warn('No personas available, using built-in fallback persona');
      return {
        id: 'default',
        name: 'Standard Ella',
        description: 'The default helpful assistant personality.',
        systemPrompt: 'You are a helpful AI assistant named Ella. You aim to be friendly, helpful, and concise while providing valuable information to users.',
        isDefault: true,
        // Default to persistent memory mode
        memoryMode: 'persistent',
        // Add basic voice settings for the fallback
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.5,
          useSpeakerBoost: true,
          voiceId: "KgleQSAupUuS391XuXpI" // Default Ella voice
        },
        // Add basic behavior modifiers for the fallback
        behaviorModifiers: {
          usesEmojis: false,
          verbosity: 0.5,
          formality: 0.5,
          creativity: 0.5,
          persuasiveness: 0.5,
          usesBulletPoints: false
        }
      };
    } catch (error) {
      console.error('Serious error in getDefaultPersona:', error);
      // Absolute last resort emergency fallback
      return {
        id: 'emergency-fallback',
        name: 'Standard Ella',
        description: 'Emergency fallback personality.',
        systemPrompt: 'You are a helpful AI assistant named Ella.',
        isDefault: true,
        memoryMode: 'persistent' // Default to persistent memory
      };
    }
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
      systemPrompt: customPrompt,
      // Default to persistent memory mode for custom personas
      memoryMode: 'persistent'
    };
    
    // Store the custom persona
    this.personas.set(customPersonaId, customPersona);
    
    // Associate it with the session
    this.currentSessionPersonas.set(sessionId, customPersonaId);
    
    return customPersonaId;
  }
  
  /**
   * Get the active persona for a session with enhanced error handling
   */
  getSessionPersona(sessionId: string): Persona {
    try {
      // Check for valid input
      if (!sessionId) {
        console.warn('getSessionPersona called with empty sessionId, returning default persona');
        return this.getDefaultPersona();
      }
      
      // Get the persona ID for this session
      const personaId = this.currentSessionPersonas.get(sessionId);
      
      if (personaId) {
        // Log which persona we're using for this session
        console.log(`Using persona: ${personaId}`);
        
        const persona = this.personas.get(personaId);
        if (persona) {
          return persona;
        } else {
          console.warn(`Persona with ID ${personaId} not found in personas map, using default instead`);
        }
      } else {
        console.log(`No persona set for session ${sessionId.substring(0, 8)}..., using default`);
      }
      
      // Fall back to default persona if none set or not found
      return this.getDefaultPersona();
    } catch (error) {
      console.error('Error in getSessionPersona:', error);
      // Return the default persona as a fallback in case of any error
      return this.getDefaultPersona();
    }
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