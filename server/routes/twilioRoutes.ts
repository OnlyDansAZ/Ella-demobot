import { Router, Request, Response } from 'express';
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