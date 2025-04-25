import twilio from 'twilio';
import { log } from './vite';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Twilio client with environment variables
let twilioClient: twilio.Twilio | null = null;

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
    
    // Create TwiML for the call with error handling
    let twiml: any;
    try {
      twiml = new twilio.twiml.VoiceResponse();
      twiml.say(
        { voice: request.voice === 'male' ? 'man' : 'woman' },
        request.script
      );
      
      // If we have a callback URL, add a recording
      if (request.callbackUrl) {
        twiml.record({
          action: request.callbackUrl,
          transcribe: true,
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