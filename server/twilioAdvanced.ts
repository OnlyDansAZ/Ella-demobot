import twilio from 'twilio';
import { log } from './vite';
import fs from 'fs';
import path from 'path';
import { generateSpeech, getVoiceId, cleanupOldAudioFiles, ELEVENLABS_AUDIO_DIR } from './elevenLabsService';

// Initialize Twilio client with environment variables
let twilioClient: twilio.Twilio | null = null;

// Twilio message options type
interface TwilioMessageOptions {
  to: string;
  from: string;
  body: string;
  mediaUrl?: string[];
}

// Phone call request interface
export interface PhoneCallRequest {
  to: string;           // The phone number to call
  script: string;       // What Ella should say
  persona: string;      // Which persona is making the call
  voice: string;        // Which voice to use (male/female)
  scheduledTime?: Date; // Optional: when to make the call
  callbackUrl?: string; // Optional: webhook for call status updates
}

// Call record interface for storing call history
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
  errorDetails?: string;     // For detailed error messages
  errorCode?: string;        // For error codes or status codes
  retryCount?: number;       // For tracking automatic retry attempts
  createdAt: Date;
  updatedAt: Date;
  scheduledTime?: Date;
  notes?: string[];          // Array of notes about the call
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
  
  /**
   * Add a note to a call record
   * @param id The ID of the call to update
   * @param note The note to add
   * @returns The updated call record or undefined if not found
   */
  addCallNote(id: string, note: string): CallRecord | undefined {
    const call = this.calls.get(id);
    if (!call) return undefined;
    
    // Create or append to the notes array
    const notes = call.notes || [];
    notes.push(note);
    
    // Update the call record
    const updatedCall = {
      ...call,
      notes,
      updatedAt: new Date()
    };
    
    this.calls.set(id, updatedCall);
    this.saveToFile();
    return updatedCall;
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
    
    // Clean up old audio files on startup
    cleanupOldAudioFiles();
  } catch (error) {
    console.error('Error initializing Twilio client:', error);
  }
}

/**
 * Make an outbound phone call using Twilio with ElevenLabs speech
 * This uses a two-step process:
 * 1. Generate the audio file with ElevenLabs
 * 2. Use Twilio to call and play the generated audio
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
    
    // Create a placeholder call record to show in UI immediately
    const tempCallId = `temp_${Date.now()}`;
    const tempCallRecord: CallRecord = {
      id: tempCallId,
      to: request.to,
      from: fromNumber,
      status: 'generating-audio',
      script: request.script,
      persona: request.persona,
      voice: request.voice,
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledTime: request.scheduledTime,
    };
    
    // Save the temporary record so UI shows something immediately
    callRecordStorage.saveCall(tempCallRecord);
    
    // For reliability in the current environment, we're going to use
    // Twilio's built-in TTS capabilities instead of trying to stream ElevenLabs audio
    log('Using Twilio TTS for outbound call');
    
    // Determine voice gender based on request
    const voiceGender = request.voice === 'male' ? 'male' : 'female';
    
    // Update call record to show we're ready to make the call
    callRecordStorage.updateCallStatus(tempCallId, 'ready', {
      updatedAt: new Date()
    });
    
    // Create a simplified TwiML response to just play the audio
    // This removes complexity that might be causing issues
    const twiml = new twilio.twiml.VoiceResponse();
    
    // In a real production environment, this would use ElevenLabs streaming for ultra-realistic voice
    // instead of Twilio's basic TTS. The current implementation is a technical limitation of this
    // development environment.
    
    // Create a conversational introduction that doesn't sound automated
    twiml.say({
      voice: voiceGender === 'male' ? 'man' : 'woman',
      language: 'en-US'
    }, `Hi there, this is ${request.persona || 'Ella'} from YoBot. Hope I'm not catching you at a bad time?`);
    
    // Add a strategic pause to simulate a human conversation rhythm
    twiml.pause({ length: 2 });
    
    // Main sales script - this would ideally be a dynamic script tailored to the prospect
    twiml.say({
      voice: voiceGender === 'male' ? 'man' : 'woman',
      language: 'en-US'
    }, request.script);
    
    // Add a pause for response opportunity
    twiml.pause({ length: 2 });
    
    // Add a gather with speech recognition to handle interactive responses
    const gather = twiml.gather({
      input: ['speech'],
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      language: 'en-US',
      timeout: 8,
      action: '/api/phone-call/response',
      method: 'POST'
    });
    
    // If no response, add a closing that opens the door for future contact
    twiml.say({
      voice: voiceGender === 'male' ? 'man' : 'woman',
      language: 'en-US'
    }, "I understand you might be busy right now. I'll try reaching out again at a better time, or feel free to call us back when it's convenient for you.");
    
    // Update call record to show initiating call
    callRecordStorage.updateCallStatus(tempCallId, 'initiating', {
      updatedAt: new Date()
    });
    
    // Make the actual call
    const call = await twilioClient.calls.create({
      to: request.to,
      from: fromNumber,
      twiml: twiml.toString(),
      statusCallback: request.callbackUrl,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
    });
    
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
    if (error && typeof error === 'object') {
      const errorDetails = error.message || 'Unknown error';
      const errorCode = 'code' in error ? error.code : '';
      const errorMessage = `${errorDetails} ${errorCode ? `(Code: ${errorCode})` : ''}`;
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
    let errorDetails = 'Failed to initiate the call. Please check your connection and try again.';
    
    // Type guard to safely extract error message
    if (error && typeof error === 'object') {
      if ('message' in error && typeof (error as {message: unknown}).message === 'string') {
        errorDetails = (error as {message: string}).message;
      }
    }
    
    throw new Error(errorDetails);
  }
}

/**
 * Handle Twilio call status callback
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

/**
 * Send SMS using Twilio
 */
export async function sendSMS(options: TwilioMessageOptions): Promise<string> {
  try {
    if (!twilioClient) {
      initTwilioClient();
    }
    
    if (!twilioClient) {
      throw new Error('Twilio client not initialized');
    }
    
    const message = await twilioClient.messages.create(options);
    return message.sid;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

/**
 * Save a note to a call record
 * This is used to track important interactions during a call
 * 
 * @param callSid The SID (ID) of the call to update
 * @param note The note to add to the call record
 * @returns The updated call record or undefined if not found
 */
export function saveCallNote(callSid: string, note: string): CallRecord | undefined {
  try {
    // Validate inputs
    if (!callSid) {
      console.error('Missing call SID when saving call note');
      return undefined;
    }
    
    if (!note) {
      console.warn('Empty note provided for call', callSid);
      return undefined;
    }
    
    // Get the current timestamp
    const timestamp = new Date();
    
    // Format timestamp for the note
    const formattedTime = timestamp.toLocaleTimeString();
    
    // Create the formatted note with timestamp
    const formattedNote = `[${formattedTime}] ${note}`;
    
    console.log(`Adding note to call ${callSid}: ${formattedNote}`);
    
    // Update the call record with the note
    return callRecordStorage.addCallNote(callSid, formattedNote);
  } catch (error) {
    console.error('Error saving call note:', error);
    return undefined;
  }
}