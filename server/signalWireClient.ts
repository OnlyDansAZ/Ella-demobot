/**
 * Simplified SignalWire client wrapper
 * Using dynamic import to handle ESM module issues
 */

// Define client interface for TypeScript
export interface SignalWireClient {
  calls: {
    create: (params: any) => Promise<any>;
  };
  messages: {
    create: (params: any) => Promise<any>;
  };
}

// Singleton instance
let clientInstance: SignalWireClient | null = null;

/**
 * Create a SignalWire client instance
 */
export async function createClient(): Promise<SignalWireClient> {
  try {
    // Check required environment variables
    if (!process.env.SIGNALWIRE_PROJECT_ID) {
      throw new Error('SIGNALWIRE_PROJECT_ID environment variable not set');
    }
    
    if (!process.env.SIGNALWIRE_TOKEN) {
      throw new Error('SIGNALWIRE_TOKEN environment variable not set');
    }
    
    if (!process.env.SIGNALWIRE_SPACE_URL) {
      throw new Error('SIGNALWIRE_SPACE_URL environment variable not set');
    }
    
    console.log('Initializing SignalWire client...');
    
    // Dynamically import the SignalWire module
    // This can help with ESM/CJS compatibility issues
    const signalwireModule = await import('@signalwire/node');
    
    // Create client
    // @ts-ignore - Types might be incomplete but we know the structure
    const client = new signalwireModule.RestClient(
      process.env.SIGNALWIRE_PROJECT_ID,
      process.env.SIGNALWIRE_TOKEN,
      { signalwireSpaceUrl: process.env.SIGNALWIRE_SPACE_URL }
    );
    
    console.log('SignalWire client initialized successfully');
    
    return client as unknown as SignalWireClient;
  } catch (error) {
    console.error('Failed to initialize SignalWire client:', error);
    throw error;
  }
}

/**
 * Get the SignalWire client (singleton)
 */
export async function getClient(): Promise<SignalWireClient> {
  if (!clientInstance) {
    clientInstance = await createClient();
  }
  return clientInstance;
}

/**
 * Alternative way to create mock client for testing
 * Use this if SignalWire integration is having issues
 */
export function createMockClient(): SignalWireClient {
  console.warn('Creating MOCK SignalWire client for testing');
  
  return {
    calls: {
      create: async (params) => {
        console.log('MOCK SignalWire call:', params);
        return {
          sid: `mock_call_${Date.now()}`,
          status: 'queued',
          to: params.to,
          from: params.from,
        };
      }
    },
    messages: {
      create: async (params) => {
        console.log('MOCK SignalWire SMS:', params);
        return {
          sid: `mock_sms_${Date.now()}`,
          status: 'sent',
          to: params.to,
          from: params.from,
          body: params.body,
        };
      }
    }
  };
}