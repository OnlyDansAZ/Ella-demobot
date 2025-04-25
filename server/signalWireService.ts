/**
 * SignalWire service for making outbound calls and sending SMS
 * This service combines ElevenLabs high quality voice with SignalWire calling infrastructure
 */

import { CallRecord, callRecordStorage } from './twilioAdvanced';
import { generateSpeech, getVoiceId, ELEVENLABS_AUDIO_DIR } from './elevenLabsService';
import { getClient, createMockClient } from './signalWireClient';
import * as path from 'path';
import * as fs from 'fs';

// Temporary storage for LAML documents
// Maps temporary call IDs to LAML XML documents
// This allows us to serve LAML from a URL endpoint instead of inline
const tempCallLaml = new Map<string, string>();

// Export for use in routes
export const getTempLaml = (id: string): string | undefined => tempCallLaml.get(id);

/**
 * Utility for masking phone numbers in logs
 * Converts +15551234567 to +1555***4567
 */
function maskPhone(phoneNumber: string): string {
  if (!phoneNumber) return 'unknown';
  
  // Clean the phone number
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it's too short, just return it masked
  if (cleaned.length < 7) return '***' + cleaned.slice(-2);
  
  // For normal numbers, mask the middle
  const start = cleaned.slice(0, cleaned.length - 7);
  const middle = '***';
  const end = cleaned.slice(cleaned.length - 4);
  
  return '+' + start + middle + end;
}

/**
 * Exponential backoff retry function
 * @param fn The async function to retry
 * @param retries Maximum number of retries
 * @param delay Initial delay in ms
 * @param backoff Backoff factor
 */
async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 300,
  backoff: number = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // If we have no retries left, throw the error
    if (retries <= 0) throw error;
    
    // For certain errors, don't retry
    if (error.status === 400 || error.status === 401 || error.status === 403) {
      console.error(`Error ${error.status}, not retrying:`, error.message);
      throw error;
    }
    
    // Log the retry attempt
    console.log(`Retrying after error: ${error.message}. Attempts left: ${retries}`);
    
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with backoff
    return retry(fn, retries - 1, delay * backoff, backoff);
  }
}

/**
 * Phone call request interface
 */
export interface PhoneCallRequest {
  to: string;           // The phone number to call
  script: string;       // What Ella should say
  persona: string;      // Which persona is making the call
  voice: string;        // Which voice to use (male/female)
  scheduledTime?: Date; // Optional: when to make the call
  callbackUrl?: string; // Optional: webhook for call status updates
}

/**
 * Make an outbound phone call using SignalWire with ElevenLabs speech
 * This uses a higher quality approach than the Twilio implementation:
 * 1. Generate the audio file with ElevenLabs (ultra-realistic voice)
 * 2. Use SignalWire to call and play the generated audio with better call quality
 * 
 * Enhanced with:
 * - Comprehensive error handling
 * - Fallback mechanisms when audio fails
 * - Detailed logging for debugging
 * - Retry logic for transient errors
 */
