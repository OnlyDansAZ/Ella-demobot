/**
 * SignalWire service for making outbound calls and sending SMS
 * This service combines ElevenLabs high quality voice with SignalWire calling infrastructure
 */

import { CallRecord, callRecordStorage } from './twilioAdvanced';
import { generateSpeech, getVoiceId } from './elevenLabsService';
import { getClient, createMockClient } from './signalWireClient';

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
 */
export async function makeOutboundCall(request: PhoneCallRequest): Promise<CallRecord | null> {
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
    let baseUrl = process.env.PUBLIC_URL;
    if (!baseUrl) {
      baseUrl = `https://${process.env.REPL_SLUG}.replit.app`;
    }
    
    // Generate the audio file with ElevenLabs
    console.log('Generating ElevenLabs audio for call...');
    
    // Determine voice ID based on gender preference
    const voiceGender = voice === 'male' ? 'male' : 'female';
    const voiceId = getVoiceId(voiceGender);
    
    // Generate the speech
    const audioFilename = await generateSpeech(
      script,
      voiceId,
      {
        stability: 0.35,           // Lower for more natural speech pattern variation
        similarityBoost: 0.75,     // Higher for more consistent voice
        style: 0.6,                // Moderate style injection
        useSpeakerBoost: true      // Enhance speaker clarity
      }
    );
    
    // Update call record to show audio is ready
    callRecordStorage.updateCallStatus(tempCallId, 'audio-ready', {
      updatedAt: new Date()
    });
    
    // Create audio URL that SignalWire can access
    const audioUrl = `${baseUrl}/api/signalwire-audio/${audioFilename}`;
    
    // Create LAML (SignalWire's XML) document
    const laml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voiceGender === 'male' ? 'man' : 'woman'}">Hello, this is ${persona} from YoBot. One moment please.</Say>
  <Play>${audioUrl}</Play>
  <Pause length="1"/>
  <Gather input="speech" timeout="5" action="${baseUrl}/api/phone-call/response" method="POST">
    <Say voice="${voiceGender === 'male' ? 'man' : 'woman'}">I'll pause for a moment if you'd like to respond.</Say>
  </Gather>
  <Say voice="${voiceGender === 'male' ? 'man' : 'woman'}">I understand you might be busy. I'll try reaching out at a better time. Have a great day!</Say>
</Response>`;
    
    // Update call record status
    callRecordStorage.updateCallStatus(tempCallId, 'initiating', {
      updatedAt: new Date()
    });
    
    // Determine callback URL for status updates
    const statusCallback = callbackUrl ? `${baseUrl}${callbackUrl}` : `${baseUrl}/api/phone-call/status-callback`;
    
    // Make the actual call
    const call = await client.calls.create({
      to,
      from: process.env.SIGNALWIRE_PHONE_NUMBER || '',
      laml,
      statusCallback,
      statusCallbackMethod: 'POST'
    });
    
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
      scheduledTime: request.scheduledTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
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
  try {
    // Get the client
    const client = await getClient().catch(err => {
      console.error('Failed to get SignalWire client, using mock client for SMS:', err);
      return createMockClient();
    });
    
    // Set from number to configured SignalWire number if not provided
    const fromNumber = from || process.env.SIGNALWIRE_PHONE_NUMBER;
    
    if (!fromNumber) {
      throw new Error('No from number provided and SIGNALWIRE_PHONE_NUMBER not set');
    }
    
    // Send the message
    const message = await client.messages.create({
      to,
      from: fromNumber,
      body
    });
    
    return message.sid;
  } catch (error) {
    console.error('Error sending SMS with SignalWire:', error);
    throw error;
  }
}