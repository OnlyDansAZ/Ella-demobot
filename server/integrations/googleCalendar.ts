import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { logError, logInfo, logDebug } from '../utils/logger';

/**
 * Google Calendar integration service
 * 
 * This service provides functionality to interact with Google Calendar
 * allowing Ella to create, read, and update calendar events.
 */

// Constants for Google OAuth
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = 'google_token.json';

// Initialize Google OAuth client and Calendar API client
let oAuth2Client: OAuth2Client | null = null;
let calendarClient: calendar_v3.Calendar | null = null;
let isCalendarAvailable = false;

/**
 * Initialize the Google Calendar integration
 * 
 * @returns Whether initialization was successful
 */
export async function initializeGoogleCalendar(): Promise<boolean> {
  try {
    // Check for required environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      logInfo('Google Calendar integration disabled: Missing required OAuth credentials');
      return false;
    }

    // Create OAuth client
    oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Check if we have a refresh token
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (refreshToken) {
      // Set credentials with refresh token
      oAuth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      // Initialize the calendar client
      calendarClient = google.calendar({ version: 'v3', auth: oAuth2Client });
      isCalendarAvailable = true;

      logInfo('Google Calendar integration initialized successfully');
      return true;
    } else {
      logInfo('Google Calendar integration disabled: No refresh token available');
      return false;
    }
  } catch (error) {
    logError('Failed to initialize Google Calendar integration', error);
    return false;
  }
}

/**
 * Check if Google Calendar integration is available
 */
export function isGoogleCalendarAvailable(): boolean {
  return isCalendarAvailable && calendarClient !== null;
}

/**
 * Generate the OAuth URL for the user to authorize the application
 * 
 * @returns The authorization URL or null if OAuth client is not initialized
 */
export function getAuthorizationUrl(): string | null {
  if (!oAuth2Client) {
    logError('Cannot generate auth URL - OAuth client not initialized');
    return null;
  }

  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force to get refresh token
  });
}

/**
 * Handle the OAuth callback and obtain tokens
 * 
 * @param code - The authorization code from the OAuth callback
 * @returns Whether the token was successfully obtained
 */
export async function handleOAuthCallback(code: string): Promise<boolean> {
  if (!oAuth2Client) {
    logError('Cannot handle callback - OAuth client not initialized');
    return false;
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Store the refresh token (should be securely stored in production)
    if (tokens.refresh_token) {
      logInfo('Obtained refresh token. Store this securely: ' + tokens.refresh_token);
    } else {
      logWarn('No refresh token returned. You may need to revoke access and try again with prompt=consent');
    }

    // Initialize the calendar client
    calendarClient = google.calendar({ version: 'v3', auth: oAuth2Client });
    isCalendarAvailable = true;

    return true;
  } catch (error) {
    logError('Error handling OAuth callback', error);
    return false;
  }
}

/**
 * List upcoming calendar events
 * 
 * @param maxResults - Maximum number of events to return
 * @param calendarId - Calendar ID (default: 'primary')
 * @returns List of upcoming events or null if retrieval failed
 */
