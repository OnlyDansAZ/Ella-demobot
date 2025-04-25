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
    console.log('Generating ElevenLabs audio for call...');
    
    // Determine voice ID based on gender preference
    const voiceGender = voice === 'male' ? 'male' : 'female';
    const voiceId = getVoiceId(voiceGender);
    
    // Generate the speech with optimized settings for call quality
    const audioFilename = await generateSpeech(
      script,
      voiceId,
      {
        stability: 0.30,           // Lower stability for more natural expression/emotion
        similarityBoost: 0.80,     // Higher similarity for consistent voice character
        style: 0.65,               // Slightly higher style for more personality
        useSpeakerBoost: true      // Enhanced clarity for phone calls
      }
    );
    
    // Update call record to show audio is ready
    callRecordStorage.updateCallStatus(tempCallId, 'audio-ready', {
      updatedAt: new Date()
    });
    
    // Create audio URL that SignalWire can access
    const audioUrl = `${baseUrl}/api/signalwire-audio/${audioFilename}`;
    
    // Create simpler LAML that doesn't rely on streaming audio files
    // Using only SignalWire's built-in Text-to-Speech for reliability
    const laml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <!-- Initial greeting with clear introduction -->
  <Pause length="1"/>
  <Say voice="${voiceGender === 'male' ? 'man' : 'woman'}">Hello, this is an important call from YoBot.</Say>
  <Pause length="1"/>
  
  <!-- Deliver the message using SignalWire's text-to-speech (no external audio file) -->
  <Say voice="${voiceGender === 'male' ? 'man' : 'woman'}">${script}</Say>
  <Pause length="2"/>
  
  <!-- Interactive response gathering with clear instructions -->
  <Gather input="speech dtmf" timeout="8" action="${baseUrl}/api/phone-call/response" method="POST" hints="yes,no,maybe,tell me more">
    <Say voice="${voiceGender === 'male' ? 'man' : 'woman'}">I'll wait a moment if you'd like to respond. You can speak now, or press any key on your phone.</Say>
  </Gather>
  
  <!-- Friendly closing message -->
  <Say voice="${voiceGender === 'male' ? 'man' : 'woman'}">Thank you for your time. You can call this number back at any time to speak with us. Have a wonderful day!</Say>
</Response>`;
    
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
    
    // Make the actual call using URL approach instead of inline LAML
    const call = await client.calls.create({
      to: cleanToNumber,
      from: cleanFromNumber,
      url: lamlUrl,        // Use URL instead of inline LAML
      method: 'GET',       // Method to retrieve the LAML
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
      scheduledTime: request.scheduledTime
      // Note: We can't add an error property as it's not in the CallRecord type
      // We'll log the error separately
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
  try {
    // Get the client
    const client = await getClient().catch(err => {
      console.error('Failed to get SignalWire client, using mock client for SMS:', err);
      return createMockClient();
    });
    
    // Set from number to configured SignalWire number if not provided
    let fromNumber = from || process.env.SIGNALWIRE_PHONE_NUMBER;
    
    if (!fromNumber) {
      throw new Error('No from number provided and SIGNALWIRE_PHONE_NUMBER not set');
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
    
    console.log('Sending SMS with phone numbers:');
    console.log('- To:', toNumber);
    console.log('- From:', fromNumber);
    
    // Send the message using the properly formatted numbers
    const message = await client.messages.create({
      to: toNumber,
      from: fromNumber,
      body
    });
    
    return message.sid;
  } catch (error) {
    console.error('Error sending SMS with SignalWire:', error);
    throw error;
  }
}