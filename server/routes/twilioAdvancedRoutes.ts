import express, { Request, Response } from 'express';
import twilio from 'twilio';
import fs from 'fs';
import path from 'path';
import {
  makeOutboundCall,
  handleStatusCallback,
  getCallHistory,
  getCallRecord,
  PhoneCallRequest
} from '../twilioAdvanced';
import { generateSpeech, getVoiceId, ELEVENLABS_AUDIO_DIR } from '../elevenLabsService';

const router = express.Router();

/**
 * Make an outbound phone call
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
    
    // Make the call
    const callRecord = await makeOutboundCall(callRequest);
    
    if (!callRecord) {
      return res.status(500).json({ error: 'Failed to make call' });
    }
    
    return res.json(callRecord);
    
  } catch (error) {
    console.error('Error making outbound call:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Handle status callbacks from Twilio
 * POST /api/phone-call/status-callback
 */
router.post('/phone-call/status-callback', (req: Request, res: Response) => {
  try {
    const { CallSid, CallStatus, CallDuration, RecordingUrl } = req.body;
    
    if (!CallSid || !CallStatus) {
      return res.status(400).json({ error: 'Invalid callback data' });
    }
    
    console.log(`Call ${CallSid} status update: ${CallStatus}`);
    
    // Update the call record with the new status
    const updatedRecord = handleStatusCallback(
      CallSid,
      CallStatus,
      CallDuration,
      RecordingUrl
    );
    
    // Respond with success to Twilio (use XML format as expected by Twilio)
    res.setHeader('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  } catch (error) {
    console.error('Error processing status callback:', error);
    
    // Still return a valid TwiML response to Twilio
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
    const { SpeechResult } = req.body;
    
    // Create a new TwiML response
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Add a small pause for more natural conversation flow
    twiml.pause({ length: 1 });
    
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
      
      // Dynamic response generation
      // In a production environment, this would call the OpenAI API to generate a response
      
      // Create a unique random filename for this response
      const filePrefix = "response_" + Math.floor(Math.random() * 1000000);
      const voiceId = getVoiceId('female');
      
      // Generate speech using ElevenLabs (asynchronously)
      generateSpeech(responseText, voiceId)
        .then(filename => {
          console.log(`Generated response audio: ${filename}`);
        })
        .catch(err => {
          console.error('Error generating response audio:', err);
        });
      
      // Meanwhile, respond with standard TTS since we can't wait for ElevenLabs
      // This ensures the call doesn't hang
      twiml.say({
        voice: 'woman',
        language: 'en-US'
      }, responseText);
      
      // Continue the conversation with another gather
      twiml.gather({
        input: ['speech'],
        speechTimeout: 'auto',
        speechModel: 'phone_call',
        language: 'en-US',
        timeout: 5,
        action: '/api/phone-call/response',
      });
    } else {
      // No speech detected, provide a helpful prompt
      twiml.say({
        voice: 'woman',
        language: 'en-US'
      }, "I'm sorry, I didn't catch what you said. If you're interested in learning more about YoBot, please visit our website or call us back at a more convenient time. Thank you for your interest!");
    }
    
    // Set the appropriate content type and send the TwiML response
    res.setHeader('Content-Type', 'text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error handling speech response:', error);
    
    // Provide a helpful error response
    const errorTwiml = new twilio.twiml.VoiceResponse();
    errorTwiml.say({
      voice: 'woman',
      language: 'en-US'
    }, "I apologize, but we encountered a technical issue. Please call us back later or visit our website for more information.");
    
    res.setHeader('Content-Type', 'text/xml');
    res.send(errorTwiml.toString());
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
 * Directly serve audio files for Twilio
 * GET /api/twilio-audio/:filename
 */
router.get('/twilio-audio/:filename', (req: Request, res: Response) => {
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
    
    console.log(`Serving Twilio audio file: ${filename}`);
  } catch (error) {
    console.error('Error serving Twilio audio file:', error);
    res.status(500).json({ error: 'Failed to serve audio file' });
  }
});

export default router;