import fs from 'fs';
import path from 'path';

/**
 * Calendar event structure
 */
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO date string
  end: string;   // ISO date string
  location?: string;
  participants?: string[];
  allDay?: boolean;
  recurring?: boolean;
  recurrencePattern?: string;
  reminderMinutes?: number;
}

/**
 * Service for managing calendar events
 */
export class CalendarService {
  private events: Map<string, CalendarEvent> = new Map();
  private filePath: string = path.join(process.cwd(), 'data', 'calendar.json');
  
  constructor() {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.loadFromFile();
    
    // Add some sample events if none exist
    if (this.events.size === 0) {
      this.addSampleEvents();
    }
    
    this.saveToFile();
  }
  
  /**
   * Load calendar events from file
   */
  private loadFromFile() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(data);
        
        if (parsed.events && Array.isArray(parsed.events)) {
          this.events.clear();
          
          for (const event of parsed.events) {
            this.events.set(event.id, event);
          }
          
          console.log(`Loaded ${this.events.size} calendar events from file`);
        }
      }
    } catch (error) {
      console.error('Error loading calendar events from file:', error);
    }
  }
  
  /**
   * Save calendar events to file
   */
  private saveToFile() {
    try {
      const data = JSON.stringify({
        events: Array.from(this.events.values())
      }, null, 2);
      
      fs.writeFileSync(this.filePath, data);
      console.log(`Saved ${this.events.size} calendar events to file`);
    } catch (error) {
      console.error('Error saving calendar events to file:', error);
    }
  }
  
  /**
   * Add sample calendar events
   */
  private addSampleEvents() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Sample events
    const sampleEvents: CalendarEvent[] = [
      {
        id: 'event-1',
        title: 'Team Sync Meeting',
        description: 'Weekly team sync to discuss progress and blockers',
        start: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
        end: new Date(today.setHours(11, 0, 0, 0)).toISOString(),
        location: 'Conference Room A',
        participants: ['John', 'Sarah', 'Mike'],
        recurring: true,
        recurrencePattern: 'WEEKLY'
      },
      {
        id: 'event-2',
        title: 'Client Presentation',
        description: 'Presentation of the new product features to client',
        start: new Date(tomorrow.setHours(14, 0, 0, 0)).toISOString(),
        end: new Date(tomorrow.setHours(15, 30, 0, 0)).toISOString(),
        location: 'Virtual Meeting',
        participants: ['Client X', 'Sales Team'],
        reminderMinutes: 30
      },
      {
        id: 'event-3',
        title: 'Product Strategy Planning',
        description: 'Quarterly product planning session',
        start: new Date(nextWeek.setHours(9, 0, 0, 0)).toISOString(),
        end: new Date(nextWeek.setHours(16, 0, 0, 0)).toISOString(),
        location: 'HQ Office',
        allDay: true
      }
    ];
    
    for (const event of sampleEvents) {
      this.events.set(event.id, event);
    }
  }
  
  /**
   * Get all calendar events
   */
  getAllEvents(): CalendarEvent[] {
    return Array.from(this.events.values());
  }
  
  /**
   * Get events for a specific date
   * @param date Date to get events for
   */
  getEventsForDate(date: Date): CalendarEvent[] {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return Array.from(this.events.values()).filter(event => {
      const eventStart = new Date(event.start);
      return eventStart >= targetDate && eventStart < nextDay;
    });
  }
  
  /**
   * Get events for today
   */
  getEventsForToday(): CalendarEvent[] {
    return this.getEventsForDate(new Date());
  }
  
  /**
   * Get events for tomorrow
   */
  getEventsForTomorrow(): CalendarEvent[] {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.getEventsForDate(tomorrow);
  }
  
  /**
   * Get upcoming events
   * @param days Number of days to look ahead
   * @param limit Maximum number of events to return
   */
  getUpcomingEvents(days: number = 7, limit: number = 5): CalendarEvent[] {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);
    
    return Array.from(this.events.values())
      .filter(event => {
        const eventStart = new Date(event.start);
        return eventStart >= now && eventStart <= futureDate;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, limit);
  }
  
  /**
   * Add a new calendar event
   * @param event Event to add
   */
  addEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
    const id = `event-${Date.now()}`;
    const newEvent: CalendarEvent = {
      ...event,
      id
    };
    
    this.events.set(id, newEvent);
    this.saveToFile();
    
    return newEvent;
  }
  
  /**
   * Update an existing calendar event
   * @param id Event ID
   * @param updates Updates to apply
   */
  updateEvent(id: string, updates: Partial<Omit<CalendarEvent, 'id'>>): CalendarEvent | null {
    const event = this.events.get(id);
    
    if (!event) {
      return null;
    }
    
    const updatedEvent: CalendarEvent = {
      ...event,
      ...updates
    };
    
    this.events.set(id, updatedEvent);
    this.saveToFile();
    
    return updatedEvent;
  }
  
  /**
   * Delete a calendar event
   * @param id Event ID
   */
  deleteEvent(id: string): boolean {
    const deleted = this.events.delete(id);
    
    if (deleted) {
      this.saveToFile();
    }
    
    return deleted;
  }
  
  /**
   * Get a formatted agenda for a specific date
   * @param date Date to get agenda for
   */
  getAgenda(date: Date): string {
    const events = this.getEventsForDate(date);
    
    if (events.length === 0) {
      return `No events scheduled for ${date.toLocaleDateString()}.`;
    }
    
    // Sort events by start time
    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    let agenda = `Schedule for ${date.toLocaleDateString()}:\n\n`;
    
    for (const event of events) {
      const startTime = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      agenda += `${startTime} - ${endTime}: ${event.title}\n`;
      
      if (event.description) {
        agenda += `  ${event.description}\n`;
      }
      
      if (event.location) {
        agenda += `  Location: ${event.location}\n`;
      }
      
      agenda += '\n';
    }
    
    return agenda;
  }
  
  /**
   * Get a summary of today's agenda
   */
  getTodaySummary(): string {
    return this.getAgenda(new Date());
  }
  
  /**
   * Get a summary of tomorrow's agenda
   */
  getTomorrowSummary(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.getAgenda(tomorrow);
  }
  
  /**
   * Get a summary of upcoming events
   */
  getUpcomingSummary(days: number = 7): string {
    const events = this.getUpcomingEvents(days);
    
    if (events.length === 0) {
      return `No upcoming events scheduled for the next ${days} days.`;
    }
    
    let summary = `Upcoming events for the next ${days} days:\n\n`;
    
    for (const event of events) {
      const date = new Date(event.start).toLocaleDateString();
      const startTime = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      summary += `${date}, ${startTime} - ${endTime}: ${event.title}\n`;
      
      if (event.description) {
        summary += `  ${event.description}\n`;
      }
      
      if (event.location) {
        summary += `  Location: ${event.location}\n`;
      }
      
      summary += '\n';
    }
    
    return summary;
  }
}

// Export a singleton instance
export const calendarService = new CalendarService();