export async function makeOutboundCall(request: PhoneCallRequest): Promise<CallRecord | null> {
  const startTime = Date.now();
  const sessionId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Starting outbound call to ${maskPhone(request.to)}`);
  
  try {
    const { to, script, persona = 'default', voice = 'female', scheduledTime, callbackUrl } = request;
    
    // Create a call ID for tracking
    const tempCallId = `temp_${Date.now()}`;
    
    // Create a preliminary call record for UI
    const tempCallRecord: CallRecord = {
      id: tempCallId,
      to,
      from: process.env.SIGNALWIRE_PHONE_NUMBER || 'unknown',
      status: 'preparing',
      script,
      persona,
      voice,
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledTime
    };
    
    // Save the temporary record
    callRecordStorage.saveCall(tempCallRecord);
    
    // Get the SignalWire client
    const client = await getClient().catch(err => {
      console.error('Failed to get SignalWire client, using mock client:', err);
      return createMockClient();
    });
    
    // Create a baseUrl for callbacks and audio playback
    // Using a properly formatted public URL is crucial for SignalWire to reach back
    let baseUrl = process.env.PUBLIC_URL;
    if (!baseUrl) {
      // If running on Replit, use the Replit domains
      if (process.env.REPL_ID && process.env.REPL_SLUG) {
        if (process.env.REPL_OWNER) {
          baseUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
        } else {
          baseUrl = `https://${process.env.REPL_SLUG}.replit.app`;
        }
      } else {
        // Fallback to a local URL
        baseUrl = 'https://workspace.replit.app';
      }
    }
    
    // Log the callback URL we're using
    console.log(`Using callback base URL: ${baseUrl} for audio files and status callbacks`);
    
    // Verify that the URL has a valid format
    try {
      new URL(baseUrl);
    } catch (urlError) {
      console.error(`Invalid base URL format: ${baseUrl}`);
      // Attempt to use a fallback URL if the current one is invalid
      baseUrl = 'https://workspace.replit.app';
      console.log(`Using fallback URL: ${baseUrl}`);
    }
    
    console.log(`Using base URL for callbacks and audio: ${baseUrl}`);
    
    // Generate the audio file with ElevenLabs
    console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Generating ElevenLabs audio for call...`);
    
    // Determine voice ID based on gender preference
    const voiceGender = voice === 'male' ? 'male' : 'female';
    const voiceId = getVoiceId(voiceGender);
    
    // Variables to track audio generation success
    let audioFilename: string | null = null;
    let useElevenLabsAudio = false;
    
    try {
      // Generate the speech with optimized settings for call quality
      // Wrap this in a retry to handle transient ElevenLabs API issues
      audioFilename = await retry(async () => {
        return await generateSpeech(
          script,
          voiceId,
          {
            stability: 0.30,           // Lower stability for more natural expression/emotion
            similarityBoost: 0.80,     // Higher similarity for consistent voice character
            style: 0.65,               // Slightly higher style for more personality
            useSpeakerBoost: true      // Enhanced clarity for phone calls
          }
        );
      }, 2, 1000, 2); // 2 retries, 1s initial delay, doubling
      
      // If we get here, we have a valid audio file
      useElevenLabsAudio = true;
      console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Successfully generated ElevenLabs audio: ${audioFilename}`);
      
      // Update call record to show audio is ready
      callRecordStorage.updateCallStatus(tempCallId, 'audio-ready', {
        updatedAt: new Date()
      });
    } catch (audioError) {
      // Log the error but continue - we'll use the fallback TTS instead
      console.error(`[${new Date().toISOString()}] [SESSION:${sessionId}] [ERROR] Failed to generate ElevenLabs audio:`, 
        audioError instanceof Error ? audioError.message : 'Unknown error');
      console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Falling back to SignalWire TTS`);
      
      // Update call record to show we're using fallback
      callRecordStorage.updateCallStatus(tempCallId, 'using-fallback-tts', {
        updatedAt: new Date()
      });
    }
    
    // Create audio URL if we have an audio file
    const audioUrl = audioFilename ? `${baseUrl}/api/signalwire-audio/${audioFilename}` : null;
    
    // Create LAML with either Play (for ElevenLabs) or Say (fallback)
    // The LAML structure is the same, but we use different tags based on audio availability
    let laml: string;
    
    if (useElevenLabsAudio && audioUrl) {
      // Use Play tag for ElevenLabs high-quality voice (for production with CDN)
      console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Using ElevenLabs audio URL: ${audioUrl}`);
      
      laml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <!-- Using high-quality ElevenLabs voice -->
  <Play>${audioUrl}</Play>
  <Pause length="1"/>
  <Gather input="speech dtmf" timeout="10" action="${baseUrl}/api/phone-call/response" method="POST">
    <Say voice="woman" language="en-US">
      Would you like to learn more about YoBot and what we offer? 
      Say yes or press 1 for pricing information.
      Say no or press 2 to end this call.
    </Say>
  </Gather>
  <Say voice="woman" language="en-US">We didn't receive your response. Thank you for your time. Goodbye.</Say>
</Response>`;
    } else {
      // Fallback to Say tag with SignalWire's built-in TTS
      console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Using fallback SignalWire TTS`);
      
      laml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <!-- Using fallback TTS (ElevenLabs generation failed) -->
  <Say voice="woman" language="en-US">${script}</Say>
  <Pause length="1"/>
  <Gather input="speech dtmf" timeout="10" action="${baseUrl}/api/phone-call/response" method="POST">
    <Say voice="woman" language="en-US">
      Would you like to learn more about YoBot and what we offer? 
      Say yes or press 1 for pricing information.
      Say no or press 2 to end this call.
    </Say>
  </Gather>
  <Say voice="woman" language="en-US">We didn't receive your response. Thank you for your time. Goodbye.</Say>
