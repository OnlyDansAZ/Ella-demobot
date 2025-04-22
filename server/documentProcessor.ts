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

// Sample YoBot knowledge base for initial seeding
export const yobotKnowledgeBase = [
  {
    text: `
    YoBot AI Assistant Tiers

    Starter Tier:
    - Basic personal assistant features
    - Note-taking and reminders
    - Simple scheduling capabilities
    - Voice recognition and response
    - Standard response time
    - Email integration
    
    Pro Tier:
    - Everything in Starter
    - Enhanced voice capabilities with natural conversation
    - Advanced scheduling with calendar integration
    - CRM integration for customer information
    - Faster response time
    - Document summarization
    - Multi-language support
    
    Enterprise Tier:
    - Everything in Pro
    - Custom voice training
    - Sales call handling capabilities
    - Meeting transcription and summaries
    - Advanced integrations with enterprise software
    - Priority support
    - Analytics dashboard
    
    Platinum Tier:
    - Everything in Enterprise
    - Executive assistant capabilities
    - Custom AI model training
    - Dedicated account manager
    - 24/7 premium support
    - Complete workflow automation
    - White-labeled solution
    `,
    metadata: {
      title: "YoBot AI Assistant Tiers",
      source: "Product Documentation",
      category: "Product Information"
    }
  },
  {
    text: `
    YoBot Voice Assistant Features

    Voice Recognition:
    - Natural language processing with high accuracy
    - Accent and dialect understanding
    - Background noise filtering
    - Wake word customization (Pro and above)
    - Voice activity detection
    
    Voice Output:
    - Natural-sounding voices using ElevenLabs technology
    - Customizable voice selection (Pro and above)
    - Adjustable speaking rate and tone
    - Emotion and emphasis in speech (Enterprise and above)
    - Multiple language support (Pro and above)
    
    Voice Interaction:
    - Interruption handling
    - Contextual understanding
    - Turn-taking in conversations
    - Long-form conversation memory
    - Voice biometric authentication (Enterprise and above)
    `,
    metadata: {
      title: "YoBot Voice Capabilities",
      source: "Product Documentation",
      category: "Technical Specifications"
    }
  },
  {
    text: `
    YoBot Use Cases

    Personal Assistant:
    - Scheduling appointments and meetings
    - Setting reminders and alarms
    - Managing to-do lists
    - Taking notes during calls
    - Sending and reading emails
    
    Business Assistant:
    - Customer service automation
    - Lead qualification calls
    - Meeting scheduling and rescheduling
    - Sales call assistance
    - Client follow-ups
    
    Executive Support:
    - Priority task management
    - VIP scheduling
    - Briefing preparation
    - Travel arrangements
    - High-level decision support
    
    Sales and Marketing:
    - Outbound sales calls
    - Lead nurturing
    - Campaign management
    - Customer feedback collection
    - Sales analytics and reporting
    `,
    metadata: {
      title: "YoBot Use Cases",
      source: "Marketing Materials",
      category: "Use Cases"
    }
  },
  {
    text: `
    YoBot Technology Stack

    AI and Machine Learning:
    - OpenAI's GPT-4o for natural language understanding
    - Custom training for domain-specific knowledge
    - Reinforcement learning from human feedback
    
    Voice Technology:
    - Speech recognition with Web Speech API
    - Voice synthesis with ElevenLabs
    - Custom voice model training (Enterprise and Platinum)
    
    Integration Capabilities:
    - Calendar systems (Google, Outlook, Apple)
    - CRM platforms (Salesforce, HubSpot, Zoho)
    - Communication tools (Slack, Teams, Zoom)
    - Email services
    - Document management systems
    
    Security:
    - End-to-end encryption
    - SOC 2 compliance
    - GDPR compliance
    - Custom data retention policies
    - Role-based access control
    `,
    metadata: {
      title: "YoBot Technology Stack",
      source: "Technical Documentation",
      category: "Technical Specifications"
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