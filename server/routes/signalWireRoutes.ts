import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { WebSocket } from 'ws';
import { CallRecord, callRecordStorage, TranscriptEntry } from '../twilioAdvanced';
import { 
  getCallHistory, 
  getCallRecord,
  saveCallNote
} from '../twilioAdvanced';  // We'll keep using the same call history storage
import { generateSpeech, getVoiceId, ELEVENLABS_AUDIO_DIR } from '../elevenLabsService';
import { makeOutboundCall, handleStatusCallback, PhoneCallRequest, getTempLaml } from '../signalWireService';
import { conversationStorage } from '../conversationStorage';

// In-memory store of active call transcripts for WebSocket updates
// Maps call SID to array of transcript entries
const activeCallTranscripts = new Map<string, TranscriptEntry[]>();

const router: express.Router = express.Router();

/**
 * Make an outbound phone call using SignalWire
 * POST /api/phone-call
 */
router.post('/phone-call', async (req: Request, res: Response): Promise<void> => {
  try {
    const { to, script, persona = 'default', voice = 'female' } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!script) {
      return res.status(400).json({ error: 'Script is required' });
    }

    // Prepare callback URL for call status updates
    // In production this would be a full URL, but for local dev we use a relative path
    const callbackUrl = req.body.callbackUrl || '/api/phone-call/status-callback';

    // Create the call request
    const callRequest: PhoneCallRequest = {
      to,
      script,
      persona,
      voice,
      callbackUrl
    };

    // Optional: scheduled time
    if (req.body.scheduledTime) {
      callRequest.scheduledTime = new Date(req.body.scheduledTime);
    }

    // Make the call using SignalWire service
    try {
      const callRecord = await makeOutboundCall(callRequest);
      return res.json(callRecord);
    } catch (callError) {
      console.error('Error making SignalWire call:', callError);

      // Return the error
      return res.status(500).json({ 
        error: callError instanceof Error ? callError.message : 'Unknown error occurred'
      });
    }
  } catch (error) {
    console.error('Error processing phone call request:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Handle status callbacks from SignalWire
 * POST /api/phone-call/status-callback
 */
router.post('/phone-call/status-callback', async (req: Request, res: Response): Promise<void> => {
  try {
    // SignalWire uses similar parameter names to Twilio
    const { 
      CallSid, 
      CallStatus, 
      CallDuration, 
      RecordingUrl,
      ErrorCode,
      ErrorMessage 
    } = req.body;

    if (!CallSid || !CallStatus) {
      return res.status(400).json({ error: 'Invalid callback data' });
    }

    console.log(`Call ${CallSid} status update: ${CallStatus}`);

    // Extract error information if present
    let errorType = undefined;

    // Determine error type from status and error code if available
    if (CallStatus.toLowerCase().includes('failed') || ErrorCode) {
      if (ErrorCode === '31201' || ErrorCode === '31607') {
        errorType = 'invalid-number';
      } else if (ErrorCode === '31204') {
        errorType = 'unreachable';
      } else if (ErrorCode) {
        errorType = `error-${ErrorCode}`;
      }
    }

    // Use the SignalWireService handleStatusCallback helper with error information
    const updatedRecord = handleStatusCallback(
      CallSid, 
      CallStatus, 
      CallDuration, 
      RecordingUrl,
      errorType,
      ErrorCode,
      ErrorMessage
    );

    // Check if the call is completed or has failed/errored, then reset memory for stateless memory mode
    if (CallStatus.toLowerCase() === 'completed' || 
        CallStatus.toLowerCase() === 'failed' || 
        CallStatus.toLowerCase() === 'busy' || 
        CallStatus.toLowerCase() === 'no-answer' ||
        CallStatus.toLowerCase() === 'canceled') {

      try {
        // Import conversationStorage here to avoid circular dependency
        const { conversationStorage } = require('../conversationStorage');

        // Use the call ID as the session ID for memory management
        const sessionId = CallSid;

        // Reset memory for stateless personas (no-op for persistent memory)
        await conversationStorage.resetStatelessSession(sessionId);

        console.log(`Memory management: Call ${CallSid} ended with status ${CallStatus}. Memory cleaned if stateless.`);

        // Add a fallback timeout task to double-check memory reset in case this call fails
        setTimeout(async () => {
          try {
            // Get the current session to check if it was properly reset
            const session = await conversationStorage.getOrCreateSession(sessionId);
            const { personaManager } = require('../personaManager');
            const persona = personaManager.getSessionPersona(sessionId);

            // If the persona is stateless and still has messages, try again
            if (persona.memoryMode === 'stateless' && session.messages.length > 0) {
              console.log(`Memory management fallback: Re-attempting memory cleanup for call ${CallSid}`);
              await conversationStorage.resetStatelessSession(sessionId);
            }
          } catch (fallbackError) {
            console.error(`Fallback memory cleanup error for call ${CallSid}:`, fallbackError);
          }
        }, 5000); // 5 second fallback timeout
      } catch (memoryError) {
        console.error(`Error handling memory cleanup for call ${CallSid}:`, memoryError);

        // Critical error recovery path - attempt to force cleanup
        try {
          const { conversationStorage } = require('../conversationStorage');
          console.log(`Memory management critical path: Forcing memory cleanup for call ${CallSid}`);
          await conversationStorage.clearMessages(CallSid);
        } catch (criticalError) {
          console.error(`Critical memory cleanup failure for call ${CallSid}:`, criticalError);
        }
      }
    }

    // Respond with success to SignalWire (use XML format as expected)
    res.setHeader('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  } catch (error) {
    console.error('Error processing status callback:', error);

    // Still return a valid LAML response to SignalWire
    res.setHeader('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  }
});

/**
 * Handle speech response from user during call
 * POST /api/phone-call/response
 */
router.post('/phone-call/response', (req: Request, res: Response): void => {
  try {
    console.log('🔊 CALL RESPONSE RECEIVED:', req.body);

    // Get the user's speech input or DTMF (keypad) input
    const { SpeechResult, Digits } = req.body;

    // Get a base URL for callbacks
    let baseUrl = process.env.PUBLIC_URL;
    if (!baseUrl) {
      if (process.env.REPL_SLUG) {
        baseUrl = `https://${process.env.REPL_SLUG}.replit.app`;
      } else {
        baseUrl = 'https://workspace.replit.app';
      }
    }

    // Create response with LAML (SignalWire's equivalent to TwiML)
    let laml = '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n';

    // Add a small pause for more natural conversation flow
    laml += '  <Pause length="1"/>\n';

    // Check for user input (either speech or keypad)
    const userInput = SpeechResult?.toLowerCase() || '';
    const digitInput = Digits || '';

    // Log what we received
    console.log(`User said: "${userInput || '<nothing>'}", Pressed: "${digitInput || '<nothing>'}"`);

    // Determine if this is a "yes" response
    const isYes = 
      userInput.includes('yes') || 
      userInput.includes('yeah') || 
      userInput.includes('sure') || 
      userInput.includes('okay') || 
      digitInput === '1';

    // Determine if this is a "no" response
    const isNo = 
      userInput.includes('no') || 
      userInput.includes('nope') || 
      userInput.includes('not') || 
      digitInput === '2';

    if (isYes) {
      // They want pricing information
      const pricingInfo = `
        Our pricing starts with our Starter package at five thousand dollars plus 
        a monthly fee of four hundred ninety-nine dollars. This includes 24/7 
        customer service, appointment scheduling, and basic lead follow-up.

        Our Pro package is eight thousand dollars with a seven hundred ninety-nine 
        dollar monthly fee. This adds advanced reporting, CRM integration, and 
        custom voice training.

        For enterprise solutions, we offer custom pricing based on your specific needs.
      `;

      laml += `  <Say voice="woman" language="en-US">${pricingInfo}</Say>\n`;
      laml += '  <Pause length="1"/>\n';

      // Ask if they want to be connected to sales
      laml += '  <Gather input="speech dtmf" timeout="7" action="/api/phone-call/sales-connect" method="POST">\n';
      laml += '    <Say voice="woman" language="en-US">Would you like to be connected to our sales team to discuss which package would work best for your business? Say yes or press 1 to connect now.</Say>\n';
      laml += '  </Gather>\n';

      // Fallback if no response
      laml += '  <Say voice="woman" language="en-US">We didn\'t hear a response. Thank you for your interest in YoBot. We\'ll follow up with you shortly. Have a great day!</Say>\n';
    } 
    else if (isNo) {
      // They declined more information
      laml += '  <Say voice="woman" language="en-US">No problem at all. Thank you for your time today. If you have any questions in the future, please don\'t hesitate to reach out. Have a wonderful day!</Say>\n';
    }
    else if (SpeechResult || Digits) {
      // They said something else - handle common queries
      let responseText = "I understand. Let me share a bit more about what makes YoBot special. Our AI assistant Ella is designed to sound completely natural and can handle complex sales conversations that convert leads into customers. Would you like to hear more about specific features?";

      // Check for specific topics
      if (userInput.includes('price') || userInput.includes('cost') || userInput.includes('expensive') || userInput.includes('how much')) {
        responseText = "Our pricing is very competitive. We offer multiple tiers starting with our Starter package at five thousand dollars plus a monthly fee of four hundred ninety-nine dollars. Would you like more detailed pricing information?";
      } 
      else if (userInput.includes('demo') || userInput.includes('try') || userInput.includes('test') || userInput.includes('see')) {
        responseText = "I'd be happy to arrange a personalized demo for you. Our team can show you how Ella would work specifically for your business needs. Would you like us to contact you about scheduling a demo?";
      } 
      else if (userInput.includes('feature') || userInput.includes('what can') || userInput.includes('capabilities') || userInput.includes('do you do')) {
        responseText = "YoBot's Ella can handle outbound sales calls, follow up with leads, schedule appointments, answer customer questions, and integrate with your existing business systems. Is there a specific capability you're most interested in?";
      }

      // Add the response
      laml += `  <Say voice="woman" language="en-US">${responseText}</Say>\n`;

      // Continue the conversation with another gather
      laml += '  <Gather input="speech dtmf" timeout="7" action="/api/phone-call/response" method="POST">\n';
      laml += '    <Say voice="woman" language="en-US">Press 1 or say yes to learn more, or press 2 or say no to end this call.</Say>\n';
      laml += '  </Gather>\n';

      // Fallback if no response
      laml += '  <Say voice="woman" language="en-US">We didn\'t hear a response. Thank you for your interest in YoBot. We\'ll follow up with you shortly. Have a great day!</Say>\n';
    } 
    else {
      // No speech or digits detected
      laml += '  <Say voice="woman" language="en-US">I\'m sorry, I didn\'t catch what you said. If you\'re interested in learning more about YoBot, please visit our website or call us back. Thank you for your interest!</Say>\n';
    }

    // Close the LAML response
    laml += '</Response>';

    // Log the generated LAML
    console.log('Sending response LAML:', laml);

    // Set the appropriate content type and send the LAML response
    res.setHeader('Content-Type', 'text/xml');
    res.send(laml);
  } catch (error) {
    console.error('Error handling speech response:', error);

    // Provide a helpful error response
    const errorLaml = '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n' +
      '  <Say voice="woman" language="en-US">I apologize, but we encountered a technical issue. Please call us back later or visit our website for more information.</Say>\n' +
      '</Response>';

    res.setHeader('Content-Type', 'text/xml');
    res.send(errorLaml);
  }
});

/**
 * Handle sales team connection request
 * POST /api/phone-call/sales-connect
 * This endpoint is called when user wants to speak with sales team
 */
router.post('/phone-call/sales-connect', (req: Request, res: Response) => {
  try {
    console.log('🔊 SALES CONNECTION REQUEST RECEIVED:', req.body);

    // Get the call SID and other parameters
    const { CallSid, SpeechResult, Digits } = req.body;

    // Check for user input (either speech or keypad)
    const userInput = SpeechResult?.toLowerCase() || '';
    const digitInput = Digits || '';

    // Determine if this is a "yes" response
    const isYes = 
      userInput.includes('yes') || 
      userInput.includes('yeah') || 
      userInput.includes('sure') || 
      userInput.includes('connect') || 
      digitInput === '1';

    // Create response with LAML
    let laml = '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n';

    if (isYes && CallSid) {
      // Save a note about the sales connection request
      try {
        saveCallNote(CallSid, 'User requested connection to sales team for pricing information');
      } catch (noteError) {
        console.error('Error saving call note:', noteError);
      }

      // In a real system, we would transfer to a sales team
      // For this demo, we'll simulate the transfer
      laml += '  <Say voice="woman" language="en-US">Great! I\'ll connect you with our sales team now. Please hold while I transfer you.</Say>\n';
      laml += '  <Pause length="2"/>\n';

      // For a real transfer, we'd use:
      // laml += `  <Dial>+1234567890</Dial>\n`;

      // For demo purposes, simulate the transfer
      laml += '  <Say voice="woman" language="en-US">I\'m sorry, but our sales team is currently unavailable. We\'ve logged your interest and a sales representative will call you back within 24 hours. Thank you for your interest in YoBot!</Say>\n';
    } else {
      // They didn't confirm or we don't have a valid call SID
      laml += '  <Say voice="woman" language="en-US">No problem. Thank you for your time today. A member of our team will follow up with more information about our products. Have a wonderful day!</Say>\n';

      if (CallSid) {
        try {
          saveCallNote(CallSid, 'User declined connection to sales team');
        } catch (noteError) {
          console.error('Error saving call note:', noteError);
        }
      }
    }

    // Close the LAML response
    laml += '</Response>';

    // Log the generated LAML
    console.log('Sending sales connection LAML:', laml);

    // Set the appropriate content type and send the LAML response
    res.setHeader('Content-Type', 'text/xml');
    res.send(laml);
  } catch (error) {
    console.error('Error handling sales connection request:', error);

    // Provide a helpful error response
    const errorLaml = '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n' +
      '  <Say voice="woman" language="en-US">I apologize, but we encountered a technical issue connecting you with our sales team. Someone will call you back shortly. Thank you for your interest in YoBot!</Say>\n' +
      '</Response>';

    res.setHeader('Content-Type', 'text/xml');
    res.send(errorLaml);
  }
});

/**
 * Get call history
 * GET /api/phone-call/history
 */
router.get('/phone-call/history', (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const history = getCallHistory(limit);
    return res.json(history);
  } catch (error) {
    console.error('Error getting call history:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get a specific call record
 * GET /api/phone-call/:id
 */
router.get('/phone-call/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const call = getCallRecord(id);

    if (!call) {
      return res.status(404).json({ error: 'Call record not found' });
    }

    return res.json(call);
  } catch (error) {
    console.error('Error getting call record:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Serve LAML (XML) for SignalWire calls
 * GET /api/signalwire-laml/:id
 * This endpoint serves the LAML instructions for a specific call
 */
router.get('/signalwire-laml/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log(`=================== INCOMING LAML REQUEST ===================`);
    console.log(`SignalWire is requesting LAML for call ID: ${id}`);
    console.log(`Request headers:`, req.headers);
    console.log(`Request query params:`, req.query);

    // Get the LAML from temporary storage
    const laml = getTempLaml(id);

    if (!laml) {
      console.error(`❌ LAML not found for call ID: ${id}`);

      // Return a basic error LAML - this is super-simplified for maximum reliability
      const errorLaml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman">I'm sorry, but there was an error with this call. Please try again later.</Say>
</Response>`;

      res.setHeader('Content-Type', 'text/xml');
      return res.send(errorLaml);
    }

    // Log that we're serving LAML
    console.log(`✅ Successfully serving LAML for call ID: ${id}`);

    // Set appropriate content type and send the LAML
    res.setHeader('Content-Type', 'text/xml');
    res.send(laml);

    console.log(`LAML response sent successfully for call ID: ${id}`);
  } catch (error) {
    console.error('❌ Error serving LAML:', error);

    // Return a basic error LAML - extremely simple for maximum compatibility
    const errorLaml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, there was an error with this call. Please try again later.</Say>
</Response>`;

    res.setHeader('Content-Type', 'text/xml');
    res.send(errorLaml);
  }
});

/**
 * Directly serve audio files for SignalWire
 * GET /api/signalwire-audio/:filename
 * Enhanced for better reliability with SignalWire
 */
router.get('/signalwire-audio/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    // Validate filename (prevent path traversal)
    if (!filename || filename.includes('..') || filename.includes('/')) {
      console.error(`Invalid SignalWire audio filename requested: ${filename}`);
      return res.status(400).json({ error: 'Invalid filename' });
    }

    // Build path to the requested file
    const filePath = path.join(ELEVENLABS_AUDIO_DIR, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`SignalWire audio file not found: ${filePath}`);
      return res.status(404).json({ error: 'Audio file not found' });
    }

    // Check file size to ensure it's not empty
    const fileStats = fs.statSync(filePath);
    if (fileStats.size === 0) {
      console.error(`Empty SignalWire audio file: ${filePath}`);
      return res.status(500).json({ error: "Audio file is empty" });
    }

    // Determine MIME type based on file extension
    const extension = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream'; // Default

    if (extension === '.mp3') {
      contentType = 'audio/mpeg';
    } else if (extension === '.wav') {
      contentType = 'audio/wav';
    }

    // Set appropriate headers for better compatibility
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileStats.size);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    console.log(`Serving SignalWire audio file (${fileStats.size} bytes): ${filename}`);

    // Stream the file to the response with error handling
    const fileStream = fs.createReadStream(filePath);

    fileStream.on('error', (streamError) => {
      console.error(`Error streaming SignalWire audio file ${filename}:`, streamError);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream audio file" });
      }
    });

    // Set a timeout in case the file streaming hangs
    const timeout = setTimeout(() => {
      if (!res.writableEnded) {
        console.error(`Timeout streaming SignalWire audio file: ${filename}`);
        res.end();
      }
    }, 30000); // 30 second timeout

    // Clean up the timeout when the response ends
    res.on('close', () => {
      clearTimeout(timeout);
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving SignalWire audio file:', error);
    res.status(500).json({ error: 'Failed to serve audio file' });
  }
});

/**
 * Handle transcription callback from SignalWire
 * This endpoint receives real-time transcription data during calls
 * POST /api/phone-call/transcription
 */
router.post('/phone-call/transcription', (req: Request, res: Response) => {
  try {
    console.log('🔊 TRANSCRIPTION DATA RECEIVED:', req.body);

    const { 
      CallSid,
      TranscriptionText,
      TranscriptionStatus,
      TranscriptionConfidence,
      TranscriptionSid,
      RecordingSid,
    } = req.body;

    if (!CallSid || !TranscriptionText) {
      console.warn('Missing required transcription data', req.body);
      return res.status(400).json({ error: 'Invalid transcription data' });
    }

    // Format confidence value
    let confidence = 0.7;  // Default confidence if not provided
    if (TranscriptionConfidence) {
      try {
        confidence = parseFloat(TranscriptionConfidence);
        // Ensure it's in the range 0-1
        confidence = Math.max(0, Math.min(1, confidence));
      } catch (e) {
        console.warn('Failed to parse transcription confidence:', TranscriptionConfidence);
      }
    }

    // Create a transcript entry
    const transcriptEntry: TranscriptEntry = {
      timestamp: new Date().toISOString(),
      speaker: 'user',  // Assume it's the user speaking (we know system prompts)
      text: TranscriptionText,
      confidence: confidence
    };

    console.log(`Call ${CallSid} transcript: "${TranscriptionText}" (confidence: ${confidence})`);

    // Get the current call record
    const callRecord = callRecordStorage.getCall(CallSid);

    if (!callRecord) {
      console.warn(`Call record not found for SID ${CallSid}`);
      return res.status(404).json({ error: 'Call record not found' });
    }

    // Initialize or update the transcript array for this call
    const transcript = callRecord.transcript || [];
    transcript.push(transcriptEntry);

    // Update the call record
    callRecordStorage.updateCallStatus(CallSid, callRecord.status, {
      transcript,
      updatedAt: new Date()
    });

    // Store in the active call transcripts map for real-time updates
    const activeTranscript = activeCallTranscripts.get(CallSid) || [];
    activeTranscript.push(transcriptEntry);
    activeCallTranscripts.set(CallSid, activeTranscript);

    // Send real-time update via WebSocket if available
    try {
      const activeConnections = (global as any).websocketConnections;
      if (activeConnections) {
        // Broadcast to all clients who have subscribed to this call
        activeConnections.forEach((client: WebSocket) => {
          if ((client as any).subscribedCallId === CallSid && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'transcript',
              callId: CallSid,
              entry: transcriptEntry
            }));
          }
        });
      }
    } catch (wsError) {
      console.error('Error sending WebSocket update:', wsError);
    }

    // Respond with a simple success message
    res.json({ 
      success: true,
      transcriptEntry
    });
  } catch (error) {
    console.error('Error processing transcription callback:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get the transcript for a specific call
 * GET /api/phone-call/:id/transcript
 */
router.get('/phone-call/:id/transcript', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const call = getCallRecord(id);

    if (!call) {
      return res.status(404).json({ error: 'Call record not found' });
    }

    return res.json({
      success: true,
      callId: id,
      transcript: call.transcript || []
    });
  } catch (error) {
    console.error('Error getting call transcript:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;