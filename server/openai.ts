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

// Function to generate a response from OpenAI with RAG capabilities
export async function generateResponse(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<string> {
  try {
    // Extract scheduling details from conversation history for better memory
    const schedulingDetails = extractSchedulingDetails(conversationHistory);
    
    // Create a memory prompt enhancement with extracted details
    const memoryPrompt = schedulingDetails ? 
      `IMPORTANT MEMORY CONTEXT: Based on the conversation history, the user has previously discussed scheduling: ${schedulingDetails}. Keep this information in mind when responding.` : '';
    
    // Get relevant context from the knowledge base using RAG
    const relevantContext = await getRelevantContext(userMessage, conversationHistory);
    
    // Create enhanced system prompt with both memory and knowledge base context
    let systemPromptWithMemory = memoryPrompt ? `${SYSTEM_PROMPT}\n\n${memoryPrompt}` : SYSTEM_PROMPT;
    
    // If we have relevant context from the knowledge base, add it to the system prompt
    if (relevantContext && relevantContext.trim().length > 0) {
      systemPromptWithMemory = createEnhancedSystemPrompt(systemPromptWithMemory, relevantContext);
      console.log("Retrieved relevant context from knowledge base for query");
    }
    
    const messages: ChatMessage[] = [
      { role: "system", content: systemPromptWithMemory }
    ];
    
    // Always include ALL conversation history but make sure we don't exceed the token limit
    // by prioritizing the most recent messages when we have too many
    if (conversationHistory.length > 0) {
      // For very long conversations, keep all messages but summarize older ones
      if (conversationHistory.length > 30) {
        // First, add a summary of older messages
        messages.push({ 
          role: "system", 
          content: `This is a long conversation. Earlier in the conversation (${conversationHistory.length - 30} messages ago), the user discussed: ${summarizeOlderMessages(conversationHistory.slice(0, conversationHistory.length - 30))}`
        });
        
        // Then add the most recent 30 messages in full
        messages.push(...conversationHistory.slice(-30));
      } else {
        // For shorter conversations, include all messages
        messages.push(...conversationHistory);
      }
    }
    
    // Check for scheduling-related keywords to add a reminder about scheduling importance
    const lowerCaseMessage = userMessage.toLowerCase();
    const schedulingKeywords = [
      'schedule', 'appointment', 'meeting', 'time', 'today', 'tomorrow', ':', 'am', 'pm', 
      'hour', 'minute', 'o\'clock', 'morning', 'afternoon', 'evening'
    ];
    
    const isSchedulingRelated = schedulingKeywords.some(keyword => lowerCaseMessage.includes(keyword));
    
    if (isSchedulingRelated) {
      // Add a very clear scheduling instruction
      messages.push({ 
        role: "system", 
        content: "CRITICAL SCHEDULING INSTRUCTION: The user is discussing scheduling. You MUST pay extremely close attention to ANY dates, times, or appointment details mentioned in BOTH this message AND previous messages. ALWAYS confirm the EXACT date and time in your response using the format 'Confirmed: [Day] at [Time] for [Purpose]'. You MUST look through the ENTIRE conversation history to ensure you have the correct details."
      });
    }
    
    // Check for product/feature related keywords to prioritize knowledge base information
    const featureKeywords = [
      'tier', 'feature', 'capability', 'difference', 'compare', 'plan', 'offer',
      'starter', 'pro', 'enterprise', 'platinum', 'cost', 'price'
    ];
    
    const isFeatureRelated = featureKeywords.some(keyword => lowerCaseMessage.includes(keyword));
    
    if (isFeatureRelated && relevantContext) {
      messages.push({ 
        role: "system", 
        content: "The user is asking about YoBot's features, tiers, or capabilities. Prioritize the knowledge base information in your response. Be specific and accurate about the differences between tiers and what features are available in each."
      });
    }
    
    // Add the new user message
    messages.push({ role: "user", content: userMessage });
    
    // Check if the user is indicating we missed or forgot something
    const remindContextKeywords = [
      'again', 'mentioned', 'told you', 'already said', 'repeat', 'remember', 
      'forgot', 'i just said', 'we just', 'earlier', 'previous'
    ];
    const needsContextReminder = remindContextKeywords.some(keyword => lowerCaseMessage.includes(keyword));
    
    if (needsContextReminder) {
      messages.push({ 
        role: "system", 
        content: "CRITICAL MEMORY ALERT: The user is indicating you have missed or forgotten something they previously mentioned. You MUST very carefully read through the ENTIRE conversation history again before responding. Your response should begin with 'You're right, I apologize for missing that...' followed by the correct information. This is extremely important for maintaining user trust."
      });
    }
    
    // Call OpenAI API with low temperature for more precise responses on factual matters
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: messages,
      max_tokens: 300,
      temperature: 0.3, // Even lower temperature for more consistent/precise responses when scheduling
    });
    
    // Extract and return the response
    const responseContent = completion.choices[0].message.content;
    return responseContent || "I'm sorry, I'm having trouble processing that request right now.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "I apologize, but I'm experiencing a technical issue. Please try again in a moment.";
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