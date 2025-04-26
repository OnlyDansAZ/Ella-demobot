import { Router } from 'express';
import { calendarService } from '../calendarService';

const router = Router();

/**
 * Get all calendar events
 * GET /api/calendar
 */
router.get('/', (req, res) => {
  try {
    const events = calendarService.getAllEvents();
    res.json({ success: true, events });
  } catch (error) {
    console.error('Error getting all events:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve calendar events' });
  }
});

/**
 * Get events for a specific date
 * GET /api/calendar/date/:date
 */
router.get('/date/:date', (req, res) => {
  try {
    const date = new Date(req.params.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }
    
    const events = calendarService.getEventsForDate(date);
    res.json({ success: true, events });
  } catch (error) {
    console.error('Error getting events for date:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve calendar events' });
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
    res.status(500).json({ success: false, error: 'Failed to retrieve today\'s events' });
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
    res.status(500).json({ success: false, error: 'Failed to retrieve tomorrow\'s events' });
  }
});

/**
 * Get upcoming events
 * GET /api/calendar/upcoming?days=7&limit=5
 */
router.get('/upcoming', (req, res) => {
  try {
    const days = parseInt(req.query.days as string || '7');
    const limit = parseInt(req.query.limit as string || '5');
    
    const events = calendarService.getUpcomingEvents(days, limit);
    res.json({ success: true, events });
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve upcoming events' });
  }
});

/**
 * Get agenda for a specific date
 * GET /api/calendar/agenda/:date
 */
router.get('/agenda/:date', (req, res) => {
  try {
    const date = new Date(req.params.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }
    
    const agenda = calendarService.getAgenda(date);
    res.json({ success: true, agenda });
  } catch (error) {
    console.error('Error getting agenda for date:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve agenda' });
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
    res.status(500).json({ success: false, error: 'Failed to retrieve today\'s agenda' });
  }
});

/**
 * Get upcoming events summary
 * GET /api/calendar/summary?days=7
 */
router.get('/summary', (req, res) => {
  try {
    const days = parseInt(req.query.days as string || '7');
    const summary = calendarService.getUpcomingSummary(days);
    res.json({ success: true, summary });
  } catch (error) {
    console.error('Error getting upcoming summary:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve upcoming summary' });
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
      return res.status(400).json({ success: false, error: 'Missing required fields: title, start, end' });
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
    
    res.status(201).json({ success: true, event });
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ success: false, error: 'Failed to add event' });
  }
});

/**
 * Update an existing calendar event
 * PUT /api/calendar/:id
 */
router.put('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const { title, description, start, end, location, participants, allDay, recurring, recurrencePattern, reminderMinutes } = req.body;
    
    const updatedEvent = calendarService.updateEvent(id, {
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
    
    if (!updatedEvent) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    res.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, error: 'Failed to update event' });
  }
});

/**
 * Delete a calendar event
 * DELETE /api/calendar/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const deleted = calendarService.deleteEvent(id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, error: 'Failed to delete event' });
  }
});

export default router;