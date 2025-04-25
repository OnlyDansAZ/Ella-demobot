import twilio from 'twilio';
import { log } from './vite';
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import ElevenLabs from 'elevenlabs-node';
import { promisify } from 'util';

// Initialize Twilio client with environment variables
let twilioClient: twilio.Twilio | null = null;

// Initialize ElevenLabs for better voice quality
const elevenLabs = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
});

// Define voice IDs for ElevenLabs
const ELEVEN_LABS_VOICES = {
  female: 'KgleQSAupUuS391XuXpI', // Nicole voice
  male: 'hwGWgfvewDQQTsRdR3sR'    // Matthew voice
};

// Make temp directory for audio files
export const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Helper function for ElevenLabs voice generation using direct API
const generateSpeech = async (text: string, voiceId: string, options: any): Promise<string> => {
  try {
    // Create output file path
    const outputFile = options.outputFileName || path.join(TEMP_DIR, `speech_${Date.now()}.mp3`);
    
    console.log(`Generating ElevenLabs audio to: ${outputFile}`);
    
    // Process text to improve speech readability
    // Replace bullet points and similar characters with proper phrases for better speech
    const processedText = text
      .replace(/•\s*/g, "")      // Remove bullet points completely
      .replace(/\*/g, "")        // Remove asterisks completely
      .replace(/-\s+/g, "")      // Remove hyphens followed by whitespace
      .replace(/^\s*-\s*/gm, "") // Remove hyphens at the beginning of each line
      .replace(/\n\s*-\s*/g, "\n"); // Replace newline-hyphen patterns with just newlines
      
    // Get API key from environment
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ElevenLabs API key is not configured or missing");
    }
    
    // Create a fresh ElevenLabs instance with the API key
    const elevenlabsInstance = new ElevenLabs({
      apiKey: ELEVENLABS_API_KEY,
      voiceId: voiceId // Set the voiceId during initialization
    });
    
    // Configure speech parameters with either persona-specific, user-provided, or defaults
    const stability = options.stability !== undefined ? options.stability : 0.5;
    const similarityBoost = options.similarityBoost !== undefined ? options.similarityBoost : 0.75;
    const style = options.style !== undefined ? options.style : 0.5;
    const useSpeakerBoost = options.useSpeakerBoost !== undefined ? options.useSpeakerBoost : true;
    
    console.log(`Using voice ID: ${voiceId} with parameters:`, { 
      stability, similarityBoost, style, useSpeakerBoost 
    });
    
    // Create a promise to handle the ElevenLabs API call
    return new Promise((resolve, reject) => {
      try {
        // Make direct API call to ElevenLabs following the type definition
        elevenlabsInstance.textToSpeech({
          textInput: processedText,
          fileName: outputFile,
          stability: stability,
          similarityBoost: similarityBoost,
          style: style,
          speakerBoost: useSpeakerBoost,
          modelId: "eleven_turbo_v2"
        }).then((result: any) => {
          console.log("ElevenLabs API response:", result);
          
          // Verify file exists
          if (fs.existsSync(outputFile)) {
            console.log(`Verified ElevenLabs audio file exists: ${outputFile}`);
            const stats = fs.statSync(outputFile);
            console.log(`File size: ${stats.size} bytes`);
            
            if (stats.size === 0) {
              reject(new Error("Generated audio file is empty"));
            } else {
              resolve(outputFile);
            }
          } else {
            reject(new Error(`ElevenLabs audio file not found at expected location: ${outputFile}`));
          }
        }).catch((err: any) => {
          console.error("ElevenLabs API error:", err);
          reject(err);
        });
      } catch (err) {
        console.error("Exception making ElevenLabs API call:", err);
        reject(err);
      }
    });
  } catch (error) {
    console.error('ElevenLabs speech generation error:', error);
    throw error;
  }
};

