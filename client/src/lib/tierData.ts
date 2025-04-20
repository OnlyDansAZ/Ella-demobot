export interface TierFeature {
  name: string;
  starter: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
  platinum: boolean | string;
}

export interface TierChat {
  botMessage: string;
  userMessage: string;
  botResponse: string;
}

export interface Tier {
  id: string;
  name: string;
  description: string;
  price_tier: string; // Changed from numeric price to tier label
  features: string[];
  chat: TierChat;
}

export const tiers: Tier[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for individuals who need basic assistance",
    price_tier: "Basic",
    features: [
      "Basic chatbot interactions",
      "Calendar management",
      "Basic note-taking",
    ],
    chat: {
      botMessage: "Hi there! I'm Ella, YoBot's Starter assistant. I can help you manage your calendar and take basic notes. How can I assist you today?",
      userMessage: "Can you schedule a meeting for me next Tuesday at 3pm?",
      botResponse: "I'll schedule that meeting for Tuesday at 3:00 PM. What would you like to title the meeting?"
    }
  },
  {
    id: "pro",
    name: "Pro",
    description: "Advanced features for professionals and small teams",
    price_tier: "Standard",
    features: [
      "Everything in Starter",
      "Call handling and texting",
      "Advanced record keeping",
      "Custom voice options"
    ],
    chat: {
      botMessage: "Hey there! I'm Ella, YoBot's Pro assistant. I can handle calls, texts, advanced scheduling, and keep detailed records. What can I help you with?",
      userMessage: "I need to call my team and let them know our meeting has moved to Thursday.",
      botResponse: "I can handle that for you. I'll call your team members to inform them about the meeting change to Thursday. Would you like me to update the calendar invites as well?"
    }
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Complete solution for businesses and organizations",
    price_tier: "Professional",
    features: [
      "Everything in Pro",
      "Complete bill payment automation",
      "Integration with business systems",
      "Advanced analytics and reporting",
      "Fully customizable personality"
    ],
    chat: {
      botMessage: "Hello! I'm Ella, YoBot's Enterprise assistant. I provide complete business automation with system integrations, financial management, and detailed analytics. How may I assist your organization today?",
      userMessage: "I need to pay all our pending invoices and generate a financial report for Q2.",
      botResponse: "I'll process all pending invoices immediately and generate a comprehensive Q2 financial report. The report will include expense breakdown, payment history, and budget analysis. Would you like me to email this to the finance team as well?"
    }
  },
  {
    id: "platinum",
    name: "Platinum",
    description: "Ultimate AI assistant with proprietary customization",
    price_tier: "Premium",
    features: [
      "Everything in Enterprise",
      "Proprietary AI model",
      "Advanced predictive analytics",
      "Multi-language support",
      "Dedicated AI development team"
    ],
    chat: {
      botMessage: "Greetings! I'm Ella, YoBot's Platinum assistant. I have access to proprietary AI models, predictive analytics, and multi-language capabilities. I'm designed to anticipate your needs before you even ask. How may I help you today?",
      userMessage: "Our team is planning an international expansion. Can you help with the logistics and market research?",
      botResponse: "I'll coordinate your international expansion immediately. Based on your company profile and recent meetings, I've already begun analyzing potential markets in Asia and Europe. I'll prepare a comprehensive report with logistics requirements, market analysis, and regulatory considerations. I can also arrange meetings with local partners in your target regions. Would you like me to prepare a presentation for your board meeting next week?"
    }
  }
];

export const comparisonFeatures: TierFeature[] = [
  {
    name: "Chatbot Interface",
    starter: true,
    pro: true,
    enterprise: true,
    platinum: true
  },
  {
    name: "Calendar Management",
    starter: true,
    pro: true,
    enterprise: true,
    platinum: true
  },
  {
    name: "Call & Text Handling",
    starter: false,
    pro: true,
    enterprise: true,
    platinum: true
  },
  {
    name: "Record Keeping",
    starter: "Basic",
    pro: "Advanced",
    enterprise: "Advanced",
    platinum: "Enterprise"
  },
  {
    name: "Bill Payment",
    starter: false,
    pro: false,
    enterprise: true,
    platinum: true
  },
  {
    name: "Custom Personality",
    starter: "Basic",
    pro: "Advanced",
    enterprise: "Complete",
    platinum: "Proprietary"
  },
  {
    name: "Multi-language Support",
    starter: false,
    pro: false,
    enterprise: false,
    platinum: true
  }
];
