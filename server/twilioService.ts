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
    // Initialize client if not already done
    if (!twilioClient) {
      initTwilioClient();
    }
    
    // Check if Twilio is properly initialized
    if (!twilioClient) {
      throw new Error('Twilio client not initialized. Check credentials.');
    }
    
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      throw new Error('Missing Twilio phone number in environment variables');
    }
    
    // Create TwiML for the call
    const twiml = new twilio.twiml.VoiceResponse();
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
    
    // Create the call
    const call = await twilioClient.calls.create({
      to: request.to,
      from: fromNumber,
      twiml: twiml.toString(),
      statusCallback: request.callbackUrl,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
    });
    
    // Store the call record
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
  } catch (error) {
    console.error('Error making outbound call:', error);
    return null;
  }
}

/**
 * Update a call status from a webhook callback
 */
export function handleStatusCallback(callSid: string, status: string, duration?: string, recordingUrl?: string): CallRecord | undefined {
  const updates: Partial<CallRecord> = {};
  
  if (duration) {
    updates.duration = parseInt(duration, 10);
  }
  
  if (recordingUrl) {
    updates.recordingUrl = recordingUrl;
  }
  
  return callRecordStorage.updateCallStatus(callSid, status, updates);
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