</Response>`;
    }
    
    // TODO: For production, we need to implement the full solution:
    // 1. Host audio files on a public CDN (S3, Cloudflare R2, etc.)
    // 2. Update LAML to use <Play> with the CDN URL
    // 3. Optimize audio files for telephony (8kHz mono MP3)
    
    // Update call record status
    callRecordStorage.updateCallStatus(tempCallId, 'initiating', {
      updatedAt: new Date()
    });
    
    // Determine callback URL for status updates
    const statusCallback = callbackUrl ? `${baseUrl}${callbackUrl}` : `${baseUrl}/api/phone-call/status-callback`;
    
    // Ensure phone numbers are in the correct format
    // SignalWire is very picky about the formatting - must be E.164 format
    const cleanToNumber = to.replace(/[\s()]/g, '');
    
    // Get the from number and make sure it's in E.164 format
    let cleanFromNumber = (process.env.SIGNALWIRE_PHONE_NUMBER || '').replace(/[\s()]/g, '');
    
    // Make sure it starts with '+' for E.164 format
    if (!cleanFromNumber.startsWith('+')) {
      cleanFromNumber = '+' + cleanFromNumber;
    }
    
    // Remove any dashes or other non-digit characters except the leading +
    cleanFromNumber = '+' + cleanFromNumber.replace(/[^\d]/g, '');
    
    console.log('Making outbound call with phone numbers:');
    console.log('- To:', cleanToNumber);
    console.log('- From:', cleanFromNumber);
    
    // Let's try a different approach - use a URL instead of inline LAML
    // This might improve the call reliability
    
    // First, save the LAML to a temporary endpoint that SignalWire can access
    // This is stored in memory, not in a file
    tempCallLaml.set(tempCallId, laml);
    
    // Create a URL that will serve this LAML when SignalWire requests it
    const lamlUrl = `${baseUrl}/api/signalwire-laml/${tempCallId}`;
    console.log('Using URL to serve LAML:', lamlUrl);
    
    // *** DIRECT HTTP APPROACH ***
    // Completely different approach - direct HTTP request instead of SDK
    console.log('Making direct HTTP request to SignalWire API...');
    console.log('LAML content:', laml);
    
    // Prepare the API endpoint 
    const projectId = process.env.SIGNALWIRE_PROJECT_ID;
    const spaceUrl = process.env.SIGNALWIRE_SPACE_URL;
    const apiEndpoint = `https://${spaceUrl}.signalwire.com/api/laml/2010-04-01/Accounts/${projectId}/Calls.json`;
    
    // Prepare form data for the API call
    const formData = new URLSearchParams();
    formData.append('To', cleanToNumber);
    formData.append('From', cleanFromNumber);
    formData.append('Twiml', laml);
    formData.append('StatusCallback', statusCallback);
    formData.append('StatusCallbackMethod', 'POST');
    formData.append('Timeout', '60');  // 60 seconds before we give up ringing
    formData.append('MachineDetection', 'Enable');
    formData.append('IfMachine', 'Continue');
    formData.append('Record', 'false');
    
    console.log('Making API call to:', apiEndpoint);
    console.log('Request body (form data):', formData.toString());
    
    // Log credentials (partially masked)
    console.log('Using SignalWire credentials:');
    console.log('- Project ID:', projectId ? `${projectId.substring(0, 5)}********` : 'undefined');
    console.log('- Token:', process.env.SIGNALWIRE_TOKEN ? `${process.env.SIGNALWIRE_TOKEN.substring(0, 5)}********` : 'undefined');
    console.log('- Space URL:', spaceUrl);
    
    try {
      // Make the API call with retry logic
      const auth = Buffer.from(`${projectId}:${process.env.SIGNALWIRE_TOKEN}`).toString('base64');
      
      // Use our retry function to handle transient network issues
      const callData = await retry(async () => {
        console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Making API request to SignalWire`);
        
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[${new Date().toISOString()}] [SESSION:${sessionId}] [ERROR] SignalWire API error: ${response.status}`, errorText);
          
          // Create error object with status for retry logic
          const error: any = new Error(`SignalWire API error (${response.status}): ${errorText}`);
          error.status = response.status;
          throw error;
        }
        
        return await response.json();
      }, 3, 500, 2); // 3 retries, starting at 500ms delay, doubling each time
      
      console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] SignalWire call created successfully:`, callData.sid);
      console.log('SignalWire call created successfully:', callData.sid);
      
      // Create a call object that matches the expected format
      const call = {
        sid: callData.sid,
        status: callData.status
      };
      
      // Update record with actual call ID
      const callStatus = call.status || 'queued';
      callRecordStorage.updateCallStatus(tempCallId, callStatus, {
        id: call.sid,
        updatedAt: new Date()
      });
      
      // Create final call record with actual data
      const callRecord: CallRecord = {
        id: call.sid,
        to,
        from: process.env.SIGNALWIRE_PHONE_NUMBER || 'unknown',
        status: callStatus,
        script,
        persona,
        voice,
        createdAt: new Date(),
        updatedAt: new Date(),
        scheduledTime
      };
      
      return callRecordStorage.saveCall(callRecord);
    } catch (error: any) {
      console.error('Error in direct API call to SignalWire:', error);
      throw new Error(`Failed to create call: ${error.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error making outbound call with SignalWire:', error);
    
    // Create a failed call record for tracking
    const failedCall: CallRecord = {
      id: `failed_${Date.now()}`,
      to: request.to,
      from: process.env.SIGNALWIRE_PHONE_NUMBER || 'unknown',
      status: 'failed',
      script: request.script,
      persona: request.persona || 'default',
      voice: request.voice || 'female',
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledTime: request.scheduledTime
    };
    
    // Log the error separately for debugging
    console.error('Call failed with error:', error instanceof Error ? error.message : 'Unknown error');
    
    callRecordStorage.saveCall(failedCall);
    return failedCall;
  }
}

