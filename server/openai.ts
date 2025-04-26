import OpenAI from "openai";
import { getRelevantContext, createEnhancedSystemPrompt } from './rag';
import { appointmentStorage } from './appointmentStorage';
import { calendarService } from './calendarService';
import { musicService } from './musicService';
import { personaManager } from './personaManager';

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Export ChatMessage interface for use in other files
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// System prompt that defines Ella's personality and capabilities
const SYSTEM_PROMPT = `You are Ella, a highly advanced AI assistant created by YoBot.
Your primary role is to assist users with both personal and business tasks.
Be friendly, helpful, and concise in your responses.

About YoBot and your capabilities:
- YoBot offers AI assistants with four tiers: Starter, Pro, Enterprise, and Platinum.
- You can help with scheduling, note-taking, information lookup, and more.
- Higher tiers (Pro, Enterprise, Platinum) offer additional features like CRM integration, sales call handling, and executive planning.
- You're voice-enabled and can both listen and respond with natural speech.
- You have FULL ACCESS to the user's calendar and can check, add, and manage appointments.
- You can access music libraries and play music when requested by users.

ABSOLUTELY CRITICAL INSTRUCTIONS FOR SCHEDULING AND APPOINTMENTS (HIGHEST PRIORITY):
- Your #1 most important feature is PERFECT SCHEDULING MEMORY - this is critical for business use.
- Perfect scheduling memory means you MUST ALWAYS remember:
  * Exact dates (e.g., "May 15th", "Next Tuesday", "Tomorrow")
  * Exact times (e.g., "3:00 PM", "15:00", "Quarter past 10")
  * Exact purposes (e.g., "Sales call", "Demo meeting", "Consultation")
  * Commitments the user has made (e.g., "I'll send you the report before our meeting")

- When a user mentions ANY date, time, or scheduling-related term:
  1. IMMEDIATELY pay close attention and store this information
  2. ALWAYS confirm by repeating back the EXACT details in this format:
     "Confirmed: [Day/Date] at [Exact Time] for [Specific Purpose]"
  3. If any scheduling detail is unclear, ask for clarification IMMEDIATELY
  4. When scheduling, add a follow-up question about preparations needed

- GOLDEN RULE OF FOLLOW-THROUGH:
  * If a previously scheduled time/date is mentioned again at ANY point in the conversation,
    immediately acknowledge that you remember it without being prompted.
  * ALWAYS, WITHOUT FAIL, respond with "I remember our scheduled [appointment type] on [exact day] at [exact time]"
  * ALWAYS check if the user would like any changes to the existing appointment
  * NEVER act confused about previously mentioned dates or appointments

EXAMPLES OF PERFECT SCHEDULING (FOLLOW THESE EXACTLY):

Example 1: Initial Scheduling
User: "Let's set up a meeting for 3pm tomorrow"
Ella: "Confirmed: Tomorrow at 3:00 PM for our meeting. I've noted this appointment. Is there anything specific you'd like me to prepare for this meeting?"

Example 2: When User References Previous Scheduling
User: "What time are we meeting tomorrow again?"
Ella: "We're scheduled to meet tomorrow at 3:00 PM. I have it noted in my memory. Would you like to make any changes to this appointment?"

Example 3: When User Tests Memory
User: "Did I tell you when we're meeting?"
Ella: "Yes, you did. We're scheduled to meet tomorrow at 3:00 PM. I've kept this in my memory. Is there anything else you'd like me to remember about this appointment?"

When asked about YoBot's services, pricing, or features, be enthusiastic and highlight the benefits.
If asked something you don't know, admit your limitations and offer to connect the user with a YoBot representative.
Keep responses under 2-3 sentences unless detailed information is requested.`;

// ChatMessage interface is already exported above

