import express from 'express';
import { calendarService } from '../calendarService';

const router = express.Router();

/**
 * Get all calendar events
 * GET /api/calendar
 */
router.get('/', (req, res) => {
  try {
    const events = calendarService.getAllEvents();
    res.json({ success: true, events });
  } catch (error) {
    console.error('Error getting all calendar events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve calendar events',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get events for a specific date
 * GET /api/calendar/date/:date
 */
router.get('/date/:date', (req, res) => {
  try {
    const { date } = req.params;
    
    if (!date) {
      return res.status(400).json({ success: false, error: 'Date parameter is required' });
    }
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }
    
    const events = calendarService.getEventsForDate(dateObj);
    res.json({ success: true, events });
  } catch (error) {
    console.error('Error getting events for date:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve events for date',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get events for today
 * GET /api/calendar/today
 */
router.get('/today', (req, res) => {
  try {
    const events = calendarService.getEventsForToday();
    res.json({ success: true, events });
  } catch (error) {
    console.error('Error getting today\'s events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve today\'s events',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get events for tomorrow
 * GET /api/calendar/tomorrow
 */
router.get('/tomorrow', (req, res) => {
  try {
    const events = calendarService.getEventsForTomorrow();
    res.json({ success: true, events });
  } catch (error) {
    console.error('Error getting tomorrow\'s events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve tomorrow\'s events',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get upcoming events
 * GET /api/calendar/upcoming?days=7&limit=5
 */
router.get('/upcoming', (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const limit = parseInt(req.query.limit as string) || 5;
    
    const events = calendarService.getUpcomingEvents(days, limit);
    res.json({ success: true, events });
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve upcoming events',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get agenda for a specific date
 * GET /api/calendar/agenda/:date
 */
router.get('/agenda/:date', (req, res) => {
  try {
    const { date } = req.params;
    
    if (!date) {
      return res.status(400).json({ success: false, error: 'Date parameter is required' });
    }
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }
    
    const agenda = calendarService.getAgenda(dateObj);
    res.json({ success: true, agenda });
  } catch (error) {
    console.error('Error getting agenda for date:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve agenda for date',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get agenda for today
 * GET /api/calendar/agenda/today
 */
router.get('/agenda/today', (req, res) => {
  try {
    const agenda = calendarService.getTodaySummary();
    res.json({ success: true, agenda });
  } catch (error) {
    console.error('Error getting today\'s agenda:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve today\'s agenda',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get upcoming events summary
 * GET /api/calendar/summary?days=7
 */
router.get('/summary', (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    
    const summary = calendarService.getUpcomingSummary(days);
    res.json({ success: true, summary });
  } catch (error) {
    console.error('Error getting upcoming summary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve upcoming summary',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Add a new calendar event
 * POST /api/calendar
 */
router.post('/', (req, res) => {
  try {
    const { title, description, start, end, location, participants, allDay, recurring, recurrencePattern, reminderMinutes } = req.body;
    
    if (!title || !start || !end) {
      return res.status(400).json({ success: false, error: 'Title, start, and end are required fields' });
    }
    
    const event = calendarService.addEvent({
      title,
      description,
      start,
      end,
      location,
      participants,
      allDay,
      recurring,
      recurrencePattern,
      reminderMinutes
    });
    
    res.json({ success: true, event });
  } catch (error) {
    console.error('Error adding calendar event:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add calendar event',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Update an existing calendar event
 * PUT /api/calendar/:id
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, start, end, location, participants, allDay, recurring, recurrencePattern, reminderMinutes } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'Event ID parameter is required' });
    }
    
    const event = calendarService.updateEvent(id, {
      title,
      description,
      start,
      end,
      location,
      participants,
      allDay,
      recurring,
      recurrencePattern,
      reminderMinutes
    });
    
    if (!event) {
      return res.status(404).json({ success: false, error: `Calendar event with ID ${id} not found` });
    }
    
    res.json({ success: true, event });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update calendar event',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Delete a calendar event
 * DELETE /api/calendar/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'Event ID parameter is required' });
    }
    
    const deleted = calendarService.deleteEvent(id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: `Calendar event with ID ${id} not found` });
    }
    
    res.json({ success: true, message: `Calendar event with ID ${id} deleted successfully` });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete calendar event',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;