/**
 * Handle SignalWire call status callback
 * This is very similar to the Twilio callback handler
 */
export function handleStatusCallback(callSid: string, status: string, duration?: string, recordingUrl?: string): CallRecord | undefined {
  try {
    // Create updates object with provided data
    const updates: Partial<CallRecord> = { updatedAt: new Date() };
    
    // Parse duration if provided
    if (duration) {
      const durationNum = parseInt(duration, 10);
      if (!isNaN(durationNum)) {
        updates.duration = durationNum;
      }
    }
    
    // Add recording URL if provided
    if (recordingUrl) {
      updates.recordingUrl = recordingUrl;
    }
    
    // Update the call record
    return callRecordStorage.updateCallStatus(callSid, status, updates);
  } catch (error) {
    console.error('Error handling status callback:', error);
    return undefined;
  }
}

/**
 * Send SMS using SignalWire
 */
export async function sendSMS(to: string, body: string, from?: string): Promise<string> {
  const sessionId = `sms_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Starting SMS to ${maskPhone(to)}`);
  
  try {
    // Get the client with retry logic
    const client = await retry(async () => {
      try {
        return await getClient();
      } catch (err) {
        console.error(`[${new Date().toISOString()}] [SESSION:${sessionId}] [ERROR] Failed to get SignalWire client:`, err);
        console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Using mock client for SMS as fallback`);
        return createMockClient();
      }
    }, 2, 1000, 2);
    
    // Set from number to configured SignalWire number if not provided
    let fromNumber = from || process.env.SIGNALWIRE_PHONE_NUMBER;
    
    if (!fromNumber) {
      const errorMsg = 'No from number provided and SIGNALWIRE_PHONE_NUMBER not set';
      console.error(`[${new Date().toISOString()}] [SESSION:${sessionId}] [ERROR] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    // Format for E.164 compliance
    fromNumber = fromNumber.replace(/[\s()]/g, '');
    if (!fromNumber.startsWith('+')) {
      fromNumber = '+' + fromNumber;
    }
    // Remove any dashes or other non-digit characters except the leading +
    fromNumber = '+' + fromNumber.replace(/[^\d]/g, '');
    
    // Format the destination number
    let toNumber = to.replace(/[\s()]/g, '');
    if (!toNumber.startsWith('+')) {
      toNumber = '+' + toNumber;
    }
    // Remove any dashes or other non-digit characters except the leading +
    toNumber = '+' + toNumber.replace(/[^\d]/g, '');
    
    console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] Sending SMS:`);
    console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] - To: ${maskPhone(toNumber)}`);
    console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] - From: ${maskPhone(fromNumber)}`);
    console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] - Message length: ${body.length} characters`);
    
    // Send the message using the properly formatted numbers with retry logic
    const message = await retry(async () => {
      try {
        return await client.messages.create({
          to: toNumber,
          from: fromNumber,
          body
        });
      } catch (err: any) {
        console.error(`[${new Date().toISOString()}] [SESSION:${sessionId}] [ERROR] SignalWire SMS send failed:`, 
          err?.message || 'Unknown error');
        
        // Create error with status for retry logic
        const error: any = new Error(`SMS send failed: ${err?.message || 'Unknown error'}`);
        error.status = err?.status || 500;
        throw error;
      }
    }, 3, 500, 2);
    
    console.log(`[${new Date().toISOString()}] [SESSION:${sessionId}] SMS sent successfully, SID: ${message.sid}`);
    return message.sid;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [SESSION:${sessionId}] [ERROR] Fatal error sending SMS:`, 
      error instanceof Error ? error.message : 'Unknown error');
    throw new Error(`Failed to send SMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}