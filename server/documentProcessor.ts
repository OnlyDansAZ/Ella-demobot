import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { addDocuments } from './vectordb';

// Create a text splitter for chunking documents
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

/**
 * Process and add a document to the vector database
 * @param text The text content of the document
 * @param metadata Metadata for the document (e.g., title, source, etc.)
 */
export async function processDocument(text: string, metadata: Record<string, any> = {}) {
  try {
    // Split the text into chunks
    const docs = await textSplitter.createDocuments([text], [metadata]);
    
    // Add the document chunks to the vector store
    const result = await addDocuments(docs);
    
    return {
      success: result,
      count: docs.length
    };
  } catch (error: unknown) {
    console.error("Error processing document:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Process and add multiple documents to the vector database
 */
export async function processBulkDocuments(documents: Array<{text: string, metadata: Record<string, any>}>) {
  try {
    const allDocs: Document[] = [];
    
    // Process each document
    for (const doc of documents) {
      const chunks = await textSplitter.createDocuments([doc.text], [doc.metadata]);
      allDocs.push(...chunks);
    }
    
    // Add all document chunks to the vector store
    const result = await addDocuments(allDocs);
    
    return {
      success: result,
      count: allDocs.length
    };
  } catch (error: unknown) {
    console.error("Error processing bulk documents:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Expanded YoBot knowledge base for improved responses
export const yobotKnowledgeBase = [
  {
    text: `
    YoBot AI Assistant Tiers - Detailed Comparison

    Starter Tier:
    - Personal assistant foundation with core features
    - Note-taking and reminders with basic organization
    - Simple scheduling for appointments and meetings
    - Voice recognition and response using standard voices
    - Standard response time (typically under 3 seconds)
    - Email integration for reading and drafting emails
    - Mobile app access with basic features
    - Up to 3 custom quick-actions for frequently used commands
    - Basic task prioritization
    - Perfect for individual users and small teams
    
    Pro Tier:
    - Everything in Starter, plus enhanced capabilities
    - Premium voice capabilities with natural conversation flow
    - Advanced scheduling with full calendar integration and conflict resolution
    - CRM integration for customer information and contact management
    - Faster response time (typically under 1 second)
    - Document summarization for emails, articles, and reports
    - Multi-language support (12 languages included)
    - Advanced task categorization and workflow management
    - Custom reminders with intelligent follow-ups
    - Team collaboration features for up to 10 users
    - Mobile and desktop applications with cross-device synchronization
    - Ideal for professionals and growing businesses
    
    Enterprise Tier:
    - Everything in Pro, plus business-focused capabilities
    - Custom voice training for brand consistency
    - Sales call handling with call recording and analysis
    - Meeting transcription with automatic summaries and action items
    - Advanced integrations with enterprise software (ERP, HR systems)
    - Priority support with dedicated technical contact
    - Comprehensive analytics dashboard for productivity insights
    - Advanced security features and admin controls
    - API access for custom integrations
    - Role-based permissions and team management
    - Multi-department deployment support
    - Perfect for medium to large organizations
    
    Platinum Tier:
    - Everything in Enterprise, plus premium executive features
    - Executive assistant capabilities with VIP scheduling
    - Custom AI model training tailored to your business needs
    - Dedicated account manager with quarterly business reviews
    - 24/7 premium support with guaranteed response times
    - Complete workflow automation with custom business process modeling
    - White-labeled solution with custom branding
    - Advanced data analytics and business intelligence
    - Enterprise-wide deployment with unlimited users
    - Customizable security policies and compliance settings
    - Annual strategy sessions with YoBot product team
    - Designed for large enterprises with complex requirements
    `,
    metadata: {
      title: "YoBot AI Assistant Tiers - Detailed Comparison",
      source: "Product Documentation",
      category: "Product Information",
      last_updated: "2025-04-10"
    }
  },
  {
    text: `
    YoBot Voice Assistant Features - Technical Specifications

    Voice Recognition:
    - Advanced natural language processing with 98.7% accuracy
    - Support for over 60 accents and regional dialects
    - Adaptive background noise filtering with 30dB noise reduction
    - Wake word customization with up to 5 phrases (Pro and above)
    - Continuous voice activity detection with 50ms response time
    - Voice command interruption for fluid interactions
    - Contextual command understanding based on conversation history
    
    Voice Output:
    - Ultra-realistic voice synthesis using ElevenLabs technology
    - 15 base voice options included, expandable to 50+ (Pro and above)
    - Customizable voice parameters (pitch, speed, clarity)
    - Voice emotion modeling with 8 distinct emotional tones (Enterprise and above)
    - Dynamic emphasis and inflection based on content meaning
    - Multiple language support with native-quality accent rendering (Pro and above)
    - Real-time voice adjustment based on environmental noise levels
    
    Voice Interaction:
    - Natural interruption handling with graceful conversation resumption
    - Deep contextual understanding across multiple turns of conversation
    - Sophisticated turn-taking with minimal latency (150ms average)
    - Long-form conversation memory spanning days or weeks
    - Voice biometric authentication with 99.6% accuracy (Enterprise and above)
    - Ambient noise adaptation for optimal performance in various environments
    - Proactive voice suggestions based on user patterns and preferences
    `,
    metadata: {
      title: "YoBot Voice Capabilities - Technical Specifications",
      source: "Product Documentation",
      category: "Technical Specifications",
      last_updated: "2025-03-18"
    }
  },
  {
    text: `
    YoBot Use Cases - Real-World Applications

    Personal Assistant:
    - Intelligent scheduling that considers travel time and personal preferences
    - Context-aware reminders that activate at the optimal moment
    - Hierarchical to-do list management with automatic prioritization
    - Real-time note-taking during calls with automatic organization
    - Smart email triage with priority inbox management
    - Natural language search across all personal content
    - Calendar optimization with suggested time management improvements
    
    Business Assistant:
    - Customer service automation with 24/7 availability
    - Sophisticated lead qualification using customizable criteria
    - Intelligent meeting scheduling with automatic time zone adjustment
    - Sales call assistance with real-time information retrieval
    - Automated client follow-ups with personalized messaging
    - Workflow automation for repetitive business processes
    - Document generation from conversation or meeting content
    
    Executive Support:
    - Priority task management aligned with strategic objectives
    - VIP scheduling with intelligent conflict resolution
    - Automated briefing preparation before important meetings
    - Comprehensive travel arrangements with contingency planning
    - High-level decision support with data aggregation and analysis
    - Board meeting preparation and follow-up assistance
    - Strategic initiative tracking and reporting
    
    Sales and Marketing:
    - Intelligent outbound sales calls with product knowledge
    - Systematic lead nurturing with personalized touchpoints
    - Campaign management with performance tracking
    - Customer feedback collection and sentiment analysis
    - Detailed sales analytics with actionable insights
    - Competitive intelligence gathering and organization
    - Content suggestion based on audience engagement metrics
    `,
    metadata: {
      title: "YoBot Use Cases - Real-World Applications",
      source: "Marketing Materials",
      category: "Use Cases",
      last_updated: "2025-02-22"
    }
  },
  {
    text: `
    YoBot Technology Stack - Detailed Architecture

    AI and Machine Learning:
    - OpenAI's GPT-4o model for core natural language understanding
    - Custom fine-tuned models for domain-specific knowledge and tasks
    - Reinforcement learning from human feedback for continuous improvement
    - Multimodal processing capabilities for text, voice, and image inputs
    - Proprietary context retention system for long-term memory
    - Hybrid cloud/edge architecture for optimal performance and privacy
    
    Voice Technology:
    - Advanced speech recognition with proprietary acoustic models
    - Custom wake word detection with minimal false activations
    - Voice synthesis with ElevenLabs' latest neural voice technology
    - Custom voice model training for brand-specific voices (Enterprise and Platinum)
    - Real-time voice analysis for emotion and intent detection
    - Noise-adaptive processing for challenging environments
    - Multilingual capabilities with accent preservation
    
    Integration Capabilities:
    - Deep calendar integration (Google, Outlook, Apple, Proton)
    - Comprehensive CRM platform support (Salesforce, HubSpot, Zoho, Pipedrive)
    - Native integration with communication tools (Slack, Teams, Zoom, Discord)
    - Email service connectivity with threading and context awareness
    - Document management system integration (Google Drive, OneDrive, Dropbox, Box)
    - ERP system connectivity (SAP, Oracle, NetSuite)
    - Custom API integration framework for proprietary systems
    
    Security and Compliance:
    - End-to-end encryption for all data in transit and at rest
    - SOC 2 Type II compliance with annual audits
    - GDPR, CCPA, and HIPAA compliance frameworks
    - Customizable data retention policies with automatic enforcement
    - Role-based access control with fine-grained permissions
    - Comprehensive audit logging for all system activities
    - Regular penetration testing and security assessments
    - Data residency options for global compliance requirements
    `,
    metadata: {
      title: "YoBot Technology Stack - Detailed Architecture",
      source: "Technical Documentation",
      category: "Technical Specifications",
      last_updated: "2025-04-05"
    }
  },
  {
    text: `
    YoBot Implementation Process and Onboarding

    Implementation Timeline:
    - Starter Tier: Immediate self-service activation, fully operational within minutes
    - Pro Tier: 1-2 business days for account setup and integration configuration
    - Enterprise Tier: 1-2 weeks implementation with dedicated onboarding specialist
    - Platinum Tier: 3-4 weeks custom implementation with full technical team support
    
    Onboarding Process:
    - Initial requirements gathering and goal setting
    - System integration planning and configuration
    - User account setup and permission structure
    - Custom configuration of features and capabilities
    - Data migration assistance (if applicable)
    - Initial training sessions for administrators and users
    - Configuration validation and testing
    - Go-live planning and execution
    - Post-implementation review and optimization
    
    Training Resources:
    - Comprehensive documentation and knowledge base
    - Video tutorials for common tasks and features
    - Live webinar sessions for new users (Pro and above)
    - Dedicated training sessions for administrators (Enterprise and Platinum)
    - Custom training materials branded for your organization (Platinum)
    - Regular feature update training sessions
    
    Support Services:
    - Starter: Email support with 48-hour response time, community forums
    - Pro: Email and chat support with 24-hour response time, phone support during business hours
    - Enterprise: Priority support with 4-hour response time, dedicated technical contact
    - Platinum: 24/7 premium support with 1-hour guaranteed response, dedicated account manager
    
    Success Management:
    - Regular usage analytics and adoption reporting
    - Quarterly business reviews (Enterprise and Platinum)
    - Ongoing optimization recommendations
    - Early access to new features and capabilities
    - User feedback collection and implementation
    - ROI tracking and business impact assessment
    `,
    metadata: {
      title: "YoBot Implementation Process and Onboarding",
      source: "Implementation Guide",
      category: "Implementation",
      last_updated: "2025-03-12"
    }
  },
  {
    text: `
    YoBot - Frequently Asked Questions

    Q: How does YoBot compare to other AI assistants on the market?
    A: YoBot differentiates itself through superior voice interaction quality, deeper business system integrations, and a tiered approach that allows organizations to select the perfect balance of features and value. Our specialized focus on both personal productivity and business processes provides a uniquely comprehensive solution.

    Q: What makes YoBot's voice capabilities superior?
    A: YoBot utilizes cutting-edge ElevenLabs voice technology combined with our proprietary conversation management system. This results in exceptionally natural-sounding voices with emotional range, fluid turn-taking in conversations, and accurate understanding even in noisy environments.

    Q: How secure is my data with YoBot?
    A: Security is a top priority at YoBot. All data is encrypted both in transit and at rest. We maintain SOC 2 Type II compliance, adhere to GDPR and other regional privacy regulations, and provide customizable data retention policies. Enterprise and Platinum tiers offer additional security options including private deployments.

    Q: Can YoBot integrate with our existing systems?
    A: Yes, YoBot offers extensive integration capabilities. Out-of-the-box integrations include major calendar systems, CRM platforms, communication tools, email services, and document management systems. Enterprise and Platinum tiers include custom API integration options for proprietary systems.

    Q: What kind of ROI can we expect from implementing YoBot?
    A: Customers typically report significant productivity gains within the first 3 months. On average, users save 5-7 hours per week on administrative tasks, meeting management, and information retrieval. Sales teams using YoBot report 22% higher customer engagement and 15% faster deal closure. Detailed ROI calculators are available for your specific use case.

    Q: How long does implementation take?
    A: Implementation time varies by tier. Starter accounts are self-service and operational within minutes. Pro tier setup takes 1-2 business days. Enterprise implementations typically complete within 1-2 weeks, while Platinum tier custom implementations require 3-4 weeks for full deployment.

    Q: Is training provided for our team?
    A: Yes, all tiers include access to our comprehensive documentation and video tutorials. Pro tier and above include live webinar sessions. Enterprise and Platinum tiers feature dedicated training sessions for administrators and users, with Platinum offering fully customized training materials.
    `,
    metadata: {
      title: "YoBot - Frequently Asked Questions",
      source: "Marketing Materials",
      category: "FAQ",
      last_updated: "2025-04-15"
    }
  }
];

/**
 * Seed the vector database with initial YoBot knowledge
 */
export async function seedKnowledgeBase() {
  try {
    const result = await processBulkDocuments(yobotKnowledgeBase);
    console.log(`Seeded knowledge base with ${result.count} document chunks`);
    return result;
  } catch (error: unknown) {
    console.error("Error seeding knowledge base:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}