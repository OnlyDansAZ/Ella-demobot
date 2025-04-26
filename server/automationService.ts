import { CalendarEvent } from './calendarService';
import { calendarService } from './calendarService';
import path from 'path';
import fs from 'fs';

// Service placeholders - these services might be implemented later
// or can be used via their APIs directly
class ElevenLabsService {
  async generateSpeech(text: string): Promise<string> {
    console.log('ElevenLabs speech generation simulation:', text);
    // In a real implementation, this would generate speech
    return '/temp/simulated-speech.mp3';
  }
}

class SignalWireService {
  async sendSMS(options: { to: string, body: string }): Promise<boolean> {
    console.log('SignalWire SMS simulation:', options);
    // In a real implementation, this would send an SMS
    return true;
  }
  
  async makeCall(options: { to: string, audioUrl: string }): Promise<boolean> {
    console.log('SignalWire call simulation:', options);
    // In a real implementation, this would make a call
    return true;
  }
}

// Create service instances
export const elevenLabsService = new ElevenLabsService();
export const signalWireService = new SignalWireService();

/**
 * Automation log entry structure
 */
interface AutomationLogEntry {
  timestamp: string;
  eventId: string;
  eventTitle: string;
  automationType: string;
  status: 'queued' | 'sent' | 'failed';
  details?: string;
}

/**
 * Automation trigger configuration
 */
interface AutomationTrigger {
  type: 'reminder' | 'agenda' | 'followup';
  timing: 'immediately' | '15min' | '1hour' | '2hours' | '3hours' | '1day' | '2days';
  enabled: boolean;
  template?: string;
}

/**
 * Service for automating follow-up communications and reminders
 * based on calendar events and appointment bookings
 */
export class AutomationService {
  private automationLog: AutomationLogEntry[] = [];
  private filePath: string = path.join(process.cwd(), 'data', 'automation_log.json');
  private automationsPath: string = path.join(process.cwd(), 'data', 'automations.json');
  private automationTriggers: Record<string, AutomationTrigger[]> = {
    default: [
      // Day before reminder
      {
        type: 'reminder',
        timing: '1day',
        enabled: true,
        template: 'Hi there! Just a friendly reminder about our {{eventTitle}} scheduled for {{eventTime}} tomorrow. Looking forward to it!'
      },
      // 2 hours before reminder (more urgent tone)
      {
        type: 'reminder',
        timing: '2hours',
        enabled: true,
        template: 'Your {{eventTitle}} is coming up in 2 hours at {{eventTime}}. If you need to reschedule, please let me know as soon as possible. Otherwise, I\'ll see you there!'
      },
      // 15 minutes before reminder (final confirmation)
      {
        type: 'reminder',
        timing: '15min',
        enabled: true,
        template: 'Your {{eventTitle}} is starting in 15 minutes. I\'m all set and looking forward to our conversation!'
      },
      // Agenda sent immediately upon booking
      {
        type: 'agenda',
        timing: 'immediately',
        enabled: true,
        template: 'Thanks for scheduling {{eventTitle}}! I\'ve attached the agenda for our meeting:\n\n1. Introduction and goals\n2. Discussion of your specific needs\n3. Demonstration of relevant solutions\n4. Q&A\n5. Next steps\n\nPlease let me know if you\'d like to add anything specific.'
      },
      // Meeting follow-up 1 hour after meeting
      {
        type: 'followup',
        timing: '1hour',
        enabled: true,
        template: 'Thank you for your time today! I wanted to follow up on our {{eventTitle}} with a quick summary:\n\n📝 Key Points Discussed:\n- Your current situation and challenges\n- Potential solutions we explored\n- Next steps for implementation\n\n⏭️ Action Items:\n1. I\'ll send over the materials we discussed\n2. You\'ll review and provide feedback\n3. We\'ll schedule a follow-up to finalize\n\nHow was your experience today? Is there anything else you need?'
      },
      // Check-in follow-up 1 day after meeting
      {
        type: 'followup',
        timing: '1day',
        enabled: true,
        template: 'I hope you\'re doing well after our {{eventTitle}} yesterday. I\'m just checking in to see if you have any questions or thoughts after having some time to reflect. I\'m here to help with any next steps!'
      }
    ]
  };

