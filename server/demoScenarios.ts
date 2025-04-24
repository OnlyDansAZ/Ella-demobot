import { ChatMessage } from './conversationStorage';

/**
 * Pre-defined conversation scenarios for demo mode
 * These are used when the application is in demo mode (?demo=true)
 */

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  triggers: string[];  // Keywords that might trigger this scenario
  messages: ChatMessage[];
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'sales_conversation',
    name: 'Sales Conversation',
    description: 'A sample sales conversation about YoBot features and pricing',
    triggers: ['price', 'cost', 'pricing', 'subscription', 'features', 'plan', 'compare'],
    messages: [
      {
        id: 'demo-sales-1',
        content: "Can you tell me about YoBot's different pricing tiers?",
        isUser: true,
        timestamp: new Date(Date.now() - 120000).toISOString()
      },
      {
        id: 'demo-sales-2',
        content: "Of course! YoBot offers four different tiers to meet various needs:\n\n" +
                "✨ **Starter Plan**: Perfect for individuals and small businesses just getting started with AI assistance. Includes basic conversation capabilities, appointment scheduling, and note-taking.\n\n" +
                "✨ **Pro Plan**: Designed for growing businesses that need more advanced features. Includes everything in Starter plus voice capabilities, multiple personas, and integration with popular business tools.\n\n" +
                "✨ **Enterprise Plan**: For larger organizations requiring robust capabilities. Includes everything in Pro plus custom knowledge base integration, advanced analytics, and dedicated support.\n\n" +
                "✨ **Platinum Plan**: Our most comprehensive solution with unlimited usage, priority support, custom voice development, and full system integration with your existing infrastructure.\n\n" +
                "Would you like more specific information about any of these plans or their capabilities?",
        isUser: false,
        timestamp: new Date(Date.now() - 110000).toISOString()
      }
    ]
  },
  {
    id: 'appointment_booking',
    name: 'Appointment Booking',
    description: 'A sample conversation about scheduling an appointment',
    triggers: ['schedule', 'appointment', 'meeting', 'book', 'calendar', 'available', 'meet'],
    messages: [
      {
        id: 'demo-appt-1',
        content: "I need to schedule a demo of your Enterprise plan for next week. Are you available on Tuesday at 2pm?",
        isUser: true,
        timestamp: new Date(Date.now() - 180000).toISOString()
      },
      {
        id: 'demo-appt-2',
        content: "I'd be happy to help you schedule a demo of our Enterprise plan! Let me check the availability for next Tuesday at 2 PM.\n\n" +
                "Yes, that time slot is available. Could you please provide me with your name and email address so I can set up the appointment? Also, would you prefer a video call or an in-person demonstration?",
        isUser: false,
        timestamp: new Date(Date.now() - 170000).toISOString()
      },
      {
        id: 'demo-appt-3',
        content: "My name is Alex Johnson and my email is alex@example.com. A video call would be perfect.",
        isUser: true,
        timestamp: new Date(Date.now() - 160000).toISOString()
      },
      {
        id: 'demo-appt-4',
        content: "Great! I've scheduled a video call demo of our Enterprise plan for next Tuesday at 2 PM for Alex Johnson (alex@example.com).\n\n" +
                "A calendar invitation has been sent to your email with the meeting link and details. Our product specialist will conduct the demo and answer any questions you might have about the Enterprise plan.\n\n" +
                "Is there anything specific about YoBot's Enterprise features you'd like them to focus on during the demo?",
        isUser: false,
        timestamp: new Date(Date.now() - 150000).toISOString()
      }
    ]
  },
  {
    id: 'image_generation',
    name: 'Image Generation',
    description: 'A sample conversation showcasing image generation capabilities',
    triggers: ['image', 'picture', 'generate', 'drawing', 'logo', 'design', 'create'],
    messages: [
      {
        id: 'demo-img-1',
        content: "Can you generate a logo concept for my new tech startup called 'Quantum Leap'?",
        isUser: true,
        timestamp: new Date(Date.now() - 240000).toISOString()
      },
      {
        id: 'demo-img-2',
        content: "I'd be happy to help generate a logo concept for your tech startup 'Quantum Leap'! Let me create something that conveys innovation and forward-thinking technology.\n\n" +
                "I'm generating an image based on your request. The logo will incorporate elements that represent quantum technology and advancement. Would you prefer a minimalist design or something more detailed?",
        isUser: false,
        timestamp: new Date(Date.now() - 230000).toISOString()
      },
      {
        id: 'demo-img-3',
        content: "I'd like something minimalist but futuristic.",
        isUser: true,
        timestamp: new Date(Date.now() - 220000).toISOString()
      },
      {
        id: 'demo-img-4',
        content: "Perfect! I've created a minimalist, futuristic logo concept for 'Quantum Leap'. It features a sleek, abstract representation of a quantum particle in motion, with a clean typography treatment of your company name.\n\n" +
                "The color scheme uses deep blues and bright cyans to convey technology and innovation, while the minimalist approach ensures it's versatile for different applications.\n\n" +
                "[Image would appear here in an actual conversation]\n\n" +
                "What do you think of this concept? Would you like me to generate alternative versions or make any adjustments to this design?",
        isUser: false,
        timestamp: new Date(Date.now() - 210000).toISOString()
      }
    ]
  }
];

