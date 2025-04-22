import { eq, and, gte, lte, desc, isNull, or } from 'drizzle-orm';
import { db } from './db';
import { 
  appointments, 
  type Appointment, 
  type InsertAppointment,
  type UpdateAppointment 
} from '@shared/schema';

/**
 * Service for managing persistent appointment storage
 */
export class AppointmentStorage {
  /**
   * Create a new appointment in the database
   */
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    try {
      // Convert the time strings to SQL time format
      const formattedAppointment = {
        ...appointment,
        startTime: this.formatTimeString(appointment.startTime),
        endTime: appointment.endTime ? this.formatTimeString(appointment.endTime) : undefined
      };
      
      // Insert the appointment into the database
      const [result] = await db.insert(appointments).values(formattedAppointment).returning();
      
      console.log('Created new appointment:', result);
      
      return result;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw new Error('Failed to create appointment');
    }
  }
  
  /**
   * Get an appointment by its ID
   */
  async getAppointment(id: number): Promise<Appointment | undefined> {
    try {
      const [result] = await db.select().from(appointments).where(eq(appointments.id, id));
      return result;
    } catch (error) {
      console.error('Error getting appointment:', error);
      throw new Error('Failed to get appointment');
    }
  }
  
  /**
   * Update an existing appointment
   */
  async updateAppointment(id: number, updates: UpdateAppointment): Promise<Appointment> {
    try {
      // Format time strings if provided
      const formattedUpdates = {
        ...updates,
        startTime: updates.startTime ? this.formatTimeString(updates.startTime) : undefined,
        endTime: updates.endTime ? this.formatTimeString(updates.endTime) : undefined,
        updatedAt: new Date()
      };
      
      const [result] = await db
        .update(appointments)
        .set(formattedUpdates)
        .where(eq(appointments.id, id))
        .returning();
      
      if (!result) {
        throw new Error(`Appointment with ID ${id} not found`);
      }
      
      return result;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw new Error('Failed to update appointment');
    }
  }
  
  /**
   * Delete an appointment
   */
  async deleteAppointment(id: number): Promise<boolean> {
    try {
      const [result] = await db
        .delete(appointments)
        .where(eq(appointments.id, id))
        .returning({ id: appointments.id });
      
      return !!result;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw new Error('Failed to delete appointment');
    }
  }
  
  /**
   * Get all appointments for a specific date
   */
  async getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    try {
      return await db
        .select()
        .from(appointments)
        .where(eq(appointments.date, date))
        .orderBy(appointments.startTime);
    } catch (error) {
      console.error('Error getting appointments by date:', error);
      throw new Error('Failed to get appointments');
    }
  }
  
  /**
   * Check for conflicting appointments in a time range
   */
  async checkForConflicts(date: Date, startTime: string, endTime?: string): Promise<Appointment[]> {
    try {
      const formattedStartTime = this.formatTimeString(startTime);
      const formattedEndTime = endTime ? this.formatTimeString(endTime) : undefined;
      
      // If no end time is provided, assume it's a 1-hour appointment
      const effectiveEndTime = formattedEndTime || this.addHoursToTime(formattedStartTime, 1);
      
      // Find appointments that overlap with the requested time slot
      return await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.date, date),
            and(
              // Start time is before the end of another appointment
              lte(appointments.startTime, effectiveEndTime),
              // End time is after the start of another appointment
              or(
                isNull(appointments.endTime),
                gte(appointments.endTime, formattedStartTime)
              )
            )
          )
        )
        .orderBy(appointments.startTime);
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      throw new Error('Failed to check for conflicts');
    }
  }
  
  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(limit: number = 5): Promise<Appointment[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return await db
        .select()
        .from(appointments)
        .where(gte(appointments.date, today))
        .orderBy([appointments.date, appointments.startTime])
        .limit(limit);
    } catch (error) {
      console.error('Error getting upcoming appointments:', error);
      throw new Error('Failed to get upcoming appointments');
    }
  }
  
  /**
   * Helper: Format time string to SQL time format
   */
  private formatTimeString(timeStr: string): string {
    // Handle various time formats
    
    // If already in HH:MM format, return as is
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }
    
    // If in HH:MM AM/PM format, convert to 24h
    const ampmMatch = timeStr.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?$/i);
    if (ampmMatch) {
      let [_, hours, minutes, period] = ampmMatch;
      let hour = parseInt(hours, 10);
      
      // Convert to 24-hour format if period is specified
      if (period && period.toLowerCase().startsWith('p') && hour < 12) {
        hour += 12;
      } else if (period && period.toLowerCase().startsWith('a') && hour === 12) {
        hour = 0;
      }
      
      return `${hour.toString().padStart(2, '0')}:${minutes || '00'}`;
    }
    
    // If we can't parse it, return it as is
    console.warn(`Could not parse time format: ${timeStr}, returning as-is`);
    return timeStr;
  }
  
  /**
   * Helper: Add hours to a time string
   */
  private addHoursToTime(timeStr: string, hoursToAdd: number): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    let newHours = hours + hoursToAdd;
    // Handle overflow (past midnight)
    newHours = newHours % 24;
    
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}

// Create a singleton instance
export const appointmentStorage = new AppointmentStorage();