// Types for phone call requests
export interface PhoneCallRequest {
  to: string;           // The phone number to call
  script: string;       // What Ella should say
  persona: string;      // Which persona is making the call
  voice: string;        // Which voice to use (Twilio voice or ElevenLabs)
  scheduledTime?: Date; // Optional: when to make the call
  callbackUrl?: string; // Optional: webhook for call status updates
}

export interface CallRecord {
  id: string;
  to: string;
  from: string;
  status: string;
  script: string;
  persona: string;
  voice: string;
  duration?: number;
  recordingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  scheduledTime?: Date;
}

// File-backed call records storage
class CallRecordStorage {
  private calls: Map<string, CallRecord> = new Map();
  private filePath: string = path.join(process.cwd(), 'data', 'call-records.json');

  constructor() {
    this.loadFromFile();
  }

  private saveToFile() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const data = JSON.stringify(Array.from(this.calls.values()), null, 2);
    fs.writeFileSync(this.filePath, data);
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const calls = JSON.parse(data) as CallRecord[];
        this.calls = new Map(calls.map(call => [call.id, call]));
        log(`Loaded ${this.calls.size} call records from storage`);
      } else {
        this.calls = new Map();
        log('No existing call records found, starting with empty storage');
      }
    } catch (error) {
      console.error('Error loading call records:', error);
      this.calls = new Map();
    }
  }

  saveCall(call: CallRecord): CallRecord {
    this.calls.set(call.id, call);
    this.saveToFile();
    return call;
  }

  getCall(id: string): CallRecord | undefined {
    return this.calls.get(id);
  }

  updateCallStatus(id: string, status: string, updates: Partial<CallRecord> = {}): CallRecord | undefined {
    const call = this.calls.get(id);
    if (!call) return undefined;
    
    const updatedCall = {
      ...call,
      status,
      updatedAt: new Date(),
      ...updates
    };
    
    this.calls.set(id, updatedCall);
    this.saveToFile();
    return updatedCall;
  }

  getAllCalls(): CallRecord[] {
    return Array.from(this.calls.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getRecentCalls(limit: number = 10): CallRecord[] {
    return this.getAllCalls().slice(0, limit);
  }
}

export const callRecordStorage = new CallRecordStorage();

/**
 * Initialize the Twilio client with account credentials
 */
export function initTwilioClient(): void {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      log('Missing Twilio credentials, client not initialized');
      return;
    }
    
    twilioClient = twilio(accountSid, authToken);
    log('Twilio client initialized successfully');
  } catch (error) {
    console.error('Error initializing Twilio client:', error);
  }
}

/**
 * Make an outbound phone call using Twilio
 */