export async function listUpcomingEvents(
  maxResults: number = 10,
  calendarId: string = 'primary'
): Promise<calendar_v3.Schema$Event[] | null> {
  if (!isGoogleCalendarAvailable()) {
    logError('Cannot list events - Google Calendar integration not available');
    return null;
  }

  try {
    const response = await calendarClient!.events.list({
      calendarId,
      timeMin: (new Date()).toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    logError('Error listing calendar events', error);
    return null;
  }
}

/**
 * Create a new calendar event
 * 
 * @param event - The event details
 * @param calendarId - Calendar ID (default: 'primary')
 * @returns The created event or null if creation failed
 */
export async function createCalendarEvent(
  event: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    reminders?: {
      useDefault?: boolean;
      overrides?: Array<{ method: string; minutes: number }>;
    };
    attendees?: Array<{ email: string; displayName?: string }>;
  },
  calendarId: string = 'primary'
): Promise<calendar_v3.Schema$Event | null> {
  if (!isGoogleCalendarAvailable()) {
    logError('Cannot create event - Google Calendar integration not available');
    return null;
  }

  try {
    const response = await calendarClient!.events.insert({
      calendarId,
      requestBody: event,
      sendUpdates: 'all', // Send invitations to attendees
    });

    return response.data;
  } catch (error) {
    logError('Error creating calendar event', error);
    return null;
  }
}

/**
 * Convert an appointment to a Google Calendar event
 * 
 * @param appointment - The appointment details
 * @returns Google Calendar event object
 */
export function appointmentToCalendarEvent(
  appointment: {
    title: string;
    description?: string;
    date: string;
    startTime: string;
    endTime?: string;
    location?: string;
    details?: string;
    timeZone?: string;
    attendees?: Array<{ email: string; name?: string }>;
  }
): calendar_v3.Schema$Event {
  // Parse date and times
  const { title, description, date, startTime, endTime, location, details, timeZone } = appointment;

  // Convert date and time strings to ISO format
  const startDateTime = new Date(`${date}T${startTime}`);

  // If endTime is not provided, default to 1 hour after start
  let endDateTime: Date;
  if (endTime) {
    endDateTime = new Date(`${date}T${endTime}`);
  } else {
    endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Add 1 hour
  }

  // Create event object
  const event: calendar_v3.Schema$Event = {
    summary: title,
    description: [description, details].filter(Boolean).join('\n\n'),
    location,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 30 }, // 30 minutes before
      ],
    },
  };

  // Add attendees if provided
  if (appointment.attendees && appointment.attendees.length > 0) {
    event.attendees = appointment.attendees.map(attendee => ({
      email: attendee.email,
      displayName: attendee.name,
    }));
  }

  return {
    summary: event.summary || '',
    description: event.description,
    location: event.location,
    start: {
      dateTime: event.start?.dateTime || new Date().toISOString(),
      timeZone: event.start?.timeZone
    },
    end: {
      dateTime: event.end?.dateTime || new Date().toISOString(),
      timeZone: event.end?.timeZone
    },
    reminders: event.reminders,
    attendees: event.attendees
  };
}

/**
 * Create a calendar event from an appointment
 * 
 * @param appointment - The appointment details
 * @param calendarId - Calendar ID (default: 'primary')
 * @returns The created event or null if creation failed
 */
export async function createAppointmentEvent(
  appointment: {
    title: string;
    description?: string;
    date: string;
    startTime: string;
    endTime?: string;
    location?: string;
    details?: string;
    timeZone?: string;
    attendees?: Array<{ email: string; name?: string }>;
  },
  calendarId: string = 'primary'
): Promise<calendar_v3.Schema$Event | null> {
  if (!isGoogleCalendarAvailable()) {
    logError('Cannot create appointment event - Google Calendar integration not available');
    return null;
  }

  const event = appointmentToCalendarEvent(appointment);
  return createCalendarEvent(event, calendarId);
}

/**
 * Get calendar event by ID
 * 
 * @param eventId - The ID of the event to get
 * @param calendarId - Calendar ID (default: 'primary')
 * @returns The event or null if retrieval failed
 */
export async function getCalendarEvent(
  eventId: string,
  calendarId: string = 'primary'
): Promise<calendar_v3.Schema$Event | null> {
  if (!isGoogleCalendarAvailable()) {
    logError('Cannot get event - Google Calendar integration not available');
    return null;
  }

  try {
    const response = await calendarClient!.events.get({
      calendarId,
      eventId,
    });

    return response.data;
  } catch (error) {
    logError(`Error getting calendar event ${eventId}`, error);
    return null;
  }
}

/**
 * Update a calendar event
 * 
 * @param eventId - The ID of the event to update
 * @param updates - The fields to update
 * @param calendarId - Calendar ID (default: 'primary')
 * @returns The updated event or null if update failed
 */
export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<calendar_v3.Schema$Event>,
  calendarId: string = 'primary'
): Promise<calendar_v3.Schema$Event | null> {
  if (!isGoogleCalendarAvailable()) {
    logError('Cannot update event - Google Calendar integration not available');
    return null;
  }

  try {
    // First get the current event
    const currentEvent = await getCalendarEvent(eventId, calendarId);

    if (!currentEvent) {
      return null;
    }

    // Merge updates with current event
    const updatedEvent = { ...currentEvent, ...updates };

    const response = await calendarClient!.events.update({
      calendarId,
      eventId,
      requestBody: updatedEvent,
      sendUpdates: 'all', // Send updates to attendees
    });

    return response.data;
  } catch (error) {
    logError(`Error updating calendar event ${eventId}`, error);
    return null;
  }
}

