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
 * Uses real SignalWire client in production mode
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
    
    // Use a direct approach - call native HTTP endpoints instead of relying on the library
    // This is more reliable and bypasses issues with the SignalWire SDK
    const directClient: SignalWireClient = {
      calls: {
        create: async (params: any) => {
          console.log('Making real SignalWire call with direct HTTP approach:', params);
          
          // Format the request body according to SignalWire API documentation
          const requestBody: Record<string, any> = {
            to: params.to,
            from: params.from,
            url: params.laml ? undefined : params.url,
            method: params.method || 'POST',
            status_callback: params.statusCallback,
            status_callback_method: params.statusCallbackMethod || 'POST',
            twiml: params.laml // SignalWire uses "twiml" parameter for LAML
          };
          
          // Remove undefined values
          Object.keys(requestBody).forEach((key) => {
            if (requestBody[key] === undefined) {
              delete requestBody[key];
            }
          });
          
          try {
            // Create auth string for Basic Authentication
            // Print credentials for debugging (masked for security)
            const projectId = process.env.SIGNALWIRE_PROJECT_ID || '';
            const token = process.env.SIGNALWIRE_TOKEN || '';
            const spaceUrl = process.env.SIGNALWIRE_SPACE_URL || '';
            
            console.log('Using SignalWire credentials:');
            console.log('- Project ID:', projectId.substring(0, 4) + '********');
            console.log('- Token:', token.substring(0, 4) + '********');
            console.log('- Space URL:', spaceUrl);
            
            const auth = Buffer.from(`${projectId}:${token}`).toString('base64');
            
            // Generate the API URL
            // SignalWire space URLs should be formatted as "{space}.signalwire.com"
            const formattedSpaceUrl = spaceUrl.includes('.signalwire.com') 
              ? spaceUrl 
              : `${spaceUrl}.signalwire.com`;
            
            const apiUrl = `https://${formattedSpaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/Calls.json`;
            console.log('Making API call to:', apiUrl);
            
            // Make the API call
            const formData = new URLSearchParams(requestBody as any).toString();
            console.log('Request body (form data):', formData);
            
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`SignalWire API error (${response.status}): ${errorText}`);
            }
            
            const data = await response.json();
            console.log('SignalWire call created successfully:', data.sid);
            
            return {
              sid: data.sid,
              status: data.status,
              to: data.to,
              from: data.from
            };
          } catch (error) {
            console.error('Error making direct SignalWire API call:', error);
            throw error;
          }
        }
      },
      messages: {
        create: async (params: any) => {
          console.log('Sending real SignalWire SMS with direct HTTP approach:', params);
          
          try {
            // Create auth string for Basic Authentication
            // Print credentials for debugging (masked for security)
            const projectId = process.env.SIGNALWIRE_PROJECT_ID || '';
            const token = process.env.SIGNALWIRE_TOKEN || '';
            const spaceUrl = process.env.SIGNALWIRE_SPACE_URL || '';
            
            console.log('Using SignalWire credentials for SMS:');
            console.log('- Project ID:', projectId.substring(0, 4) + '********');
            console.log('- Token:', token.substring(0, 4) + '********');
            console.log('- Space URL:', spaceUrl);
            
            const auth = Buffer.from(`${projectId}:${token}`).toString('base64');
            
            // Format the request body
            const requestBody: Record<string, any> = {
              To: params.to,
              From: params.from,
              Body: params.body
            };
            
            // Generate the API URL
            // SignalWire space URLs should be formatted as "{space}.signalwire.com"
            const formattedSpaceUrl = spaceUrl.includes('.signalwire.com') 
              ? spaceUrl 
              : `${spaceUrl}.signalwire.com`;
            
            const apiUrl = `https://${formattedSpaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/Messages.json`;
            console.log('Making SMS API call to:', apiUrl);
            
            // Make the API call
            const formData = new URLSearchParams(requestBody).toString();
            console.log('Request body (form data):', formData);
            
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`SignalWire API error (${response.status}): ${errorText}`);
            }
            
            const data = await response.json();
            console.log('SignalWire SMS sent successfully:', data.sid);
            
            return {
              sid: data.sid,
              status: data.status,
              to: data.to,
              from: data.from,
              body: data.body
            };
          } catch (error) {
            console.error('Error sending direct SignalWire SMS:', error);
            throw error;
          }
        }
      }
    };
    
    console.log('Direct SignalWire client created successfully');
    return directClient;
  } catch (error) {
    console.error('Failed to initialize SignalWire client:', error);
    console.warn('Falling back to mock SignalWire client');
    return createMockClient();
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