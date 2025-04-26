import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from './conversationStorage';

/**
 * Call record structure
 * Represents a phone call made through the system
 */
export interface CallRecord {
  id: string;
  phoneNumber: string;
  duration?: number; // seconds
  timestamp: string;
  status: 'initiated' | 'in-progress' | 'completed' | 'failed';
  personaId?: string;
  transcript?: ChatMessage[];
  notes?: string;
  recordingUrl?: string;
  callSid?: string; // SignalWire call ID
  callbackUrl?: string;
}

/**
 * Storage service for call records
 */
export class CallStorage {
  private calls: Map<string, CallRecord> = new Map();
  private filePath: string = path.join(process.cwd(), 'data', 'calls.json');

  constructor() {
    this.initializeFolder();
    this.loadFromFile();
  }

  /**
   * Initialize the folder structure
   */
  private initializeFolder() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * Load call records from file
   */
  private loadFromFile() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        const calls = JSON.parse(data);
        this.calls = new Map(Object.entries(calls));
        console.log(`[express] Loaded ${this.calls.size} call records from storage`);
      } else {
        console.log('[express] No call records file found, creating a new one');
        this.saveToFile();
      }
    } catch (error) {
      console.error('Error loading call records:', error);
      this.calls = new Map();
    }
  }

  /**
   * Save call records to file
   */
  private saveToFile() {
    try {
      const callsObject = Object.fromEntries(this.calls);
      fs.writeFileSync(this.filePath, JSON.stringify(callsObject, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving call records:', error);
    }
  }

  /**
   * Create a new call record
   */
  async createCall(call: Omit<CallRecord, 'id'>): Promise<CallRecord> {
    const id = uuidv4();
    const newCall: CallRecord = {
      ...call,
      id,
    };

    this.calls.set(id, newCall);
    this.saveToFile();

    return newCall;
  }

  /**
   * Get a call record by ID
   */
  async getCallById(id: string): Promise<CallRecord | undefined> {
    return this.calls.get(id);
  }

  /**
   * Update a call record
   */
  async updateCall(id: string, updates: Partial<CallRecord>): Promise<CallRecord | undefined> {
    const call = this.calls.get(id);
    if (!call) return undefined;

    const updatedCall = { ...call, ...updates };
    this.calls.set(id, updatedCall);
    this.saveToFile();

    return updatedCall;
  }

  /**
   * Delete a call record
   */
  async deleteCall(id: string): Promise<boolean> {
    const result = this.calls.delete(id);
    if (result) {
      this.saveToFile();
    }
    return result;
  }

  /**
   * Get all call records
   */
  async getAllCalls(): Promise<CallRecord[]> {
    return Array.from(this.calls.values());
  }

  /**
   * Get calls by phone number
   */
  async getCallsByPhoneNumber(phoneNumber: string): Promise<CallRecord[]> {
    return Array.from(this.calls.values())
      .filter(call => call.phoneNumber === phoneNumber)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get calls by persona
   */
  async getCallsByPersona(personaId: string): Promise<CallRecord[]> {
    return Array.from(this.calls.values())
      .filter(call => call.personaId === personaId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get completed calls
   */
  async getCompletedCalls(): Promise<CallRecord[]> {
    return Array.from(this.calls.values())
      .filter(call => call.status === 'completed')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get recent calls
   */
  async getRecentCalls(limit: number = 10): Promise<CallRecord[]> {
    return Array.from(this.calls.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Add transcript to call record
   */
  async addTranscriptToCall(id: string, message: ChatMessage): Promise<CallRecord | undefined> {
    const call = this.calls.get(id);
    if (!call) return undefined;

    // Initialize transcript array if it doesn't exist
    if (!call.transcript) {
      call.transcript = [];
    }

    // Add the message to the transcript
    call.transcript.push(message);
    
    // Update the call record
    this.calls.set(id, call);
    this.saveToFile();

    return call;
  }
}

export const callStorage = new CallStorage();