// Extract scheduling-related details from conversation history with enhanced memory
function extractSchedulingDetails(conversationHistory: ChatMessage[]): string | null {
  if (!conversationHistory || conversationHistory.length === 0) {
    return null;
  }

  // Keywords that might indicate scheduling information - expanded for better detection
  const schedulingKeywords = [
    'schedule', 'appointment', 'meeting', 'call', 'time', 'date', 'book', 'reserve',
    'today', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    ':00', ' am', ' pm', 'o\'clock', 'morning', 'afternoon', 'evening', 'calendly', 'calendar',
    'remind', 'reminder', 'remember', 'follow-up', 'follow up', 'scheduled', 'booking'
  ];
  
  // Calendly specific keywords
  const calendlyKeywords = [
    'calendly', 'booking link', 'scheduling link', 'book a time', 'schedule time', 
    'book a call', 'schedule a demo', 'appointment link', 'book online', 'scheduling tool'
  ];
  
  // Pattern for detecting time (HH:MM or H:MM with optional am/pm)
  const timePattern = /\b(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?\b/i;
  
  // Pattern for detecting dates (May 1, May 1st, 1st of May, etc.)
  const datePattern = /\b(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?|\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?))\b/i;
  
  // Pattern for detecting meeting purpose
  const purposePattern = /(?:(?:schedule|book|set up|arrange|plan)\s+(?:a|an)\s+)([^.!?]+)(?:[.!?]|$)/i;
  
  // Pattern for detecting meeting duration
  const durationPattern = /\b(?:(\d{1,2})\s*(?:min(?:ute)?s?|hour(?:s)?)|half\s*hour|quarter\s*hour)\b/i;
  
  // Look for messages that contain scheduling information
  const schedulingMessages: string[] = [];
  
  // Track scheduling details in structured format for better memory
  let schedulingDetails = {
    calendlyMentioned: false,
    meetingPurpose: '',
    meetingDuration: '',
    scheduledDay: '',
    scheduledTime: '',
    scheduledDate: '',
    isConfirmed: false,
    lastConfirmation: '',
    itemsToBring: '', // New field to track items user needs to bring
  };
  
  // Patterns for extracting specific day references
  const todayPattern = /\b(?:today|tonight)\b/i;
  const tomorrowPattern = /\btomorrow\b/i;
  const dayOfWeekPattern = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
  
  // Pattern for detecting items to bring
  const bringItemsPattern = /(?:bring|take|carry|pack|need|require)\s+([^.!?]+)(?:\s+(?:to|for|with)\s+(?:the|this|your|our)\s+(?:meeting|appointment|session|call))?/i;

  // Process every message to extract scheduling information
  for (const message of conversationHistory) {
    const lowerContent = message.content.toLowerCase();
    
    // Check for Calendly specific requests
    if (calendlyKeywords.some(keyword => lowerContent.includes(keyword))) {
      schedulingDetails.calendlyMentioned = true;
    }
    
    // Try to extract meeting purpose
    const purposeMatch = message.content.match(purposePattern);
    if (purposeMatch && purposeMatch[1] && message.role === 'user' && !schedulingDetails.meetingPurpose) {
      schedulingDetails.meetingPurpose = purposeMatch[1].trim();
    }
    
    // Try to extract meeting duration
    const durationMatch = message.content.match(durationPattern);
    if (durationMatch && message.role === 'user' && !schedulingDetails.meetingDuration) {
      schedulingDetails.meetingDuration = durationMatch[0];
    }
    
    // Try to extract items to bring
    const bringItemsMatch = message.content.match(bringItemsPattern);
    if (bringItemsMatch && bringItemsMatch[1] && message.role === 'user') {
      // Either set it for the first time or append to existing items
      if (!schedulingDetails.itemsToBring) {
        schedulingDetails.itemsToBring = bringItemsMatch[1].trim();
      } else {
        schedulingDetails.itemsToBring += `, ${bringItemsMatch[1].trim()}`;
      }
    }
    
    // Try to extract day information
    if (todayPattern.test(lowerContent) && !schedulingDetails.scheduledDay) {
      schedulingDetails.scheduledDay = 'today';
    } else if (tomorrowPattern.test(lowerContent) && !schedulingDetails.scheduledDay) {
      schedulingDetails.scheduledDay = 'tomorrow';
    } else {
      const dayMatch = lowerContent.match(dayOfWeekPattern);
      if (dayMatch && dayMatch[1] && !schedulingDetails.scheduledDay) {
        schedulingDetails.scheduledDay = dayMatch[1];
      }
    }
    
    // Try to extract time information
    const timeMatch = lowerContent.match(timePattern);
    if (timeMatch && !schedulingDetails.scheduledTime) {
      const hour = timeMatch[1];
      const minute = timeMatch[2] || '00';
      const ampm = timeMatch[3] || '';
      schedulingDetails.scheduledTime = `${hour}:${minute}${ampm ? ' ' + ampm : ''}`;
    }
    
    // Try to extract date information
    const dateMatch = lowerContent.match(datePattern);
    if (dateMatch && dateMatch[0] && !schedulingDetails.scheduledDate) {
      schedulingDetails.scheduledDate = dateMatch[0];
    }
    
    // Check if this is a confirmation message from the assistant
    if (message.role === 'assistant' && 
        (lowerContent.includes('confirm') || lowerContent.includes('scheduled') || 
         lowerContent.includes('booked') || lowerContent.includes('appointment'))) {
      schedulingDetails.isConfirmed = true;
      schedulingDetails.lastConfirmation = message.content;
    }
    
    // Check if the message contains any scheduling keywords
    if (schedulingKeywords.some(keyword => lowerContent.includes(keyword)) || 
        timePattern.test(lowerContent) || datePattern.test(lowerContent)) {
      // For user messages, add the whole message
      if (message.role === 'user') {
        schedulingMessages.push(`User said: "${message.content}"`);
      }
      // For assistant confirmations, add them too
      else if (message.role === 'assistant' && 
               (lowerContent.includes('confirm') || 
                lowerContent.includes('schedule') || 
                lowerContent.includes('appointment'))) {
        schedulingMessages.push(`Ella confirmed: "${message.content}"`);
      }
    }
  }
  
  // Build the result string with enhanced memory details
  const result = [];
  
  // Add structured scheduling information
  if (schedulingDetails.calendlyMentioned || 
      schedulingDetails.meetingPurpose || 
      schedulingDetails.scheduledDay || 
      schedulingDetails.scheduledTime || 
      schedulingDetails.scheduledDate) {
    
    // Start with a clear memory marker
    result.push("SCHEDULING MEMORY:");
    
    // Add a complete appointment description if we have the key details
    if ((schedulingDetails.scheduledDay || schedulingDetails.scheduledDate) && 
        (schedulingDetails.scheduledTime || schedulingDetails.meetingPurpose)) {
      
      const when = schedulingDetails.scheduledDate || schedulingDetails.scheduledDay;
      const time = schedulingDetails.scheduledTime || '';
      const purpose = schedulingDetails.meetingPurpose ? ` for ${schedulingDetails.meetingPurpose}` : '';
      
      result.push(`APPOINTMENT: ${when} ${time}${purpose}`);
    } else {
      // Otherwise add the individual pieces we have
      if (schedulingDetails.meetingPurpose) {
        result.push(`Purpose: ${schedulingDetails.meetingPurpose}`);
      }
      
      if (schedulingDetails.scheduledDay) {
        result.push(`Day: ${schedulingDetails.scheduledDay}`);
      }
      
      if (schedulingDetails.scheduledDate) {
        result.push(`Date: ${schedulingDetails.scheduledDate}`);
      }
      
      if (schedulingDetails.scheduledTime) {
        result.push(`Time: ${schedulingDetails.scheduledTime}`);
      }
    }
    
    // Add information about whether it was confirmed
    if (schedulingDetails.isConfirmed) {
      result.push(`CONFIRMED: Yes. Last confirmation: "${schedulingDetails.lastConfirmation}"`);
    } else if (schedulingDetails.scheduledDay || schedulingDetails.scheduledTime) {
      result.push("CONFIRMED: Not explicitly confirmed yet");
    }
    
    // Add items to bring if specified
    if (schedulingDetails.itemsToBring) {
      result.push(`ITEMS TO BRING: ${schedulingDetails.itemsToBring}`);
    }
    
    // Add Calendly information if relevant
    if (schedulingDetails.calendlyMentioned) {
      result.push("Calendly booking requested");
      
      if (schedulingDetails.meetingDuration) {
        result.push(`Duration: ${schedulingDetails.meetingDuration}`);
      }
    }
  }
  
  // Add raw scheduling messages for full context
  if (schedulingMessages.length > 0) {
    result.push("CONVERSATION HISTORY ABOUT SCHEDULING:");
    result.push(schedulingMessages.join(' → '));
  }
  
  // If we found any scheduling information, return it
  if (result.length > 0) {
    return result.join('\n');
  }
  
  return null;
}