  constructor() {
    // Load automation log from file
    this.loadLogFromFile();
    
    // Load automation triggers from file
    this.loadAutomationsFromFile();
    
    // Initialize automation folder structure
    this.initializeFolder();
    
    // Start processing pending automations
    this.processPendingAutomations();
    
    console.log('Automation service initialized');
  }
  
  /**
   * Initialize folder structure for automation service
   */
  private initializeFolder() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
  
  /**
   * Load automation log from file
   */
  private loadLogFromFile() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        const parsedData = JSON.parse(data);
        
        if (Array.isArray(parsedData)) {
          this.automationLog = parsedData;
          console.log(`Loaded ${this.automationLog.length} automation log entries from file`);
        }
      }
    } catch (error) {
      console.error('Error loading automation log from file:', error);
    }
  }
  
  /**
   * Save automation log to file
   */
  private saveLogToFile() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.automationLog, null, 2));
    } catch (error) {
      console.error('Error saving automation log to file:', error);
    }
  }
  
  /**
   * Load automation triggers from file
   */
  private loadAutomationsFromFile() {
    try {
      if (fs.existsSync(this.automationsPath)) {
        const data = fs.readFileSync(this.automationsPath, 'utf8');
        const parsedData = JSON.parse(data);
        
        if (parsedData && typeof parsedData === 'object') {
          this.automationTriggers = parsedData;
          console.log(`Loaded automation triggers from file`);
        }
      } else {
        // Save default triggers to file if it doesn't exist
        fs.writeFileSync(this.automationsPath, JSON.stringify(this.automationTriggers, null, 2));
        console.log('Created default automation triggers file');
      }
    } catch (error) {
      console.error('Error loading automation triggers from file:', error);
    }
  }
  
  /**
   * Process pending automations
   * This method checks for any pending automations and executes them if needed
   */
  private processPendingAutomations() {
    // Check for upcoming events in the next 24 hours
    const upcomingEvents = calendarService.getUpcomingEvents(1, 10);
    
    // Process each upcoming event
    for (const event of upcomingEvents) {
      // Get the default automation triggers
      const triggers = this.automationTriggers.default || [];
      
      // Check if we need to send a reminder
      for (const trigger of triggers) {
        if (!trigger.enabled) continue;
        
        // Check if this automation has already been sent for this event
        const alreadySent = this.automationLog.some(entry => 
          entry.eventId === event.id && 
          entry.automationType === `${trigger.type}_${trigger.timing}` &&
          entry.status === 'sent'
        );
        
        if (alreadySent) continue;
        
        // Calculate when the automation should be sent
        const shouldSendNow = this.shouldSendAutomation(event, trigger);
        
        if (shouldSendNow) {
          console.log(`Sending ${trigger.type} automation for event: ${event.title}`);
          this.executeAutomation(event, trigger);
        }
      }
    }
    
    // Schedule the next check in 15 minutes
    setTimeout(() => this.processPendingAutomations(), 15 * 60 * 1000);
  }
  
  /**
   * Check if an automation should be sent now
   */
  private shouldSendAutomation(event: CalendarEvent, trigger: AutomationTrigger): boolean {
    const now = new Date();
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    // For reminders, we send them before the event
    if (trigger.type === 'reminder') {
      // Calculate when the reminder should be sent
      let reminderTime: Date;
      
      if (trigger.timing === '15min') {
        reminderTime = new Date(eventStart);
        reminderTime.setMinutes(reminderTime.getMinutes() - 15);
      } else if (trigger.timing === '1hour') {
        reminderTime = new Date(eventStart);
        reminderTime.setHours(reminderTime.getHours() - 1);
      } else if (trigger.timing === '2hours') {
        reminderTime = new Date(eventStart);
        reminderTime.setHours(reminderTime.getHours() - 2);
      } else if (trigger.timing === '3hours') {
        reminderTime = new Date(eventStart);
        reminderTime.setHours(reminderTime.getHours() - 3);
      } else if (trigger.timing === '1day') {
        reminderTime = new Date(eventStart);
        reminderTime.setDate(reminderTime.getDate() - 1);
      } else if (trigger.timing === '2days') {
        reminderTime = new Date(eventStart);
        reminderTime.setDate(reminderTime.getDate() - 2);
      } else {
        // Invalid timing
        return false;
      }
      
      // Check if it's time to send the reminder (within 15 minutes of the reminder time)
      const timeDiff = Math.abs(reminderTime.getTime() - now.getTime());
      return timeDiff <= 15 * 60 * 1000;
    }
    
    // For agendas, we send them immediately after booking
    if (trigger.type === 'agenda' && trigger.timing === 'immediately') {
      // Check if the event was created in the last 15 minutes
      // Using event ID as a proxy for creation time (if available)
      if (event.id) {
        const logEntry = this.automationLog.find(entry => entry.eventId === event.id);
        if (!logEntry) {
          // This is a new event, send the agenda
          return true;
        }
      }
      return false;
    }
    
    // For follow-ups, we send them after the event
    if (trigger.type === 'followup') {
      // Calculate when the follow-up should be sent
      let followupTime: Date;
      
      if (trigger.timing === 'immediately') {
        followupTime = new Date(eventEnd);
      } else if (trigger.timing === '1hour') {
        followupTime = new Date(eventEnd);
        followupTime.setHours(followupTime.getHours() + 1);
      } else if (trigger.timing === '1day') {
        followupTime = new Date(eventEnd);
        followupTime.setDate(followupTime.getDate() + 1);
      } else {
        // Invalid timing
        return false;
      }
      
      // Check if it's time to send the follow-up (within 15 minutes of the follow-up time)
      const timeDiff = Math.abs(followupTime.getTime() - now.getTime());
      return eventEnd < now && timeDiff <= 15 * 60 * 1000;
    }
    
    return false;
  }
  
  /**
   * Execute an automation action
   */
  private async executeAutomation(event: CalendarEvent, trigger: AutomationTrigger) {
    try {
      // Generate the message content
      const content = this.generateAutomationContent(event, trigger);
      
      // Log the automation
      const logEntry: AutomationLogEntry = {
        timestamp: new Date().toISOString(),
        eventId: event.id,
        eventTitle: event.title,
        automationType: `${trigger.type}_${trigger.timing}`,
        status: 'queued'
      };
      this.automationLog.push(logEntry);
      this.saveLogToFile();
      
      // Determine how to send the automation
      // Options: SMS, email, phone call, etc.
      const success = await this.sendAutomation(event, trigger, content);
      
      // Update the automation log
      logEntry.status = success ? 'sent' : 'failed';
      logEntry.details = success ? `Sent ${trigger.type} automation` : 'Failed to send automation';
      this.saveLogToFile();
      
      console.log(`Automation ${success ? 'successfully sent' : 'failed'}: ${trigger.type} for ${event.title}`);
    } catch (error) {
      console.error(`Error executing automation for event ${event.title}:`, error);
    }
  }
  
  /**
   * Generate content for an automation message
   */
  private generateAutomationContent(event: CalendarEvent, trigger: AutomationTrigger): string {
    // If there's a template, use it
    if (trigger.template) {
      const eventDate = new Date(event.start).toLocaleDateString([], {weekday: 'long', month: 'long', day: 'numeric'});
      const eventTime = new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      return trigger.template
        .replace(/{{eventTitle}}/g, event.title)
        .replace(/{{eventDate}}/g, eventDate)
        .replace(/{{eventTime}}/g, eventTime)
        .replace(/{{eventLocation}}/g, event.location || 'our meeting');
    }
    
    // Default content for each automation type
    if (trigger.type === 'reminder') {
      const eventDate = new Date(event.start).toLocaleDateString([], {weekday: 'long', month: 'long', day: 'numeric'});
      const eventTime = new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      return `Don\'t forget about your upcoming ${event.title} on ${eventDate} at ${eventTime}${event.location ? ` at ${event.location}` : ''}. We\'re looking forward to it!`;
    } else if (trigger.type === 'agenda') {
      return `Thank you for scheduling ${event.title}. Here\'s the agenda for our upcoming meeting:\n\n` +
        `1. Introduction and overview\n` +
        `2. Discussion of your specific needs\n` +
        `3. Presentation of solutions\n` +
        `4. Q&A\n` +
        `5. Next steps\n\n` +
        `If you\'d like to add anything to this agenda, please let me know!`;
    } else if (trigger.type === 'followup') {
      return `Thank you for your time during our ${event.title} meeting. I wanted to follow up with a quick summary and next steps:\n\n` +
        `We discussed the following key points:\n` +
        `- Your current situation and challenges\n` +
        `- Potential solutions and approaches\n` +
        `- Timeline and implementation steps\n\n` +
        `Our next steps are:\n` +
        `1. I\'ll send over the materials we discussed\n` +
        `2. You\'ll review and provide feedback\n` +
        `3. We\'ll schedule a follow-up call to finalize details\n\n` +
        `Please let me know if you have any questions!`;
    }
    
    return `This is an automated message regarding your ${event.title} event.`;
  }
  
  /**
   * Send an automation message
   */
  private async sendAutomation(event: CalendarEvent, trigger: AutomationTrigger, content: string): Promise<boolean> {
    try {
      // In a real implementation, this would send the message via SMS, email, etc.
      console.log(`SIMULATION: Sending ${trigger.type} for event "${event.title}"`);
      console.log(`SIMULATION: Message content: ${content}`);
      
      // In a production environment, this would use appropriate integration
      if (event.participants && event.participants.length > 0) {
        // For now, we'll just log that we would send a message
        const participant = event.participants[0];
        console.log(`SIMULATION: Would send to participant: ${participant}`);
        
        // Simulate sending an SMS via SignalWire
        try {
          // This is a simulated call - in production this would actually send a message
          const simulation = true;
          if (!simulation) {
            // This code is commented out to prevent actual sends during development
            // In production, uncomment this code and remove the simulation flag
            
            /*
            // Send SMS reminder
            await signalWireService.sendSMS({
              to: participant,  // In production, this would be a phone number
              body: content
            });
            
            // For voice reminders, we'd generate speech and make a call
            const audioFilePath = await elevenLabsService.generateSpeech(content);
            
            await signalWireService.makeCall({
              to: participant,   // In production, this would be a phone number
              audioUrl: audioFilePath
            });
            */
          }
        } catch (integrationError) {
          console.error('Error in messaging integration:', integrationError);
          return false;
        }
      }
      
      // For CRM logging, we would record this interaction
      console.log(`SIMULATION: Logging ${trigger.type} to CRM system for event "${event.title}"`);
      
      return true;
    } catch (error) {
      console.error('Error sending automation:', error);
      return false;
    }
  }
  
  /**
   * Manually trigger an automation for an event
   * This can be called from an API route when a user schedules an event
   */
  async triggerAutomation(event: CalendarEvent, automationType: 'reminder' | 'agenda' | 'followup', timing: string = 'immediately'): Promise<boolean> {
    try {
      console.log(`Manually triggering ${automationType} automation for event: ${event.title}`);
      
      // Get the default automation triggers
      const triggers = this.automationTriggers.default || [];
      
      // Find the matching trigger
      const trigger = triggers.find(t => t.type === automationType && t.timing === timing);
      
      if (!trigger || !trigger.enabled) {
        console.log(`No matching enabled trigger found for ${automationType}_${timing}`);
        return false;
      }
      
      // Execute the automation
      await this.executeAutomation(event, trigger);
      return true;
    } catch (error) {
      console.error(`Error triggering automation for event ${event.title}:`, error);
      return false;
    }
  }
  
  /**
   * Get automation log entries
   */
  getAutomationLog(): AutomationLogEntry[] {
    return [...this.automationLog];
  }
  
  /**
   * Get automation triggers
   */
  getAutomationTriggers(): Record<string, AutomationTrigger[]> {
    return JSON.parse(JSON.stringify(this.automationTriggers));
  }
  
  /**
   * Update automation triggers
   */
  updateAutomationTriggers(category: string, triggers: AutomationTrigger[]): boolean {
    try {
      this.automationTriggers[category] = triggers;
      fs.writeFileSync(this.automationsPath, JSON.stringify(this.automationTriggers, null, 2));
      console.log(`Updated automation triggers for category: ${category}`);
      return true;
    } catch (error) {
      console.error('Error updating automation triggers:', error);
      return false;
    }
  }
}

// Singleton instance
export const automationService = new AutomationService();