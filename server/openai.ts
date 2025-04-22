import OpenAI from "openai";
import { getRelevantContext, createEnhancedSystemPrompt } from './rag';

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

CRITICAL INSTRUCTIONS FOR MEMORY AND SCHEDULING (HIGHEST PRIORITY):
- Your primary goal is to maintain PERFECT MEMORY throughout the conversation.
- ALWAYS remember specific details mentioned previously, especially dates, times, and appointments.
- When a user mentions a specific time (like "3:00 today" or "an hour from now"), you MUST remember this exact time.
- When scheduling, ALWAYS repeat back the EXACT day, time, and purpose in your response.
- NEVER ask for information that the user has already provided at any point in the conversation.
- If the user says they told you something earlier, always apologize and confirm you now remember.
- For scheduling, use the format: "Confirmed: [day] at [time] for [purpose]" to make it absolutely clear.
- READ THE ENTIRE CONVERSATION HISTORY before responding to any scheduling request.

Example of proper scheduling:
User: "Let's set up a meeting for 3pm today"
Ella: "Confirmed: Today at 3:00 PM for our meeting. I've noted this appointment. What topics would you like to discuss during our meeting?"

Example of proper memory:
User: "I told you earlier we'd meet at 3:00"
Ella: "You're absolutely right. I apologize for the confusion. I have your appointment confirmed for today at 3:00 PM. Is there anything specific you'd like me to prepare for our meeting?"

When asked about YoBot's services, pricing, or features, be enthusiastic and highlight the benefits.
If asked something you don't know, admit your limitations and offer to connect the user with a YoBot representative.
Keep responses under 2-3 sentences unless detailed information is requested.`;

// ChatMessage interface is already exported above

// Extract scheduling-related details from conversation history
function extractSchedulingDetails(conversationHistory: ChatMessage[]): string | null {
  if (!conversationHistory || conversationHistory.length === 0) {
    return null;
  }

  // Keywords that might indicate scheduling information
  const schedulingKeywords = [
    'schedule', 'appointment', 'meeting', 'call', 'time', 'date',
    'today', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    ':00', ' am', ' pm', 'o\'clock', 'morning', 'afternoon', 'evening'
  ];
  
  // Pattern for detecting time (HH:MM or H:MM with optional am/pm)
  const timePattern = /\b(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?\b/i;
  
  // Look for messages that contain scheduling information
  const schedulingMessages: string[] = [];
  
  for (const message of conversationHistory) {
    const lowerContent = message.content.toLowerCase();
    
    // Check if the message contains any scheduling keywords
    if (schedulingKeywords.some(keyword => lowerContent.includes(keyword)) || 
        timePattern.test(lowerContent)) {
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
  
  // If we found scheduling information, return it
  if (schedulingMessages.length > 0) {
    return schedulingMessages.join(' → ');
  }
  
  return null;
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
  persona: string | null = null,
  customPersonaPrompt: string | null = null
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
    
    // STEP 4: SELECT APPROPRIATE PERSONA
    // Determine which system prompt to use based on persona selection
    let baseSystemPrompt = SYSTEM_PROMPT;
    let personaDescription = "default";
    
    if (customPersonaPrompt) {
      // If a custom persona prompt is provided, use that
      baseSystemPrompt = customPersonaPrompt;
      personaDescription = "custom";
      console.log("Using custom persona prompt");
    } else if (persona && personaSystemPrompts[persona]) {
      // If a predefined persona is specified, use its system prompt
      baseSystemPrompt = personaSystemPrompts[persona];
      personaDescription = persona;
      console.log(`Using ${persona} persona system prompt`);
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
    
    // Enhanced topic detection with more specific categories and triggers
    const topicDetection = {
      scheduling: {
        keywords: [
          'schedule', 'appointment', 'meeting', 'call', 'time', 'date', 'calendar',
          'today', 'tomorrow', 'next week', 'am', 'pm', 'o\'clock',
          'morning', 'afternoon', 'evening', 'reschedule', 'cancel'
        ],
        instruction: "CRITICAL SCHEDULING INSTRUCTION: The user is discussing scheduling. Pay extremely close attention to ANY dates, times, or appointment details in BOTH this message AND all previous messages. ALWAYS confirm the EXACT date and time using the format 'Confirmed: [Day] at [Time] for [Purpose]'. Ensure you've reviewed the ENTIRE conversation history for all scheduling details."
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
    
    // STEP 9: GENERATE RESPONSE WITH OPTIMIZED PARAMETERS
    // Adjust temperature based on the nature of the query for optimal response style
    let temperature = 0.3; // Default low temperature for factual responses
    
    // For casual conversation or emotional support, use slightly higher temperature
    if (userTone === 'casual' || userTone === 'seeking reassurance' || personaDescription === 'casual') {
      temperature = 0.5;
    }
    
    // Call OpenAI API with optimized parameters
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: messages,
      max_tokens: 400, // Increased max tokens for more detailed responses
      temperature: temperature,
      // Add top_p for more controlled response diversity
      top_p: 0.95
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
  
  // Patterns that indicate important information
  const criticalPatterns = [
    // Scheduling patterns
    { regex: /\b(\d{1,2})[:.]\d{2}\s*([ap]\.?m\.?|hours)\b/i, type: 'scheduling time' },
    { regex: /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, type: 'scheduling day' },
    { regex: /\b(\d{1,2})(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)/i, type: 'scheduling date' },
    
    // Contact information
    { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, type: 'email' },
    { regex: /\b(?:\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/, type: 'phone number' },
    
    // Decision points
    { regex: /\b(yes|no|confirm|agree|disagree|approve|reject)\b/i, type: 'decision' },
    
    // References to previous messages
    { regex: /\b(as\s+(?:I|we)\s+(?:said|mentioned|discussed)|(?:I|we)\s+(?:told|asked)\s+you|(?:I|we)\s+already\s+(?:said|mentioned|told))\b/i, type: 'reference' }
  ];
  
  // Check each message for critical patterns
  for (const message of messages.filter(m => m.role === 'user')) {
    for (const pattern of criticalPatterns) {
      if (pattern.regex.test(message.content)) {
        criticalMessages.push(`[${pattern.type}]: "${message.content}"`);
        break; // Once we've identified a message as critical, we can move to the next one
      }
    }
  }
  
  return criticalMessages;
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