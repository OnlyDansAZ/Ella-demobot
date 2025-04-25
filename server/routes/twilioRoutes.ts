import { Router, Request, Response } from 'express';
import twilio from 'twilio';
import { 
  makeOutboundCall, 
  PhoneCallRequest, 
  handleStatusCallback, 
  getCallHistory,
  getCallRecord,
  initTwilioClient
} from '../twilioSimple';
import { z } from 'zod';

const router = Router();

// Initialize Twilio client when routes are loaded
initTwilioClient();

// Validate phone call request
const phoneCallSchema = z.object({
  to: z.string().min(10).max(15),
  script: z.string().min(10).max(5000),
  persona: z.string(),
  voice: z.string(),
  scheduledTime: z.string().optional(),
  callbackUrl: z.string().optional()
});

/**
 * Make an outbound call
 * POST /api/phone-call
 */
router.post('/phone-call', async (req: Request, res: Response) => {
  try {
    const validationResult = phoneCallSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error.format() 
      });
    }
    
    const callData = validationResult.data;
    
    // Convert scheduledTime string to Date if present
    const request: PhoneCallRequest = {
      ...callData,
      scheduledTime: callData.scheduledTime ? new Date(callData.scheduledTime) : undefined
    };
    
    const callRecord = await makeOutboundCall(request);
    
    if (!callRecord) {
      return res.status(500).json({ error: 'Failed to make call' });
    }
    
    return res.json(callRecord);
  } catch (error) {
    console.error('Error making phone call:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Webhook for call status updates
 * POST /api/phone-call/status
 */
router.post('/phone-call/status', (req: Request, res: Response) => {
  try {
    const { CallSid, CallStatus, CallDuration, RecordingUrl } = req.body;
    
    if (!CallSid || !CallStatus) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const updatedCall = handleStatusCallback(CallSid, CallStatus, CallDuration, RecordingUrl);
    
    if (!updatedCall) {
      return res.status(404).json({ error: 'Call record not found' });
    }
    
    // Return a valid TwiML response
    res.setHeader('Content-Type', 'text/xml');
    return res.send('<Response></Response>');
  } catch (error) {
    console.error('Error handling call status callback:', error);
    
    // Always return valid TwiML even on error
    res.setHeader('Content-Type', 'text/xml');
    return res.send('<Response></Response>');
  }
});

/**
 * Handle user speech responses during a call
 * POST /api/phone-call/response
 */
router.post('/phone-call/response', (req: Request, res: Response) => {
  try {
    const { CallSid, SpeechResult, Confidence } = req.body;
    
    console.log(`Received speech from call ${CallSid}: "${SpeechResult}" (confidence: ${Confidence})`);
    
    // Create TwiML response
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Add a small pause
    twiml.pause({ length: 1 });
    
    // Choose voice type (Google voices sound better)
    const voiceType = 'Google.en-US-Standard-F';
    
    if (SpeechResult) {
      // User said something, respond to them
      let responseText = "Thank you for your feedback. I've made a note of that.";
      
      // Simple response logic based on keywords
      const userSpeech = SpeechResult.toLowerCase();
      
      if (userSpeech.includes('price') || userSpeech.includes('cost') || userSpeech.includes('expensive')) {
        responseText = "Our pricing is very competitive. We offer multiple tiers starting with our Starter package at five thousand dollars plus a monthly fee of four hundred ninety-nine dollars.";
      } else if (userSpeech.includes('demo') || userSpeech.includes('try')) {
        responseText = "I'd be happy to arrange a demo for you. Would you like me to have our sales team contact you to schedule one?";
      } else if (userSpeech.includes('features') || userSpeech.includes('what can you do')) {
        responseText = "YoBot can handle appointments, answer customer questions, make outbound calls, and integrate with your existing systems. Our AI is highly customizable to your specific needs.";
      } else if (userSpeech.includes('thank') || userSpeech.includes('goodbye') || userSpeech.includes('bye')) {
        responseText = "You're welcome! Thank you for your interest in YoBot. Have a wonderful day!";
      }
      
      // Respond with SSML for better voice quality
      twiml.say({
        voice: voiceType,
        language: 'en-US'
      }, `<speak><prosody rate="1.05" pitch="+0.2st">${responseText}</prosody></speak>`);
      
      // Add another gather to continue the conversation
      // Use type assertion to avoid TypeScript errors
      twiml.gather({
        input: 'speech' as any,
        speechTimeout: 'auto',
        speechModel: 'phone_call',
        language: 'en-US',
        timeout: 8,
        action: '/api/phone-call/response',
      });
    } else {
      // No speech detected
      twiml.say({
        voice: voiceType,
        language: 'en-US'
      }, "<speak><prosody rate='0.95'>I didn't catch that. Thank you for your time. Please call us back if you have any questions.</prosody></speak>");
    }
    
    // Set the appropriate content type and send the TwiML response
    res.setHeader('Content-Type', 'text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error handling speech response:', error);
    
    // Return a simple response on error
    const errorTwiml = new twilio.twiml.VoiceResponse();
    errorTwiml.say('Sorry, we encountered an error. Please try again later.');
    
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

export default router;