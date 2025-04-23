import { eq, and, gte, lte, desc, isNull, or, sql } from 'drizzle-orm';
import { db, isDatabaseAvailable } from './db';
import { 
  appointments, 
  type Appointment, 
  type InsertAppointment,
  type UpdateAppointment 
} from '@shared/schema';

// In-memory storage for appointments when database is unavailable
class InMemoryAppointmentStore {
  appointments: Map<number, any> = new Map();
  nextId: number = 1;
  
  add(appointment: any): any {
    const id = this.nextId++;
    const newAppointment = { ...appointment, id };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }
  
  get(id: number): any {
    return this.appointments.get(id);
  }
  
  update(id: number, updates: any): any {
    const appointment = this.appointments.get(id);
    if (!appointment) return null;
    
    const updated = { ...appointment, ...updates };
    this.appointments.set(id, updated);
    return updated;
  }
  
  delete(id: number): boolean {
    return this.appointments.delete(id);
  }
  
  getAll(): any[] {
    return Array.from(this.appointments.values());
  }
  
  getByDate(dateStr: string): any[] {
    return Array.from(this.appointments.values())
      .filter(appt => appt.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  
  getUpcoming(dateStr: string, limit: number): any[] {
    return Array.from(this.appointments.values())
      .filter(appt => appt.date >= dateStr)
      .sort((a, b) => {
        // First sort by date
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        
        // Then by time
        return a.startTime.localeCompare(b.startTime);
      })
      .slice(0, limit);
  }
  
  findConflicts(dateStr: string, startTime: string, endTime: string): any[] {
    return Array.from(this.appointments.values())
      .filter(appt => {
        if (appt.date !== dateStr) return false;
        
        const apptEndTime = appt.endTime || this.addHoursToTime(appt.startTime, 1);
        
        // Check for overlap
        return (
          // Appointment starts during our time slot
          (appt.startTime <= endTime && appt.startTime >= startTime) ||
          // Appointment ends during our time slot
          (apptEndTime <= endTime && apptEndTime >= startTime) ||
          // Appointment completely overlaps our time slot
          (appt.startTime <= startTime && apptEndTime >= endTime)
        );
      });
  }
  
  // Helper function to add hours to a time string
  private addHoursToTime(timeStr: string, hoursToAdd: number): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    let newHours = hours + hoursToAdd;
    // Handle overflow (past midnight)
    newHours = newHours % 24;
    
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}

// Create a singleton memory store
const memoryStore = new InMemoryAppointmentStore();

/**
 * Service for managing persistent appointment storage
 */
export class AppointmentStorage {
  /**
   * Create a new appointment in the database
   */
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    try {
      // Convert the time strings to SQL time format and date to string format
      const formattedAppointment = {
        ...appointment,
        date: appointment.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD
        startTime: this.formatTimeString(appointment.startTime),
        endTime: appointment.endTime ? this.formatTimeString(appointment.endTime) : undefined
      };
      
      if (!isDatabaseAvailable) {
        throw new Error('Database is not available, using memory store');
      }
      
      // Insert the appointment into the database
      const [result] = await db.insert(appointments).values(formattedAppointment as any).returning();
      
      console.log('Created new appointment:', result);
      
      return result;
    } catch (error) {
      console.error('Error creating appointment, using memory store:', error);
      
      // Fall back to in-memory storage
      // Format the appointment for the memory store
      const memoryAppointment = {
        ...appointment,
        date: appointment.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD
        startTime: this.formatTimeString(appointment.startTime),
        endTime: appointment.endTime ? this.formatTimeString(appointment.endTime) : undefined
      };
      
      const memoryResult = memoryStore.add(memoryAppointment);
      
      return {
        ...memoryResult,
        date: new Date(memoryResult.date) // Convert back to Date object for consistency
      } as Appointment;
    }
  }
  
  /**
   * Get an appointment by its ID
   */
  async getAppointment(id: number): Promise<Appointment | undefined> {
    try {
      if (!isDatabaseAvailable) {
        throw new Error('Database is not available, using memory store');
      }
      
      const [result] = await db.select().from(appointments).where(eq(appointments.id, id));
      return result;
    } catch (error) {
      console.error('Error getting appointment, using memory store:', error);
      
      // Fall back to in-memory storage
      const appointment = memoryStore.get(id);
      
      if (!appointment) {
        return undefined;
      }
      
      return {
        ...appointment,
        date: new Date(appointment.date) // Convert back to Date object for consistency
      } as Appointment;
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
      // Convert Date to YYYY-MM-DD string format for PostgreSQL date comparison
      const dateStr = date.toISOString().split('T')[0];
      
      return await db
        .select()
        .from(appointments)
        .where(eq(appointments.date, dateStr))
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
      const dateStr = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
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
            eq(appointments.date, dateStr),
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
      const todayStr = today.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
      
      return await db
        .select()
        .from(appointments)
        .where(gte(appointments.date, todayStr))
        .orderBy(appointments.date) // Order by date first
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