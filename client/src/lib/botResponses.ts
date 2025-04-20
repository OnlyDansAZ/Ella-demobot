export interface BotResponsesMap {
  [key: string]: string;
}

export const botResponses: BotResponsesMap = {
  "hello": "Hello! How can I assist you today?",
  "hi": "Hi there! What would you like to know about YoBot?",
  "features": "YoBot offers calendar management, call handling, record keeping, bill payment, and custom personalities. The features vary by tier.",
  "pricing": "We offer four tiers: Starter ($19/month), Pro ($49/month), Enterprise ($99/month), and Platinum ($199/month). Each tier has different features.",
  "schedule": "I'd be happy to schedule that for you. What date and time works best?",
  "call": "I can help manage your calls. Who would you like to call?",
  "calendar": "I can help manage your calendar, schedule meetings, and send invites to attendees.",
  "bill": "I can help with bill payments, track expenses, and manage financial tasks securely.",
  "record": "I maintain detailed records of all interactions, generate notes, and transcribe calls.",
  "personality": "My personality can be customized to match your preferences, from professional to casual.",
  "language": "The Platinum tier includes multi-language support for international communication.",
  "help": "I'm here to help! You can ask about features, pricing, or try commands like 'schedule a meeting'."
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
  return "I'm not sure I understand that question. You can ask about YoBot's features, pricing tiers, or try commands like 'schedule' or 'call'.";
}