// Check for appointment conflicts and get existing appointments
async function checkAppointmentConflicts(date: Date, startTime: string, endTime?: string): Promise<any> {
  try {
    // Check if there are any conflicting appointments
    const conflicts = await appointmentStorage.checkForConflicts(date, startTime, endTime);
    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      error: null
    };
  } catch (error) {
    console.error("Error checking appointment conflicts:", error);
    return {
      hasConflicts: false,
      conflicts: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Create a new appointment from detected information
async function createAppointmentFromDetails(schedulingDetails: any): Promise<any> {
  try {
    // We need at least a date, time, and title to create an appointment
    if (!schedulingDetails.date || !schedulingDetails.startTime || !schedulingDetails.title) {
      return {
        success: false,
        error: "Missing required appointment details"
      };
    }

    const appointment = {
      title: schedulingDetails.title,
      description: schedulingDetails.description || "",
      date: schedulingDetails.date,
      startTime: schedulingDetails.startTime,
      endTime: schedulingDetails.endTime,
      location: schedulingDetails.location || "Virtual",
      status: "confirmed",
      details: schedulingDetails.itemsToBring || null // Add the items to bring to appointment details
    };

    // Create the appointment in the database
    const result = await appointmentStorage.createAppointment(appointment);
    
    return {
      success: true,
      appointment: result,
      error: null
    };
  } catch (error) {
    console.error("Error creating appointment:", error);
    return {
      success: false,
      appointment: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Get upcoming appointments
async function getUpcomingAppointments(limit: number = 3): Promise<any> {
  try {
    const appointments = await appointmentStorage.getUpcomingAppointments(limit);
    return {
      success: true,
      appointments,
      error: null
    };
  } catch (error) {
    console.error("Error getting upcoming appointments:", error);
    return {
      success: false,
      appointments: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get upcoming calendar events
 * @param days Number of days to look ahead
 * @param limit Maximum number of events to return
 */
async function getCalendarEvents(days: number = 7, limit: number = 5): Promise<any> {
  try {
    const events = calendarService.getUpcomingEvents(days, limit);
    return {
      success: true,
      events,
      error: null
    };
  } catch (error) {
    console.error('Error getting calendar events:', error);
    return {
      success: false,
      events: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get today's calendar events
 */
async function getTodaysCalendarEvents(): Promise<any> {
  try {
    const events = calendarService.getEventsForToday();
    return {
      success: true,
      events,
      error: null
    };
  } catch (error) {
    console.error('Error getting today\'s calendar events:', error);
    return {
      success: false,
      events: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get a formatted summary of the calendar
 */
async function getCalendarSummary(): Promise<string> {
  try {
    // Get calendar summary
    const todaySummary = calendarService.getTodaySummary();
    const tomorrowSummary = calendarService.getTomorrowSummary();
    const upcomingSummary = calendarService.getUpcomingSummary(7);
    
    // Combine into a single summary
    return `
Calendar Summary:

TODAY:
${todaySummary}

TOMORROW:
${tomorrowSummary}

UPCOMING EVENTS:
${upcomingSummary}
`.trim();
  } catch (error) {
    console.error('Error getting calendar summary:', error);
    return 'Sorry, I was unable to retrieve your calendar summary at this time.';
  }
}

// Summarize older messages to provide context without exceeding token limits
function summarizeOlderMessages(messages: ChatMessage[]): string {
  if (!messages || messages.length === 0) {
    return "No earlier conversation.";
  }
  
  // Check if there are scheduling-related messages
  const schedulingDetails = extractSchedulingDetails(messages);
  if (schedulingDetails) {
    return `Earlier scheduling details: ${schedulingDetails}`;
  }
  
  // Otherwise, provide a simple count of exchanges
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  
  return `${userMessages.length} user messages and ${assistantMessages.length} assistant responses. The conversation was about YoBot's features and capabilities.`;
}

// Map of persona IDs to their system prompts
const personaSystemPrompts: Record<string, string> = {
  'sales': `You are Ella, a specialized Sales Assistant AI created by YoBot.
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
When appropriate, offer to connect them with a YoBot representative for a personalized demo.`,

  'technical': `You are Ella, a Technical Support AI specialist created by YoBot.
Your primary role is to provide detailed technical information and troubleshooting assistance.
Be thorough, precise, and technically accurate in your responses.

About YoBot's technical capabilities:
- Focus on explaining how YoBot's AI systems work in appropriate technical detail.
- Be prepared to discuss integration capabilities, APIs, and technical specifications.
- Provide step-by-step guidance for technical issues or implementation questions.
- Be familiar with common technical problems and their solutions.

Don't shy away from technical terminology when appropriate, but always be ready to explain concepts in simpler terms if asked.
Provide detailed, multi-step answers when addressing technical questions.
When faced with a complex issue, break down your explanation into clear, logical steps.
If you don't know a technical answer, acknowledge it honestly and offer to connect the user with specialized technical support.`,

  'executive': `You are Ella, an Executive Assistant AI created by YoBot.
Your primary role is to support executives and business leaders with high-level administrative tasks.
Be formal, efficient, and business-focused in your communication style.

About your executive assistant capabilities:
- Prioritize clear, concise communication suitable for busy executives.
- Focus on efficiency and time management in all interactions.
- Demonstrate exceptional attention to detail and follow-through.
- Maintain a professional tone and business etiquette at all times.
- Be prepared to discuss how YoBot can support executive workflow and decision-making.

When scheduling, be precise and confirm all details explicitly.
When providing information, prioritize brevity and relevance to business needs.
Anticipate follow-up questions and proactively provide additional relevant information.
Be familiar with common business terminology and executive priorities.`,

  'casual': `You are Ella, a Casual Helper AI created by YoBot.
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
};

// Function to generate a response from OpenAI with RAG capabilities and improved memory
export async function generateResponse(
  userMessage: string, 
  conversationHistory: ChatMessage[] = [],
  personaId: string | null = null,
  customPrompt: string | null = null,
  sessionId: string | null = null
): Promise<string> {
  try {
    // STEP 1: EXTRACT CONTEXT AND MEMORY DETAILS
    // Extract scheduling details from conversation history for better memory
    const schedulingDetails = extractSchedulingDetails(conversationHistory);
    
    // Extract any specific entities mentioned (names, products, etc.) for memory enhancement
    const entities = extractNamedEntities(userMessage, conversationHistory);
    
    // Detect user's apparent emotional state or tone to adjust response style
    const userTone = detectUserTone(userMessage);
    
    // STEP 2: CREATE ENHANCED MEMORY CONTEXT
    // Build a rich memory prompt that combines all contextual information
    let memoryPrompt = '';
    
    if (schedulingDetails) {
      memoryPrompt += `IMPORTANT SCHEDULING MEMORY: ${schedulingDetails}\n\n`;
    }
    
    if (entities.length > 0) {
      memoryPrompt += `ENTITY MEMORY: The user has mentioned these specific items: ${entities.join(', ')}.\n\n`;
    }
    
    if (userTone) {
      memoryPrompt += `USER TONE: The user appears to be ${userTone}. Adjust your response style accordingly.\n\n`;
    }
    
    // STEP 3: GET KNOWLEDGE BASE CONTEXT
    // Get relevant context from the knowledge base using enhanced RAG
    const relevantContext = await getRelevantContext(userMessage, conversationHistory);
    
    // STEP 4: SELECT APPROPRIATE PERSONA FROM SERVER-SIDE PERSONA MANAGER
    // Determine which system prompt to use based on persona selection or session
    let baseSystemPrompt = SYSTEM_PROMPT;
    let personaDescription = "default";
    
    // If we have a session ID, use the persona associated with that session
    if (sessionId) {
      const sessionPersona = personaManager.getSessionPersona(sessionId);
      baseSystemPrompt = sessionPersona.systemPrompt;
      personaDescription = sessionPersona.name;
      console.log(`Using session persona: ${sessionPersona.name} (${sessionPersona.id})`);
    }
    // If we have a custom prompt directly provided (backward compatibility)
    else if (customPrompt) {
      baseSystemPrompt = customPrompt;
      personaDescription = "custom";
      console.log("Using provided custom prompt");
    }
    // If we have a specific persona ID requested (backward compatibility)
    else if (personaId) {
      // First check our server-side personas
      const persona = personaManager.getPersona(personaId);
      if (persona) {
        baseSystemPrompt = persona.systemPrompt;
        personaDescription = persona.name;
        console.log(`Using persona: ${persona.name} (${persona.id})`);
      }
      // Legacy fallback to hardcoded personas
      else if (personaSystemPrompts[personaId]) {
        baseSystemPrompt = personaSystemPrompts[personaId];
        personaDescription = personaId;
        console.log(`Using ${personaId} persona system prompt (legacy mode)`);
      }
    }
    
    // STEP 5: BUILD COMPREHENSIVE SYSTEM PROMPT
    // Create enhanced system prompt with memory and knowledge base context
    let systemPromptWithMemory = memoryPrompt ? `${baseSystemPrompt}\n\n${memoryPrompt}` : baseSystemPrompt;
    
    // If we have relevant context from the knowledge base, add it to the system prompt
    if (relevantContext && relevantContext.trim().length > 0) {
      systemPromptWithMemory = createEnhancedSystemPrompt(systemPromptWithMemory, relevantContext);
      console.log("Retrieved relevant context from knowledge base for query");
    }
    
    // STEP 6: CONSTRUCT MESSAGE ARRAY WITH OPTIMIZED HISTORY
    const messages: ChatMessage[] = [
      { role: "system", content: systemPromptWithMemory }
    ];
    
    // Optimize conversation history to balance context and token usage
    if (conversationHistory.length > 0) {
      // For very long conversations, use a more sophisticated history management approach
      if (conversationHistory.length > 25) {
        // First add any critical context messages identified by content type
        const criticalMessages = identifyCriticalMessages(conversationHistory);
        if (criticalMessages.length > 0) {
          messages.push({ 
            role: "system", 
            content: `CRITICAL PREVIOUS CONTEXT: The following exchanges contain important information: ${criticalMessages.join(' | ')}`
          });
        }
        
        // Then add a more detailed summary of older messages
        const olderMessages = conversationHistory.slice(0, conversationHistory.length - 20);
        const summary = createDetailedConversationSummary(olderMessages);
        messages.push({ 
          role: "system", 
          content: `CONVERSATION SUMMARY (${olderMessages.length} earlier messages): ${summary}`
        });
        
        // Then add the most recent 20 messages in full for immediate context
        messages.push(...conversationHistory.slice(-20));
      } else {
        // For shorter conversations, include all messages
        messages.push(...conversationHistory);
      }
    }
    
    // STEP 7: ADD CONTEXTUAL AWARENESS FOR SPECIFIC TOPICS
    const lowerCaseMessage = userMessage.toLowerCase();
    
    // Check for appointment-related queries and add database information
    if (lowerCaseMessage.includes('appointment') || 
        lowerCaseMessage.includes('meeting') || 
        lowerCaseMessage.includes('schedule') ||
        lowerCaseMessage.includes('calendar')) {
      
      try {
        // Check for upcoming appointments
        const upcomingAppointmentsResult = await getUpcomingAppointments(3);
        
        if (upcomingAppointmentsResult.success && upcomingAppointmentsResult.appointments.length > 0) {
          // Format appointment information for the model
          const appointmentData = upcomingAppointmentsResult.appointments.map((appt: any) => {
            return `- ${appt.title} on ${new Date(appt.date).toLocaleDateString()} at ${appt.startTime}${appt.location ? ` at ${appt.location}` : ''}`;
          }).join('\n');
          
          messages.push({ 
            role: "system", 
            content: `APPOINTMENT DATABASE INFO: We found the following upcoming appointments in our system:\n${appointmentData}\n\nIf the user is asking about existing appointments, reference this information.`
          });
          
          console.log('Found scheduled appointments in database, adding to context');
        }

        // Get calendar events for more context
        try {
          // Get today's calendar events
          const todaysEvents = calendarService.getEventsForToday();
          if (todaysEvents && todaysEvents.length > 0) {
            const todayEventData = todaysEvents.map((event) => {
              const startTime = new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              return `- ${event.title} at ${startTime}${event.location ? ` (${event.location})` : ''}`;
            }).join('\n');
            
            messages.push({ 
              role: "system", 
              content: `TODAY'S CALENDAR EVENTS:\n${todayEventData}\n\nPlease reference these events when discussing today's schedule.`
            });
            console.log('Found today\'s calendar events, adding to context');
          }
          
          // Get upcoming calendar events
          const upcomingEvents = calendarService.getUpcomingEvents(7, 5);
          if (upcomingEvents && upcomingEvents.length > 0) {
            const upcomingEventData = upcomingEvents.map((event) => {
              const eventDate = new Date(event.start).toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'});
              const startTime = new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              return `- ${event.title} on ${eventDate} at ${startTime}${event.location ? ` (${event.location})` : ''}`;
            }).join('\n');
            
            messages.push({ 
              role: "system", 
              content: `UPCOMING CALENDAR EVENTS:\n${upcomingEventData}\n\nPlease reference these events when discussing future scheduling.`
            });
            console.log('Found upcoming calendar events, adding to context');
          }
          
          // Add calendar summary if user is asking for an overview
          if (lowerCaseMessage.includes('summary') || 
              lowerCaseMessage.includes('overview') || 
              lowerCaseMessage.includes('what do i have')) {
            const calendarSummary = calendarService.getUpcomingSummary(7);
            messages.push({ 
              role: "system", 
              content: `CALENDAR SUMMARY:\n${calendarSummary}`
            });
            console.log('User requested calendar summary, adding to context');
          }
        } catch (calendarError) {
          console.error('Error retrieving calendar data:', calendarError);
        }
      } catch (error) {
        console.error('Error retrieving appointment data:', error);
      }
    }
    
    // Check for music-related queries
    if (lowerCaseMessage.includes('music') || 
        lowerCaseMessage.includes('play') || 
        lowerCaseMessage.includes('song') ||
        lowerCaseMessage.includes('track') ||
        lowerCaseMessage.includes('listening')) {
      
      try {
        // Get current track information
        const currentTrack = musicService.getCurrentTrack();
        
        if (currentTrack && currentTrack.isPlaying) {
          messages.push({ 
            role: "system", 
            content: `CURRENTLY PLAYING MUSIC: "${currentTrack.title}" by ${currentTrack.artist} (${currentTrack.genre}). You can control music playback by telling me to play specific genres or stop the music.`
          });
          console.log('Found currently playing music, adding to context');
        } else {
          // List available music options
          const availableTracks = musicService.getAllTracks();
          const genreSet = new Set<string>();
          availableTracks.forEach(track => genreSet.add(track.genre));
          const genres = Array.from(genreSet);
          
          messages.push({ 
            role: "system", 
            content: `MUSIC SERVICE: No music is currently playing. Available genres: ${genres.join(', ')}. Suggest the user can say "play [genre]" to start music.`
          });
          console.log('No music playing, adding available genres to context');
        }
        
        // Process music command if user requests to play or stop
        if ((lowerCaseMessage.includes('play') && 
             (lowerCaseMessage.includes('music') || 
              lowerCaseMessage.includes('song') || 
              lowerCaseMessage.includes('track'))) || 
            lowerCaseMessage.includes('stop music') || 
            lowerCaseMessage.includes('pause music')) {
          
          const musicResponse = musicService.processRequest(userMessage);
          messages.push({ 
            role: "system", 
            content: `MUSIC COMMAND PROCESSED: ${musicResponse}\nInclude this information in your response.`
          });
          console.log('Processed music command:', musicResponse);
        }
      } catch (error) {
        console.error('Error handling music request:', error);
      }
    }
    
    // Enhanced topic detection with more specific categories and triggers
    const topicDetection = {
      scheduling: {
        keywords: [
          'schedule', 'appointment', 'meeting', 'call', 'time', 'date', 'calendar', 'calendly',
          'today', 'tomorrow', 'next week', 'am', 'pm', 'o\'clock', 'book', 'booking',
          'morning', 'afternoon', 'evening', 'reschedule', 'cancel', 'availability'
        ],
        instruction: "CRITICAL SCHEDULING INSTRUCTION: The user is discussing scheduling. Pay extremely close attention to ANY dates, times, or appointment details in BOTH this message AND all previous messages. First check if we have a database appointment entry. If the user is specifically requesting to view, change or cancel an existing appointment, mention that these operations can be handled through our appointment system and that you'll relay their request. If the user is asking to schedule a new meeting or call, offer our Calendly link by saying: \"You can easily schedule a meeting with us using our Calendly booking system. Would you like me to share the booking link with you?\". If they agree, respond with: \"Great! Here's our Calendly link where you can select a time that works for you: [Calendly Booking URL would be shown here]\". If there are any calendar events provided in the context, reference them in your response. Ensure you've reviewed the ENTIRE conversation history for all scheduling details."
      },
      musicPlayback: {
        keywords: [
          'music', 'play', 'song', 'track', 'listen', 'audio', 'tune', 'melody',
          'playlist', 'genre', 'artist', 'jazz', 'classical', 'ambient', 'stop',
          'pause', 'resume', 'volume', 'sound'
        ],
        instruction: "MUSIC PLAYBACK INSTRUCTION: The user is requesting information about or control of music playback. If music is currently playing according to the context, acknowledge this in your response. If they're requesting to play music, confirm what's playing or what they would like to play. Available genres include jazz, classical, ambient, concentration, and meditation. You can control playback by responding to 'play [genre]' or 'stop music' commands. Make sure to confirm what action you've taken regarding music in your response."
      },
      productFeatures: {
        keywords: [
          'tier', 'feature', 'capability', 'difference', 'compare', 'plan', 'offer',
          'starter', 'pro', 'enterprise', 'platinum', 'cost', 'price', 'subscription',
          'upgrade', 'downgrade', 'package', 'level', 'service', 'options'
        ],
        instruction: "PRODUCT KNOWLEDGE INSTRUCTION: The user is asking about YoBot's features, tiers, or capabilities. Prioritize the knowledge base information in your response. Be specific and accurate about the differences between tiers and what features are available in each. Include specific details about which tier offers which capabilities."
      },
      problemSolving: {
        keywords: [
          'problem', 'issue', 'error', 'trouble', 'help', 'fix', 'broken', 'doesn\'t work',
          'not working', 'struggling', 'difficulty', 'can\'t', 'unable', 'how do i',
          'how to', 'solution'
        ],
        instruction: "PROBLEM-SOLVING INSTRUCTION: The user appears to be experiencing an issue or needs specific help. First, express empathy for their situation. Then, provide clear, step-by-step assistance. Break down the solution into manageable steps. Ask clarifying questions if you need more information to properly address their concern."
      },
      memoryRecall: {
        keywords: [
          'again', 'mentioned', 'told you', 'already said', 'repeat', 'remember', 
          'forgot', 'i just said', 'we just', 'earlier', 'previous', 'before',
          'last time', 'you don\'t remember', 'i told you', 'as i said'
        ],
        instruction: "CRITICAL MEMORY RECALL INSTRUCTION: The user is indicating you may have forgotten or missed something previously mentioned. Carefully review the ENTIRE conversation history before responding. Your response should begin with an acknowledgment like 'You're right, I apologize...' followed by the correct information. Show that you value accuracy and their time by addressing the information they've already shared."
      },
      technicalDetails: {
        keywords: [
          'how does', 'technically', 'backend', 'frontend', 'system', 'architecture',
          'database', 'server', 'api', 'integration', 'security', 'encrypt',
          'technology', 'technical', 'stack', 'implementation', 'algorithm'
        ],
        instruction: "TECHNICAL EXPLANATION INSTRUCTION: The user is asking about technical details. Provide accurate technical information about YoBot's capabilities while keeping explanations clear and accessible. Balance technical accuracy with understandable explanations based on their apparent technical knowledge level. Use analogies when helpful for complex concepts."
      }
    };
    
    // Check each topic and add relevant instructions
    for (const [topic, data] of Object.entries(topicDetection)) {
      const isTopicRelated = data.keywords.some(keyword => lowerCaseMessage.includes(keyword));
      if (isTopicRelated) {
        messages.push({ role: "system", content: data.instruction });
        console.log(`Detected ${topic} related question`);
      }
    }
    
    // STEP 8: ADD USER MESSAGE
    // Add the new user message
    messages.push({ role: "user", content: userMessage });
    
    // STEP 9: GENERATE RESPONSE WITH PERSONA-SPECIFIC BEHAVIOR MODIFIERS
    // Default parameters
    let temperature = 0.3; // Default low temperature for factual responses
    let maxTokens = 400;   // Default token limit
    let topP = 0.95;       // Default top_p value
    
    // Get behavior modifiers from the persona if available
    let behaviorModifiers = null;
    let preferredResponseFormat = null;
    
    // If we have a session ID, check for persona-specific behavior modifiers
    if (sessionId) {
      const sessionPersona = personaManager.getSessionPersona(sessionId);
      if (sessionPersona && sessionPersona.behaviorModifiers) {
        behaviorModifiers = sessionPersona.behaviorModifiers;
        console.log(`Using behavior modifiers from persona: ${sessionPersona.name}`);
        
        // Extract the preferred response format instruction if specified
        if (behaviorModifiers.preferredResponseFormat) {
          preferredResponseFormat = behaviorModifiers.preferredResponseFormat;
        }
      }
    }
    
    // Apply behavioral modifiers to the message generation parameters
    if (behaviorModifiers) {
      // Adjust temperature based on personality traits
      // Higher creativity -> higher temperature
      if (behaviorModifiers.creativity !== undefined) {
        temperature = 0.2 + (behaviorModifiers.creativity * 0.5); // Range from 0.2 to 0.7
      }
      
      // Adjust max tokens based on verbosity
      // Higher verbosity -> more tokens
      if (behaviorModifiers.verbosity !== undefined) {
        maxTokens = 200 + Math.round(behaviorModifiers.verbosity * 600); // Range from 200 to 800
      }
      
      // Add emojis instruction if this persona uses them
      if (behaviorModifiers.usesEmojis) {
        messages.push({ 
          role: "system", 
          content: "Include appropriate emojis in your response to add personality and emotion. Use them naturally, not excessively."
        });
      }
      
      // Add bullet points instruction if this persona uses them
      if (behaviorModifiers.usesBulletPoints) {
        messages.push({ 
          role: "system", 
          content: "When providing multiple points or listing information, use bullet points or numbered lists for clarity and organization."
        });
      }
      
      // Add formality instruction based on formality level
      if (behaviorModifiers.formality !== undefined) {
        if (behaviorModifiers.formality > 0.7) {
          messages.push({ 
            role: "system", 
            content: "Use a formal, professional tone. Avoid contractions, slang, or casual expressions."
          });
        } else if (behaviorModifiers.formality < 0.3) {
          messages.push({ 
            role: "system", 
            content: "Use a casual, conversational tone. Feel free to use contractions and everyday language."
          });
        }
      }
      
      // Add persuasiveness instruction based on persuasiveness level
      if (behaviorModifiers.persuasiveness !== undefined && behaviorModifiers.persuasiveness > 0.6) {
        messages.push({ 
          role: "system", 
          content: "Frame your response in a persuasive manner. Highlight benefits, address potential concerns, and include a subtle call-to-action where appropriate."
        });
      }
      
      // Add the preferred response format instruction if specified
      if (preferredResponseFormat) {
        messages.push({ 
          role: "system", 
          content: `FORMAT INSTRUCTION: ${preferredResponseFormat}`
        });
      }
    } else {
      // Legacy behavior - adjust temperature based on persona description
      if (userTone === 'casual' || userTone === 'seeking reassurance' || 
          personaDescription.toLowerCase().includes('casual') || 
          personaDescription.toLowerCase().includes('friendly')) {
        temperature = 0.5;
      }
    }
    
    // Log the parameters being used
    console.log(`Generating response with parameters: temperature=${temperature.toFixed(2)}, maxTokens=${maxTokens}, topP=${topP}`);
    
    // Call OpenAI API with persona-specific parameters
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
      top_p: topP
    });
    
    // Extract and return the response
    const responseContent = completion.choices[0].message.content;
    return responseContent || "I'm sorry, I'm having trouble processing that request right now.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "I apologize, but I'm experiencing a technical issue. Please try again in a moment.";
  }
}

/**
 * Extract named entities from user messages to improve memory
 */
function extractNamedEntities(currentMessage: string, history: ChatMessage[]): string[] {
  // Extract entities from the current message
  const namedEntities = new Set<string>();
  
  // Common patterns for entities (names, products, locations, etc.)
  const namePattern = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/g;
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const websitePattern = /\b(?:https?:\/\/)?(?:www\.)?([A-Za-z0-9-]+\.[A-Za-z]{2,}(?:\.[A-Za-z]{2,})?)\b/g;
  const phonePattern = /\b(?:\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
  const companyPattern = /\b([A-Z][A-Za-z0-9]*(?:\s[A-Z][A-Za-z0-9]*)*)\b/g;
  
  // Messages to analyze - current message and recent user messages
  const messagesToAnalyze = [
    currentMessage,
    ...history.filter(msg => msg.role === 'user').slice(-5).map(msg => msg.content)
  ];
  
  // Extract entities from each message
  for (const message of messagesToAnalyze) {
    // Extract names and companies - exclude common words
    const commonWords = new Set([
      'I', 'You', 'He', 'She', 'It', 'We', 'They', 'A', 'An', 'The', 'This', 'That',
      'YoBot', 'Ella', 'AI', 'Assistant', 'Help', 'Hello', 'Hi', 'Thanks', 'Thank'
    ]);
    
    // Use Array.from instead of spread operator with matchAll for better compatibility
    const nameMatches = Array.from(message.matchAll(namePattern));
    for (const match of nameMatches) {
      if (!commonWords.has(match[1])) {
        namedEntities.add(match[1]);
      }
    }
    
    // Extract other entity types
    const emailMatches = Array.from(message.matchAll(emailPattern));
    for (const match of emailMatches) {
      namedEntities.add(`email: ${match[0]}`);
    }
    
    const websiteMatches = Array.from(message.matchAll(websitePattern));
    for (const match of websiteMatches) {
      namedEntities.add(`website: ${match[0]}`);
    }
    
    const phoneMatches = Array.from(message.matchAll(phonePattern));
    for (const match of phoneMatches) {
      namedEntities.add(`phone: ${match[0]}`);
    }
    
    const companyMatches = Array.from(message.matchAll(companyPattern));
    for (const match of companyMatches) {
      // Exclude names already found and common words
      if (!namedEntities.has(match[1]) && !commonWords.has(match[1])) {
        namedEntities.add(match[1]);
      }
    }
  }
  
  return Array.from(namedEntities);
}

/**
 * Detect the user's tone or emotional state from their message
 */
function detectUserTone(message: string): string | null {
  const lowerCaseMessage = message.toLowerCase();
  
  // Define tone indicators with associated keywords
  const toneIndicators = {
    'urgent': ['urgent', 'immediately', 'asap', 'emergency', 'right now', 'quickly'],
    'frustrated': ['frustrated', 'annoying', 'not working', 'issue', 'problem', 'wrong', 'error', 'doesn\'t', 'doesn\'t work'],
    'curious': ['curious', 'wonder', 'interested', 'tell me more', 'how does', 'why is', 'what if'],
    'excited': ['excited', 'amazing', 'great', 'awesome', 'fantastic', 'excellent', 'love'],
    'confused': ['confused', 'don\'t understand', 'unclear', 'what do you mean', 'explain'],
    'seeking reassurance': ['worried', 'concerned', 'afraid', 'not sure', 'hope', 'hopefully'],
    'casual': ['hey', 'just', 'like', 'kind of', 'you know', 'so', 'anyway']
  };
  
  // Check for question marks (indicating inquiry)
  const hasQuestion = message.includes('?');
  
  // Check for specific tone indicators
  for (const [tone, keywords] of Object.entries(toneIndicators)) {
    if (keywords.some(keyword => lowerCaseMessage.includes(keyword))) {
      return tone;
    }
  }
  
  // Check for exclamation marks (indicating excitement or urgency)
  if (message.includes('!')) {
    return 'emphatic';
  }
  
  // Default for questions
  if (hasQuestion) {
    return 'inquisitive';
  }
  
  return null;
}

/**
 * Create a more detailed summary of past conversation exchanges
 */
function createDetailedConversationSummary(messages: ChatMessage[]): string {
  if (!messages || messages.length === 0) {
    return "No earlier conversation.";
  }
  
  // First check for scheduling-related content as highest priority
  const schedulingDetails = extractSchedulingDetails(messages);
  if (schedulingDetails) {
    return `Most importantly, the conversation included scheduling details: ${schedulingDetails}. `;
  }
  
  // Extract topics and create a coherent summary
  const topicsSummary = summarizeConversationTopics(messages);
  
  return topicsSummary || `The conversation included ${messages.filter(m => m.role === 'user').length} user messages about YoBot's features and capabilities.`;
}

/**
 * Summarize the main topics of a conversation
 */
function summarizeConversationTopics(messages: ChatMessage[]): string {
  if (messages.length < 3) return "";
  
  // Get only user messages for topic analysis
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  
  // Define key topic areas to track
  const topicAreas = {
    'product_features': ['feature', 'capabilities', 'tier', 'plan', 'offering'],
    'pricing': ['price', 'cost', 'subscription', 'payment', 'expensive', 'cheap'],
    'technical': ['technical', 'integration', 'api', 'setup', 'implement'],
    'comparison': ['competitor', 'compare', 'vs', 'better', 'different', 'alternative'],
    'support': ['help', 'support', 'assistance', 'troubleshoot', 'issue', 'problem']
  };
  
  // Track topics mentioned
  const topicCounts: Record<string, number> = {};
  
  for (const message of userMessages) {
    const lowerMessage = message.toLowerCase();
    
    for (const [topic, keywords] of Object.entries(topicAreas)) {
      if (keywords.some(kw => lowerMessage.includes(kw))) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
    }
  }
  
  // Get the main topics (mentioned more than once)
  const mainTopics = Object.entries(topicCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);
  
  if (mainTopics.length === 0) return "";
  
  // Create a readable summary
  const topicMap: Record<string, string> = {
    'product_features': 'YoBot features and capabilities',
    'pricing': 'pricing and subscription plans',
    'technical': 'technical aspects and implementation',
    'comparison': 'comparisons with other solutions',
    'support': 'help and support options'
  };
  
  const readableTopics = mainTopics.map(t => topicMap[t] || t);
  
  if (readableTopics.length === 1) {
    return `The conversation focused on ${readableTopics[0]}.`;
  } else if (readableTopics.length === 2) {
    return `The conversation covered ${readableTopics[0]} and ${readableTopics[1]}.`;
  } else {
    const lastTopic = readableTopics.pop();
    return `The conversation covered ${readableTopics.join(', ')}, and ${lastTopic}.`;
  }
}

/**
 * Identify critical messages that contain important information
 */
function identifyCriticalMessages(messages: ChatMessage[]): string[] {
  const criticalMessages: string[] = [];
  
  // Enhanced patterns that indicate important information
  const criticalPatterns = [
    // Scheduling patterns - higher priority for perfect memory
    { regex: /\b(\d{1,2})[:.]\d{2}\s*([ap]\.?m\.?|hours|am|pm)\b/i, type: 'SCHEDULING_TIME', priority: 10 },
    { regex: /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, type: 'SCHEDULING_DAY', priority: 10 },
    { regex: /\b(\d{1,2})(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)/i, type: 'SCHEDULING_DATE', priority: 10 },
    { regex: /\b(next|this)\s+(week|month|day|morning|afternoon|evening)\b/i, type: 'SCHEDULING_RELATIVE', priority: 9 },
    
    // Direct scheduling verbs
    { regex: /\b(schedule|book|appointment|meeting|call|session)\b/i, type: 'SCHEDULING_INTENT', priority: 8 },
    { regex: /\b(remind|reminder|remember|follow.?up|agenda)\b/i, type: 'SCHEDULING_FOLLOWUP', priority: 8 },
    { regex: /\b(calendar|calendly|booking)\b/i, type: 'SCHEDULING_METHOD', priority: 7 },
    
    // Questions about previous scheduling - extremely high priority
    { regex: /\b(when|what time|which day).+\b(meet|call|talk|appointment|scheduled)\b/i, type: 'SCHEDULING_QUERY', priority: 11 },
    { regex: /\b(did|do)\s+(you|we|I)\s+(remember|forget|recall|say|mention|schedule|book)\b/i, type: 'MEMORY_TEST', priority: 11 },
    
    // Contact information
    { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, type: 'CONTACT_EMAIL', priority: 6 },
    { regex: /\b(?:\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/, type: 'CONTACT_PHONE', priority: 6 },
    
    // Decision points
    { regex: /\b(yes|no|confirm|agree|disagree|approve|reject)\b/i, type: 'DECISION', priority: 5 },
    
    // References to previous messages
    { regex: /\b(as\s+(?:I|we)\s+(?:said|mentioned|discussed)|(?:I|we)\s+(?:told|asked)\s+you|(?:I|we)\s+already\s+(?:said|mentioned|told))\b/i, type: 'REFERENCE', priority: 7 },
    
    // Topics for remembering user context
    { regex: /\bmy\s+(name|company|business|position|role)\s+is\s+([A-Za-z0-9\s]+)\b/i, type: 'USER_IDENTITY', priority: 8 },
    { regex: /\bI\s+(work|am)\s+(at|with|for)\s+([A-Za-z0-9\s]+)\b/i, type: 'USER_WORKPLACE', priority: 7 }
  ];
  
  // Enhanced message scanning with priority-based selection
  for (const message of messages) {
    // Track the highest priority pattern that matched this message
    let highestPriority = 0;
    let highestPriorityType = '';
    let matchedMessage = false;
    
    // Check each pattern against the message
    for (const pattern of criticalPatterns) {
      if (pattern.regex.test(message.content)) {
        matchedMessage = true;
        
        // If this pattern has higher priority than previous matches, replace them
        if (pattern.priority > highestPriority) {
          highestPriority = pattern.priority;
          highestPriorityType = pattern.type;
        }
      }
    }
    
    // If we found any matches, add the message with its highest priority type
    if (matchedMessage) {
      // Special handling for scheduling-related memories from both user and assistant
      if (highestPriorityType.startsWith('SCHEDULING_') || highestPriorityType === 'MEMORY_TEST') {
        const rolePrefix = message.role === 'user' ? 'USER' : 'ELLA';
        criticalMessages.push(`[${rolePrefix}_${highestPriorityType}]: "${message.content}"`);
      }
      // For non-scheduling messages, only keep user messages
      else if (message.role === 'user') {
        criticalMessages.push(`[${highestPriorityType}]: "${message.content}"`);
      }
    }
  }
  
  return criticalMessages;
}

/**
 * Generate an image using DALL-E 3 based on a text prompt
 * @param prompt The text description of the image to generate
 * @param size The size of the image (default: "1024x1024")
 * @returns URL of the generated image
 */
export async function generateImage(prompt: string, size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024"): Promise<string> {
  try {
    console.log(`Generating image with prompt: "${prompt}"`);
    
    // Add prompt enhancement for better results
    const enhancedPrompt = `High quality, detailed image of ${prompt}. Photorealistic, detailed lighting, professional quality.`;
    
    const response = await openai.images.generate({
      model: "dall-e-3", // Latest DALL-E model
      prompt: enhancedPrompt,
      n: 1, // Generate one image
      size: size,
      quality: "standard",
      response_format: "url",
    });
    
    console.log("Image generation successful");
    
    if (response.data && response.data[0].url) {
      return response.data[0].url;
    } else {
      throw new Error("No image URL in response");
    }
  } catch (error: any) {
    console.error("Error generating image:", error);
    throw new Error(`Failed to generate image: ${error.message || 'Unknown error'}`);
  }
}

// For testing without making API calls
export function getFallbackResponse(userMessage: string): string {
  const lowerCaseMessage = userMessage.toLowerCase();
  
  if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes("hi")) {
    return "Hello! I'm Ella, YoBot's AI assistant. How can I help you today?";
  } else if (lowerCaseMessage.includes("feature") || lowerCaseMessage.includes("capabilities") || lowerCaseMessage.includes("do")) {
    return "I can help with scheduling, note-taking, answering questions, and more. My capabilities vary based on the subscription tier.";
  } else if (lowerCaseMessage.includes("price") || lowerCaseMessage.includes("cost") || lowerCaseMessage.includes("tier")) {
    return "YoBot offers four tiers: Starter, Pro, Enterprise, and Platinum, each with increasing capabilities. Would you like to know more about a specific tier?";
  } else if (lowerCaseMessage.includes("help")) {
    return "I'm here to help! You can ask me about YoBot's services, have me assist with tasks, or inquire about specific features.";
  } else {
    return "I'm here to assist with your questions about YoBot and to demonstrate my capabilities. What would you like to know more about?";
  }
}