/**
 * Get a demo scenario based on the content of the user's message
 * @param userMessage The content of the user's message
 * @returns The most relevant demo scenario
 */
export function getRelevantDemoScenario(userMessage: string): DemoScenario {
  const messageLower = userMessage.toLowerCase();
  
  // Check if any scenario triggers match the user message
  for (const scenario of DEMO_SCENARIOS) {
    if (scenario.triggers.some(trigger => messageLower.includes(trigger))) {
      return scenario;
    }
  }
  
  // If no specific scenario matches, return the default sales conversation
  return DEMO_SCENARIOS[0];
}

/**
 * Get demo continuation message
 * Returns a simulated response for demo mode based on the scenario and previous messages
 * @param scenario The active demo scenario
 * @param previousMessages Previous messages in the conversation
 * @param userMessage The user's current message
 */
export function getDemoContinuation(
  scenario: DemoScenario,
  previousMessages: ChatMessage[],
  userMessage: string
): string {
  // This would typically be more sophisticated with conditional responses
  // based on the specific user message and conversation context
  
  // For now, we'll use simple predefined responses based on the scenario
  switch (scenario.id) {
    case 'sales_conversation':
      return "I'm glad you're interested in YoBot! Our AI assistant can help businesses of all sizes automate conversations, schedule appointments, and provide personalized service to your customers.\n\n" +
             "Each plan includes different levels of functionality, with our Enterprise and Platinum tiers offering the most advanced features like custom knowledge base integration and voice capabilities tailored to your brand.\n\n" +
             "Would you like to schedule a personalized demo to see how YoBot could work specifically for your business needs?";
    
    case 'appointment_booking':
      return "Great! I've confirmed your appointment details. You'll receive a calendar invitation shortly with all the necessary information.\n\n" +
             "Our team is looking forward to demonstrating how YoBot's scheduling capabilities can integrate with your existing systems to make appointment management seamless.\n\n" + 
             "Is there anything else you'd like to know before the demo?";
    
    case 'image_generation':
      return "I'm glad you like the concept! The minimalist approach works well for tech startups as it's both modern and adaptable across different media.\n\n" +
             "For your actual logo development, YoBot can generate multiple concepts that your design team can refine. Our Enterprise and Platinum plans include extended image generation capabilities that can help with branding, marketing materials, and more.\n\n" +
             "Would you like to see how these capabilities could be customized for your specific business needs?";
    
    default:
      return "Thank you for your interest in YoBot! Our AI assistant is designed to help businesses like yours improve customer engagement and operational efficiency.\n\n" +
             "Would you like to learn more about our features or schedule a personalized demonstration?";
  }
}