export async function makeOutboundCall(request: PhoneCallRequest): Promise<CallRecord | null> {
  try {
    // Validate the phone number format
    if (!request.to.match(/^\+?[1-9]\d{1,14}$/)) {
      throw new Error('Invalid phone number format. Please use international format (e.g., +15551234567)');
    }
    
    // Validate the script length
    if (!request.script || request.script.trim().length < 20) {
      throw new Error('Script is too short. Please provide a more detailed message for the call');
    }
    
    // Initialize client if not already done
    if (!twilioClient) {
      initTwilioClient();
    }
    
    // Check if Twilio is properly initialized
    if (!twilioClient) {
      throw new Error('Twilio client not initialized. Please check your Twilio credentials.');
    }
    
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      throw new Error('Missing Twilio phone number. Please set the TWILIO_PHONE_NUMBER environment variable.');
    }
    
    // Create TwiML for the call with enhanced voice quality
    let twiml: any;
    try {
      // Generate a temporary directory for the call audio
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Create enhanced script with pauses and closing message
      const enhancedScript = `${request.script}
      
      [Pause for 1 second]
      
      Is there anything you'd like me to help you with today?
      
      [Pause for 3 seconds]
      
      If you need to reach us later, please don't hesitate to call back or visit our website. Thank you for your time and have a great day!`;
      
      // Determine which ElevenLabs voice to use
      const voiceId = request.voice === 'male' ? 
        ELEVEN_LABS_VOICES.male : 
        ELEVEN_LABS_VOICES.female;
      
      // Create a unique filename for this call
      const audioFilename = `call_${Date.now()}.mp3`;
      const audioFilePath = path.join(tempDir, audioFilename);
      
      console.log(`Generating voice audio with ElevenLabs for call...`);
      
      // Try generating high-quality audio with ElevenLabs
      let elevenLabsSuccess = false;
      try {
        // Generate speech with ElevenLabs (much better quality)
        await generateSpeech(enhancedScript, voiceId, {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.5,
          speakerBoost: true,
          outputFileName: audioFilePath
        });
        
        console.log(`Successfully generated ElevenLabs audio for call: ${audioFilePath}`);
        elevenLabsSuccess = true;
      } catch (elevenLabsError) {
        console.error('Error generating ElevenLabs audio:', elevenLabsError);
        console.log('Falling back to Twilio TTS voice...');
        elevenLabsSuccess = false;
      }
      
      // Create the TwiML response
      twiml = new twilio.twiml.VoiceResponse();
      
      // Add initial pause to prevent immediate hang-up
      twiml.pause({ length: 1 });
      
      if (elevenLabsSuccess) {
        // If we successfully generated ElevenLabs audio, play it
        // Convert the local file path to a publicly accessible URL
        // For Replit, we need to serve this file via Express
        const tempFilename = path.basename(audioFilePath);
        const publicTempUrl = `/temp/${tempFilename}`;
        
        // Play the audio file (higher quality)
        twiml.play({ loop: 1 }, publicTempUrl);
        
        // Add extra pause after the audio file
        twiml.pause({ length: 10 });
        
        // Let the user know we're going to record if they respond
        twiml.say({
          voice: request.voice === 'male' ? 'man' : 'woman',
          language: 'en-US'
        }, "I'm listening if you'd like to respond.");
      } else {
        // Fallback to Twilio voice if ElevenLabs fails
        // Add a pause at the beginning to prevent immediate hang-up
        twiml.pause({ length: 1 });
        
        // Improve speech quality with SSML
        const voiceType = request.voice === 'male' ? 'man' : 'woman';
        const ssmlScript = `
          <speak>
            <prosody rate="medium" pitch="medium">
              ${request.script}
            </prosody>
            
            <break time="1s"/>
            
            <prosody rate="medium" pitch="medium">
              Is there anything you'd like me to help you with today?
            </prosody>
            
            <break time="5s"/>
            
            <prosody rate="medium" pitch="medium">
              Thank you for your time. If you need to reach us later, please don't hesitate to call back or visit our website. Have a great day!
            </prosody>
          </speak>
        `;
        
        // Use SSML for better voice quality with Twilio's TTS
        twiml.say({
          voice: voiceType,
          language: 'en-US'
        }, ssmlScript);
      }
      
      // Add extra pause for the user to respond
      twiml.pause({ length: 15 });
      
      // If we have a callback URL, add a recording
      if (request.callbackUrl) {
        twiml.record({
          action: request.callbackUrl,
          transcribe: true,
          maxLength: 60,
          timeout: 5
        });
      }
    } catch (twimlError) {
      console.error('Error creating TwiML:', twimlError);
      throw new Error('Failed to create call script. Please try again with simpler text.');
    }
    
    // Create a placeholder call record for queued state
    const tempCallId = `temp_${Date.now()}`;
    const tempCallRecord: CallRecord = {
      id: tempCallId,
      to: request.to,
      from: fromNumber,
      status: 'queued',
      script: request.script,
      persona: request.persona,
      voice: request.voice,
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledTime: request.scheduledTime,
    };
    
    // Save the temporary record so UI shows something immediately
    const savedTempRecord = callRecordStorage.saveCall(tempCallRecord);
    
    // Create the call with a timeout for network issues
    const callPromise = twilioClient.calls.create({
      to: request.to,
      from: fromNumber,
      twiml: twiml.toString(),
      statusCallback: request.callbackUrl,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
    });
    
    // Wait for the call to be created
    const call = await callPromise;
    
    // Remove the temporary record by updating its ID to the actual one
    callRecordStorage.updateCallStatus(tempCallId, call.status, {
      id: call.sid,
      updatedAt: new Date(),
    });
    
    // Store the actual call record
    const callRecord: CallRecord = {
      id: call.sid,
      to: request.to,
      from: fromNumber,
      status: call.status,
      script: request.script,
      persona: request.persona,
      voice: request.voice,
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledTime: request.scheduledTime,
    };
    
    return callRecordStorage.saveCall(callRecord);
  } catch (err: any) {
    const error = err as Error & { code?: string, message?: string };
    console.error('Error making outbound call:', error);
    
    // Create a failed call record for better UI feedback
    if (error && typeof error === 'object' && 'code' in error) {
      // This is likely a Twilio API error with more details
      const errorMessage = `${error.message || 'Unknown error'} (Code: ${error.code})`;
      const failedCall: CallRecord = {
        id: `failed_${Date.now()}`,
        to: request.to,
        from: process.env.TWILIO_PHONE_NUMBER || 'unknown',
        status: 'failed',
        script: request.script,
        persona: request.persona,
        voice: request.voice,
        createdAt: new Date(),
        updatedAt: new Date(),
        scheduledTime: request.scheduledTime,
      };
      
      // Save the failed call record so it appears in the history
      return callRecordStorage.saveCall(failedCall);
    }
    
    // Rethrow the error with a friendly message for the client
    const errorMessage = error && typeof error === 'object' && 'message' in error ? 
      error.message : 
      'Failed to initiate the call. Please check your connection and try again.';
    throw new Error(errorMessage);
  }
}

