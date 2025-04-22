import OpenAI from "openai";

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

Important instructions for memory and scheduling:
- ALWAYS REMEMBER specific details that users mention, especially dates, times, and appointments.
- For scheduling, respond with confirmation of the EXACT day and time suggested by the user.
- If the user mentions any specific time (like "3:00 today"), always confirm that exact time in your response.
- Pay careful attention to previous messages for context.
- Never ask for information that the user has already provided earlier in the conversation.

When asked about YoBot's services, pricing, or features, be enthusiastic and highlight the benefits.
If asked something you don't know, admit your limitations and offer to connect the user with a YoBot representative.
Keep responses under 2-3 sentences unless detailed information is requested.`;

// Interface for chat message
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Function to generate a response from OpenAI
export async function generateResponse(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<string> {
  try {
    // Prepare the conversation for OpenAI
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT }
    ];
    
    // Add conversation history if available (increased to 15 messages for better context)
    if (conversationHistory.length > 0) {
      messages.push(...conversationHistory.slice(-15));
    }
    
    // Check for scheduling-related keywords to add a reminder about scheduling importance
    const lowerCaseMessage = userMessage.toLowerCase();
    const schedulingKeywords = ['schedule', 'appointment', 'meeting', 'time', 'today', 'tomorrow', ':', 'am', 'pm'];
    
    const isSchedulingRelated = schedulingKeywords.some(keyword => lowerCaseMessage.includes(keyword));
    
    if (isSchedulingRelated) {
      messages.push({ 
        role: "system", 
        content: "This appears to be about scheduling. Pay extremely close attention to any dates, times, or appointment details mentioned. Always confirm the EXACT date and time in your response, and refer back to previous messages for context."
      });
    }
    
    // Add the new user message
    messages.push({ role: "user", content: userMessage });
    
    // Add reminder to check previous context when appropriate
    const remindContextKeywords = ['again', 'mentioned', 'told you', 'already said', 'repeat', 'remember'];
    const needsContextReminder = remindContextKeywords.some(keyword => lowerCaseMessage.includes(keyword));
    
    if (needsContextReminder) {
      messages.push({ 
        role: "system", 
        content: "The user is indicating you may have missed or forgotten something they previously mentioned. Please very carefully check the conversation history before responding."
      });
    }
    
    // Call OpenAI API with slightly higher temperature for more precise responses on factual matters
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: messages,
      max_tokens: 300,
      temperature: 0.5, // Lower temperature for more consistent/factual responses
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