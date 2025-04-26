import express from 'express';
import { followupIntelService } from '../followupIntelService';
import { calendarService } from '../calendarService';

const router = express.Router();

/**
 * Get all follow-up intel records
 * GET /api/followup
 */
router.get('/', (req, res) => {
  try {
    const records = followupIntelService.getAllFollowupIntel();
    res.json({ success: true, records });
  } catch (error) {
    console.error('Error getting follow-up intel records:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve follow-up intel records',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get a specific follow-up intel record by ID
 * GET /api/followup/:id
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID parameter is required' });
    }
    
    const record = followupIntelService.getFollowupIntelById(id);
    
    if (!record) {
      return res.status(404).json({ success: false, error: `Follow-up intel record with ID ${id} not found` });
    }
    
    res.json({ success: true, record });
  } catch (error) {
    console.error('Error getting follow-up intel record:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve follow-up intel record',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get follow-up intel for a specific event
 * GET /api/followup/event/:eventId
 */
router.get('/event/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Event ID parameter is required' });
    }
    
    const record = followupIntelService.getFollowupIntelByEventId(eventId);
    
    if (!record) {
      return res.status(404).json({ success: false, error: `Follow-up intel record for event ${eventId} not found` });
    }
    
    res.json({ success: true, record });
  } catch (error) {
    console.error('Error getting follow-up intel record for event:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve follow-up intel record for event',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Generate follow-up intel for a calendar event
 * POST /api/followup/generate/:eventId
 */
router.post('/generate/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Event ID parameter is required' });
    }
    
    // Check if the event exists
    const event = calendarService.getEventById(eventId);
    
    if (!event) {
      return res.status(404).json({ success: false, error: `Calendar event with ID ${eventId} not found` });
    }
    
    // Check if follow-up intel already exists for this event
    const existingIntel = followupIntelService.getFollowupIntelByEventId(eventId);
    
    if (existingIntel) {
      return res.status(409).json({ 
        success: false, 
        error: `Follow-up intel already exists for event ${eventId}`,
        existingIntel
      });
    }
    
    // Generate follow-up intel
    const intel = await followupIntelService.generateFollowupIntel(eventId);
    
    if (!intel) {
      return res.status(500).json({ success: false, error: 'Failed to generate follow-up intel' });
    }
    
    res.json({ success: true, intel });
  } catch (error) {
    console.error('Error generating follow-up intel:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate follow-up intel',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Add participant feedback to a follow-up intel record
 * POST /api/followup/:id/feedback
 */
router.post('/:id/feedback', (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID parameter is required' });
    }
    
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Valid rating (1-5) is required' });
    }
    
    const updatedIntel = followupIntelService.addParticipantFeedback(id, rating, feedback);
    
    if (!updatedIntel) {
      return res.status(404).json({ success: false, error: `Follow-up intel record with ID ${id} not found` });
    }
    
    res.json({ success: true, intel: updatedIntel });
  } catch (error) {
    console.error('Error adding participant feedback:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add participant feedback',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Add a next step that has been taken
 * POST /api/followup/:id/nextstep
 */
router.post('/:id/nextstep', (req, res) => {
  try {
    const { id } = req.params;
    const { step } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID parameter is required' });
    }
    
    if (!step || typeof step !== 'string' || step.trim() === '') {
      return res.status(400).json({ success: false, error: 'Valid step description is required' });
    }
    
    const updatedIntel = followupIntelService.addNextStepTaken(id, step);
    
    if (!updatedIntel) {
      return res.status(404).json({ success: false, error: `Follow-up intel record with ID ${id} not found` });
    }
    
    res.json({ success: true, intel: updatedIntel });
  } catch (error) {
    console.error('Error adding next step taken:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add next step taken',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Add a status update that has been sent
 * POST /api/followup/:id/statusupdate
 */
router.post('/:id/statusupdate', (req, res) => {
  try {
    const { id } = req.params;
    const { update } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID parameter is required' });
    }
    
    if (!update || typeof update !== 'string' || update.trim() === '') {
      return res.status(400).json({ success: false, error: 'Valid status update description is required' });
    }
    
    const updatedIntel = followupIntelService.addStatusUpdateSent(id, update);
    
    if (!updatedIntel) {
      return res.status(404).json({ success: false, error: `Follow-up intel record with ID ${id} not found` });
    }
    
    res.json({ success: true, intel: updatedIntel });
  } catch (error) {
    console.error('Error adding status update sent:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add status update sent',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Generate a meeting insights report
 * GET /api/followup/:id/report
 */
router.get('/:id/report', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID parameter is required' });
    }
    
    const report = followupIntelService.generateMeetingInsightsReport(id);
    
    if (report === 'Follow-up intel not found.') {
      return res.status(404).json({ success: false, error: `Follow-up intel record with ID ${id} not found` });
    }
    
    res.json({ success: true, report });
  } catch (error) {
    console.error('Error generating meeting insights report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate meeting insights report',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Process recently completed events
 * POST /api/followup/process-recent
 */
router.post('/process-recent', async (req, res) => {
  try {
    await followupIntelService.processRecentlyCompletedEvents();
    res.json({ success: true, message: 'Processed recently completed events' });
  } catch (error) {
    console.error('Error processing recently completed events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process recently completed events',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;