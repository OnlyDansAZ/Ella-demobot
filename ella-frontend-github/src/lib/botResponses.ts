export interface BotResponsesMap {
  [key: string]: string;
}

export const botResponses: BotResponsesMap = {
  // Greetings
  "hello": "Hello! How can I assist you today?",
  "hi": "Hi there! What would you like to know about Ella?",
  "hey": "Hey! I'm Ella, ready to help you. What can I do for you?",
  "good morning": "Good morning! How can I make your day more productive?",
  "good afternoon": "Good afternoon! How can I assist you today?",
  "good evening": "Good evening! How can I help you tonight?",
  
  // Info about Ella
  "features": "YoBot's Ella offers calendar management, call handling, record keeping, bill payment, and custom personalities. The features vary by tier.",
  "pricing": "We offer four tiers: Starter (Basic), Pro (Standard), Enterprise (Professional), and Platinum (Premium). Each tier has different features.",
  "plans": "We offer four tiers: Starter (Basic), Pro (Standard), Enterprise (Professional), and Platinum (Premium). Each tier has different features.",
  "tiers": "Our tiers include Starter, Pro, Enterprise, and Platinum, each with increasing capabilities.",
  
  // Capabilities
  "schedule": "I'd be happy to schedule that for you. What date and time works best?",
  "meeting": "I can help schedule and manage your meetings. When would you like to set it up?",
  "call": "I can help manage your calls. Who would you like to call?",
  "calendar": "I can help manage your calendar, schedule meetings, and send invites to attendees.",
  "bill": "I can help with bill payments, track expenses, and manage financial tasks securely.",
  "record": "I maintain detailed records of all interactions, generate notes, and transcribe calls.",
  "personality": "My personality can be customized to match your preferences, from professional to casual.",
  "language": "The Platinum tier includes multi-language support for international communication.",
  
  // Specific tier questions
  "starter": "The Starter tier includes basic chatbot interactions, calendar management, and basic note-taking capabilities.",
  "pro": "The Pro tier includes everything in Starter, plus call handling, texting, advanced record keeping, and custom voice options.",
  "enterprise": "The Enterprise tier includes everything in Pro, plus bill payment automation, business systems integration, advanced analytics, and fully customizable personality.",
  "platinum": "The Platinum tier is our ultimate offering with a proprietary AI model, advanced predictive analytics, multi-language support, and a dedicated AI development team.",
  
  // Help
  "help": "I'm here to help! You can ask about features, plans, or try commands like 'schedule a meeting'.",
  "how do you work": "I'm an AI assistant that helps with scheduling, communication, record keeping, and more. My capabilities depend on the tier you choose.",
  "what can you do": "I can manage your calendar, handle calls and texts, maintain records, pay bills, and more depending on your selected tier.",
  
  // Misc
  "thank you": "You're welcome! Is there anything else I can help you with?",
  "thanks": "You're welcome! Anything else you'd like to know?"
};

export function getBotResponse(message: string): string {
  const lowercaseMessage = message.toLowerCase();
  
  // Check for exact matches first
  if (botResponses[lowercaseMessage]) {
    return botResponses[lowercaseMessage];
  }
  
  // Check for partial matches
  for (const key in botResponses) {
    if (lowercaseMessage.includes(key)) {
      return botResponses[key];
    }
  }
  
  // Default response
  return "I'm not sure I understand that question. You can ask about Ella's features, pricing tiers, or try commands like 'schedule' or 'call'.";
}