/**
 * Delete a calendar event
 * 
 * @param eventId - The ID of the event to delete
 * @param calendarId - Calendar ID (default: 'primary')
 * @returns Whether deletion was successful
 */
export async function deleteCalendarEvent(
  eventId: string,
  calendarId: string = 'primary'
): Promise<boolean> {
  if (!isGoogleCalendarAvailable()) {
    logError('Cannot delete event - Google Calendar integration not available');
    return false;
  }

  try {
    await calendarClient!.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'all', // Notify attendees
    });

    return true;
  } catch (error) {
    logError(`Error deleting calendar event ${eventId}`, error);
    return false;
  }
}

/**
 * Find available time slots
 * 
 * @param date - The date to check (YYYY-MM-DD)
 * @param durationMinutes - Duration of the meeting in minutes
 * @param startHour - Start hour of the workday (e.g., 9 for 9 AM)
 * @param endHour - End hour of the workday (e.g., 17 for 5 PM)
 * @param calendarId - Calendar ID (default: 'primary')
 * @returns Array of available time slots as { start, end } objects
 */
export async function findAvailableTimeSlots(
  date: string,
  durationMinutes: number = 60,
  startHour: number = 9,
  endHour: number = 17,
  calendarId: string = 'primary'
): Promise<Array<{ start: Date; end: Date }> | null> {
  if (!isGoogleCalendarAvailable()) {
    logError('Cannot find available time slots - Google Calendar integration not available');
    return null;
  }

  try {
    // Create start and end of day
    const startOfDay = new Date(`${date}T${String(startHour).padStart(2, '0')}:00:00`);
    const endOfDay = new Date(`${date}T${String(endHour).padStart(2, '0')}:00:00`);

    // Get events for the day
    const events = await calendarClient!.events.list({
      calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const busyTimes: Array<{ start: Date; end: Date }> = [];

    // Extract busy times from events
    if (events.data.items && events.data.items.length > 0) {
      events.data.items.forEach(event => {
        if (event.start?.dateTime && event.end?.dateTime) {
          busyTimes.push({
            start: new Date(event.start.dateTime),
            end: new Date(event.end.dateTime)
          });
        }
      });
    }

    // Find available slots
    const availableSlots: Array<{ start: Date; end: Date }> = [];
    let currentTime = new Date(startOfDay);

    // Duration in milliseconds
    const durationMs = durationMinutes * 60 * 1000;

    while (currentTime.getTime() + durationMs <= endOfDay.getTime()) {
      const potentialEndTime = new Date(currentTime.getTime() + durationMs);

      // Check if this time slot overlaps with any busy times
      const isOverlapping = busyTimes.some(busySlot => {
        return (
          (currentTime >= busySlot.start && currentTime < busySlot.end) ||
          (potentialEndTime > busySlot.start && potentialEndTime <= busySlot.end) ||
          (currentTime <= busySlot.start && potentialEndTime >= busySlot.end)
        );
      });

      if (!isOverlapping) {
        availableSlots.push({
          start: new Date(currentTime),
          end: potentialEndTime
        });
      }

      // Move to next 30-minute increment
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }

    return availableSlots;
  } catch (error) {
    logError('Error finding available time slots', error);
    return null;
  }
}

/**
 * Format available time slots into a human-readable format
 * 
 * @param timeSlots - Array of time slot objects
 * @returns Array of formatted time strings
 */
export function formatAvailableTimeSlots(
  timeSlots: Array<{ start: Date; end: Date }>
): Array<{ formatted: string; start: Date; end: Date }> {
  return timeSlots.map(slot => {
    const startHour = slot.start.getHours();
    const startMinute = slot.start.getMinutes();
    const endHour = slot.end.getHours();
    const endMinute = slot.end.getMinutes();

    const startTime = `${startHour % 12 || 12}:${String(startMinute).padStart(2, '0')} ${startHour >= 12 ? 'PM' : 'AM'}`;
    const endTime = `${endHour % 12 || 12}:${String(endMinute).padStart(2, '0')} ${endHour >= 12 ? 'PM' : 'AM'}`;

    return {
      formatted: `${startTime} - ${endTime}`,
      start: slot.start,
      end: slot.end
    };
  });
}

// Helper for debugging issues with Google Calendar
function logWarn(message: string, data?: any): void {
  const logMessage = `[WARN] ${message}`;
  console.warn(logMessage);
  if (data) {
    console.warn('Data:', data);
  }
}