/**
 * Update a call status from a webhook callback
 */
export function handleStatusCallback(callSid: string, status: string, duration?: string, recordingUrl?: string): CallRecord | undefined {
  try {
    // Validate inputs
    if (!callSid) {
      console.error('Missing call SID in status callback');
      return undefined;
    }
    
    if (!status) {
      console.error('Missing status in status callback');
      return undefined;
    }
    
    const updates: Partial<CallRecord> = {};
    
    // Safely parse duration if provided
    if (duration) {
      try {
        updates.duration = parseInt(duration, 10);
        // If parsing resulted in NaN, set a default
        if (isNaN(updates.duration)) {
          updates.duration = 0;
          console.warn(`Invalid duration value provided: ${duration}, defaulting to 0`);
        }
      } catch (e) {
        console.error('Error parsing call duration:', e);
        updates.duration = 0;
      }
    }
    
    if (recordingUrl) {
      updates.recordingUrl = recordingUrl;
    }
    
    // Additional call metadata that might be useful
    updates.updatedAt = new Date();
    
    // Add more detailed status if possible
    let detailedStatus = status;
    
    // Map some common Twilio status codes to more user-friendly terms
    if (status === 'failed') {
      detailedStatus = 'failed';
    } else if (status === 'no-answer') {
      detailedStatus = 'no-answer';
    } else if (status === 'busy') {
      detailedStatus = 'busy';
    } else if (status === 'canceled') {
      detailedStatus = 'canceled';
    }
    
    console.log(`Updating call ${callSid} status to ${detailedStatus}`);
    return callRecordStorage.updateCallStatus(callSid, detailedStatus, updates);
  } catch (err: any) {
    console.error('Error processing status callback:', err);
    return undefined;
  }
}

/**
 * Get call history
 */
export function getCallHistory(limit: number = 10): CallRecord[] {
  return callRecordStorage.getRecentCalls(limit);
}

/**
 * Get a specific call record
 */
export function getCallRecord(callId: string): CallRecord | undefined {
  return callRecordStorage.getCall(callId);
}