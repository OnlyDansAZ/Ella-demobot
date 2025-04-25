import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { CallRecord, callRecordStorage } from '../twilioAdvanced';
import { 
  getCallHistory, 
  getCallRecord 
} from '../twilioAdvanced';  // We'll keep using the same call history storage
import { generateSpeech, getVoiceId, ELEVENLABS_AUDIO_DIR } from '../elevenLabsService';
import { makeOutboundCall, handleStatusCallback, PhoneCallRequest } from '../signalWireService';

const router = express.Router();

/**
 * Make an outbound phone call using SignalWire
 * POST /api/phone-call
 */
router.post('/phone-call', async (req: Request, res: Response) => {
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
router.post('/phone-call/status-callback', (req: Request, res: Response) => {
  try {
    // SignalWire uses similar parameter names to Twilio
    const { CallSid, CallStatus, CallDuration, RecordingUrl } = req.body;
    
    if (!CallSid || !CallStatus) {
      return res.status(400).json({ error: 'Invalid callback data' });
    }
    
    console.log(`Call ${CallSid} status update: ${CallStatus}`);
    
    // Use the SignalWireService handleStatusCallback helper
    const updatedRecord = handleStatusCallback(
      CallSid, 
      CallStatus, 
      CallDuration, 
      RecordingUrl
    );
    
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
router.post('/phone-call/response', (req: Request, res: Response) => {
  try {
    // Get the user's speech input from the request
    // SignalWire provides this in SpeechResult just like Twilio
    const { SpeechResult } = req.body;
    
    // Get a base URL for our audio files
    let baseUrl = process.env.PUBLIC_URL;
    if (!baseUrl) {
      baseUrl = `https://${process.env.REPL_SLUG}.replit.app`;
    }
    
    // Create response with LAML (SignalWire's equivalent to TwiML)
    let laml = '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n';
    
    // Add a small pause for more natural conversation flow
    laml += '  <Pause length="1"/>\n';
    
    // Generate response based on user speech input
    if (SpeechResult) {
      // User said something, prepare appropriate response
      const userSpeech = SpeechResult.toLowerCase();
      let responseText = "Thank you for your feedback. I've noted that down and will have our team follow up with you soon.";
      
      // Enhanced response logic based on keywords
      if (userSpeech.includes('price') || userSpeech.includes('cost') || userSpeech.includes('expensive') || userSpeech.includes('pricing') || userSpeech.includes('how much')) {
        responseText = "Our pricing is very competitive. We offer multiple tiers starting with our Starter package at five thousand dollars plus a monthly fee of four hundred ninety-nine dollars. Would you like me to send you our detailed pricing information?";
      } else if (userSpeech.includes('demo') || userSpeech.includes('try') || userSpeech.includes('test') || userSpeech.includes('see')) {
        responseText = "I'd be happy to arrange a personalized demo for you. Our team can show you how Ella would work specifically with your business needs. What's the best email to reach you at for scheduling?";
      } else if (userSpeech.includes('features') || userSpeech.includes('what can you do') || userSpeech.includes('capabilities') || userSpeech.includes('do')) {
        responseText = "YoBot's Ella can handle appointment scheduling, answer customer questions 24/7, make outbound calls to follow up with leads, and seamlessly integrate with your existing business systems. She learns your business through your knowledge base and can be customized to your specific industry needs. What specific capabilities are you most interested in?";
      } else if (userSpeech.includes('thank') || userSpeech.includes('goodbye') || userSpeech.includes('bye') || userSpeech.includes('later')) {
        responseText = "You're welcome! Thank you for your interest in YoBot. We'll follow up with additional information. Have a wonderful day, and feel free to reach out if you have any other questions!";
      } else if (userSpeech.includes('hello') || userSpeech.includes('hi') || userSpeech.includes('hey')) {
        responseText = "Hello there! It's great to connect with you. I'm Ella, YoBot's AI assistant. How can I help you today?";
      } else if (userSpeech.includes('integration') || userSpeech.includes('connect') || userSpeech.includes('work with')) {
        responseText = "YoBot integrates seamlessly with most business systems including CRMs like Salesforce, calendar apps like Google Calendar and Microsoft Outlook, and communication platforms like Slack. What systems are you currently using that you'd need integration with?";
      }
      
      // Generate speech using ElevenLabs (asynchronously)
      const voiceId = getVoiceId('female');
      
      generateSpeech(responseText, voiceId)
        .then(filename => {
          console.log(`Generated response audio: ${filename}`);
        })
        .catch(err => {
          console.error('Error generating response audio:', err);
        });
      
      // Meanwhile, respond with standard TTS since we can't wait for ElevenLabs
      // This ensures the call doesn't hang
      laml += `  <Say voice="woman">${responseText}</Say>\n`;
      
      // Continue the conversation with another gather
      laml += '  <Gather input="speech" timeout="5" action="/api/phone-call/response" method="POST">\n';
      laml += '    <Say voice="woman">I\'m listening if you have any other questions.</Say>\n';
      laml += '  </Gather>\n';
    } else {
      // No speech detected, provide a helpful prompt
      laml += '  <Say voice="woman">I\'m sorry, I didn\'t catch what you said. If you\'re interested in learning more about YoBot, please visit our website or call us back at a more convenient time. Thank you for your interest!</Say>\n';
    }
    
    // Close the LAML response
    laml += '</Response>';
    
    // Set the appropriate content type and send the LAML response
    res.setHeader('Content-Type', 'text/xml');
    res.send(laml);
  } catch (error) {
    console.error('Error handling speech response:', error);
    
    // Provide a helpful error response
    const errorLaml = '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n' +
      '  <Say voice="woman">I apologize, but we encountered a technical issue. Please call us back later or visit our website for more information.</Say>\n' +
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
 * Directly serve audio files for SignalWire
 * GET /api/signalwire-audio/:filename
 */
router.get('/signalwire-audio/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Validate filename (prevent path traversal)
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    // Build path to the requested file
    const filePath = path.join(ELEVENLABS_AUDIO_DIR, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Audio file not found: ${filePath}`);
      return res.status(404).json({ error: 'Audio file not found' });
    }
    
    // Determine MIME type based on file extension
    const extension = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream'; // Default
    
    if (extension === '.mp3') {
      contentType = 'audio/mpeg';
    } else if (extension === '.wav') {
      contentType = 'audio/wav';
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    console.log(`Serving SignalWire audio file: ${filename}`);
  } catch (error) {
    console.error('Error serving SignalWire audio file:', error);
    res.status(500).json({ error: 'Failed to serve audio file' });
  }
});

export default router;