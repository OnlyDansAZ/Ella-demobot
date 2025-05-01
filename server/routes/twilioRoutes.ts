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

    // Create TwiML response - this handles the user's voice response
    const twiml = new twilio.twiml.VoiceResponse();

    // Add a small pause for more natural conversation flow
    twiml.pause({ length: 1 });

    // Use Amazon Polly voice for maximum reliability
    // Polly voices are known to be very reliable with Twilio
    const voiceType = 'Polly.Joanna'; // Reliable female Polly voice

    if (SpeechResult) {
      // User said something, respond to them with appropriate context
      let responseText = "Thank you for your feedback. I've noted that down and will have our team follow up with you soon.";

      // Enhanced response logic based on keywords
      const userSpeech = SpeechResult.toLowerCase();

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

      // Simple response without SSML for maximum reliability
      twiml.say({
        voice: voiceType,
        language: 'en-US'
      }, responseText);

      // Continue the conversation with another gather
      // We need to cast the entire options object to any to avoid TypeScript errors
      // with the Twilio types which are quite strict
      const gatherOptions: any = {
        input: 'speech',
        speechTimeout: 'auto',
        speechModel: 'phone_call',
        language: 'en-US',
        timeout: 8,
        action: '/api/phone-call/response',
      };
      twiml.gather(gatherOptions);
    } else {
      // No speech detected, provide a simple helpful prompt
      twiml.say({
        voice: voiceType,
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
      voice: 'Polly.Joanna',
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

export default router;