import { calendarService, CalendarEvent } from './calendarService';
import { automationService } from './automationService';
import fs from 'fs';
import path from 'path';

/**
 * Follow-up intelligence data structure for storing meeting insights
 */
export interface FollowupIntel {
  id: string;
  eventId: string;
  eventTitle: string;
  meetingDate: string;
  keySummaryPoints: string[];
  participantFeedback?: {
    rating?: number;
    feedback?: string;
    timestamp?: string;
  };
  nextStepsRecommended: string[];
  nextStepsTaken: string[];
  statusUpdatesSent: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Service for generating and managing follow-up intelligence
 * This includes post-meeting summaries, action item tracking, and insights
 */
export class FollowupIntelService {
  private followupIntel: Map<string, FollowupIntel> = new Map();
  private filePath: string = path.join(process.cwd(), 'data', 'followup_intel.json');
  
  constructor() {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.loadFromFile();
    console.log(`Loaded ${this.followupIntel.size} follow-up intel records from file`);
  }
  
  /**
   * Load follow-up intel from file
   */
  private loadFromFile() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(data);
        
        if (parsed.records && Array.isArray(parsed.records)) {
          this.followupIntel.clear();
          
          for (const record of parsed.records) {
            this.followupIntel.set(record.id, record);
          }
        }
      }
    } catch (error) {
      console.error('Error loading follow-up intel from file:', error);
    }
  }
  
  /**
   * Save follow-up intel to file
   */
  private saveToFile() {
    try {
      const data = JSON.stringify({
        records: Array.from(this.followupIntel.values())
      }, null, 2);
      
      fs.writeFileSync(this.filePath, data);
    } catch (error) {
      console.error('Error saving follow-up intel to file:', error);
    }
  }
  
  /**
   * Generate follow-up intel for a calendar event
   * @param eventId The ID of the event to generate follow-up for
   */
  async generateFollowupIntel(eventId: string): Promise<FollowupIntel | null> {
    try {
      // Get the calendar event
      const event = calendarService.getEventById(eventId);
      
      if (!event) {
        console.error(`Event not found with ID: ${eventId}`);
        return null;
      }
      
      // Create a basic follow-up intel structure
      const id = `followup-${Date.now()}`;
      const now = new Date().toISOString();
      
      const followupIntel: FollowupIntel = {
        id,
        eventId,
        eventTitle: event.title,
        meetingDate: event.start,
        keySummaryPoints: this.generateDefaultSummaryPoints(event),
        nextStepsRecommended: this.generateDefaultNextSteps(event),
        nextStepsTaken: [],
        statusUpdatesSent: [],
        createdAt: now,
        updatedAt: now
      };
      
      // Save the follow-up intel
      this.followupIntel.set(id, followupIntel);
      this.saveToFile();
      
      // Trigger a follow-up automation
      await this.triggerFollowupAutomation(event);
      
      return followupIntel;
    } catch (error) {
      console.error('Error generating follow-up intel:', error);
      return null;
    }
  }
  
  /**
   * Trigger follow-up automations for a completed meeting
   */
  private async triggerFollowupAutomation(event: CalendarEvent): Promise<boolean> {
    try {
      // Trigger a follow-up automation with the automation service
      return await automationService.triggerAutomation(event, 'followup', '1hour');
    } catch (error) {
      console.error('Error triggering follow-up automation:', error);
      return false;
    }
  }
  
  /**
   * Generate default summary points based on event type and description
   */
  private generateDefaultSummaryPoints(event: CalendarEvent): string[] {
    // In a real implementation, this would use AI to generate contextual summaries
    // based on meeting transcripts, notes, or other data
    return [
      'Discussed project status and timeline',
      'Identified key challenges and solutions',
      'Reviewed upcoming deliverables and deadlines',
      'Assigned action items to team members'
    ];
  }
  
  /**
   * Generate default next steps based on event type
   */
  private generateDefaultNextSteps(event: CalendarEvent): string[] {
    // In a real implementation, this would use AI to generate contextual next steps
    return [
      'Schedule follow-up meeting within 2 weeks',
      'Prepare status report for stakeholders',
      'Complete assigned action items before next meeting',
      'Share meeting notes with all participants'
    ];
  }
  
  /**
   * Get all follow-up intel records
   */
  getAllFollowupIntel(): FollowupIntel[] {
    return Array.from(this.followupIntel.values());
  }
  
  /**
   * Get a specific follow-up intel record by ID
   */
  getFollowupIntelById(id: string): FollowupIntel | undefined {
    return this.followupIntel.get(id);
  }
  
  /**
   * Get follow-up intel for a specific event
   */
  getFollowupIntelByEventId(eventId: string): FollowupIntel | undefined {
    return Array.from(this.followupIntel.values()).find(
      record => record.eventId === eventId
    );
  }
  
  /**
   * Update a follow-up intel record
   */
  updateFollowupIntel(id: string, updates: Partial<FollowupIntel>): FollowupIntel | null {
    const intel = this.followupIntel.get(id);
    
    if (!intel) {
      return null;
    }
    
    const updatedIntel: FollowupIntel = {
      ...intel,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.followupIntel.set(id, updatedIntel);
    this.saveToFile();
    
    return updatedIntel;
  }
  
  /**
   * Add a participant feedback to a follow-up intel record
   */
  addParticipantFeedback(id: string, rating: number, feedback?: string): FollowupIntel | null {
    const intel = this.followupIntel.get(id);
    
    if (!intel) {
      return null;
    }
    
    const updatedIntel: FollowupIntel = {
      ...intel,
      participantFeedback: {
        rating,
        feedback,
        timestamp: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };
    
    this.followupIntel.set(id, updatedIntel);
    this.saveToFile();
    
    return updatedIntel;
  }
  
  /**
   * Add a next step that has been taken
   */
  addNextStepTaken(id: string, step: string): FollowupIntel | null {
    const intel = this.followupIntel.get(id);
    
    if (!intel) {
      return null;
    }
    
    const updatedIntel: FollowupIntel = {
      ...intel,
      nextStepsTaken: [...intel.nextStepsTaken, step],
      updatedAt: new Date().toISOString()
    };
    
    this.followupIntel.set(id, updatedIntel);
    this.saveToFile();
    
    return updatedIntel;
  }
  
  /**
   * Add a status update that has been sent
   */
  addStatusUpdateSent(id: string, update: string): FollowupIntel | null {
    const intel = this.followupIntel.get(id);
    
    if (!intel) {
      return null;
    }
    
    const updatedIntel: FollowupIntel = {
      ...intel,
      statusUpdatesSent: [...intel.statusUpdatesSent, update],
      updatedAt: new Date().toISOString()
    };
    
    this.followupIntel.set(id, updatedIntel);
    this.saveToFile();
    
    return updatedIntel;
  }
  
  /**
   * Generate a meeting insights report with summary and next steps
   */
  generateMeetingInsightsReport(id: string): string {
    const intel = this.followupIntel.get(id);
    
    if (!intel) {
      return 'Follow-up intel not found.';
    }
    
    const eventDate = new Date(intel.meetingDate).toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    let report = `# Meeting Insights Report: ${intel.eventTitle}\n\n`;
    report += `Date: ${eventDate}\n\n`;
    
    report += `## Key Summary Points\n\n`;
    intel.keySummaryPoints.forEach(point => {
      report += `- ${point}\n`;
    });
    
    report += `\n## Recommended Next Steps\n\n`;
    intel.nextStepsRecommended.forEach(step => {
      report += `- ${step}\n`;
    });
    
    if (intel.nextStepsTaken.length > 0) {
      report += `\n## Next Steps Taken\n\n`;
      intel.nextStepsTaken.forEach(step => {
        report += `- ${step}\n`;
      });
    }
    
    if (intel.participantFeedback) {
      report += `\n## Participant Feedback\n\n`;
      report += `Rating: ${intel.participantFeedback.rating}/5\n`;
      
      if (intel.participantFeedback.feedback) {
        report += `Feedback: ${intel.participantFeedback.feedback}\n`;
      }
    }
    
    return report;
  }
  
  /**
   * Check for recently concluded events and automatically generate follow-up intel
   * This should be called periodically to ensure follow-up for all meetings
   */
  async processRecentlyCompletedEvents(): Promise<void> {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Get all events
    const allEvents = calendarService.getAllEvents();
    
    // Filter for events that ended in the last 24 hours
    const recentlyCompletedEvents = allEvents.filter(event => {
      const eventEnd = new Date(event.end);
      return eventEnd < now && eventEnd > yesterday;
    });
    
    // Process each recently completed event
    for (const event of recentlyCompletedEvents) {
      // Check if we already have follow-up intel for this event
      const existingIntel = this.getFollowupIntelByEventId(event.id);
      
      if (!existingIntel) {
        console.log(`Generating follow-up intel for recently completed event: ${event.title}`);
        await this.generateFollowupIntel(event.id);
      }
    }
  }
}

// Export a singleton instance
export const followupIntelService = new FollowupIntelService();