import { Router, Request, Response } from 'express';
import { appointmentStorage } from '../appointmentStorage';
import { 
  insertAppointmentSchema, 
  updateAppointmentSchema
} from '@shared/schema';
import { z } from 'zod';

const router = Router();

/**
 * API endpoint to create a new appointment
 * POST /api/appointments
 * 
 * Request body should include:
 * - title: string
 * - date: string (YYYY-MM-DD format)
 * - startTime: string (HH:MM format)
 * - Optional fields: description, endTime, location, userId, timeZone
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const validatedData = insertAppointmentSchema.parse(req.body);
    
    // Check for conflicts before creating
    const conflicts = await appointmentStorage.checkForConflicts(
      validatedData.date, 
      validatedData.startTime, 
      validatedData.endTime
    );
    
    if (conflicts.length > 0) {
      return res.status(409).json({
        message: 'Time slot conflicts with existing appointments',
        conflicts
      });
    }
    
    // Create the appointment
    const appointment = await appointmentStorage.createAppointment(validatedData);
    
    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid appointment data',
        errors: error.errors
      });
    }
    
    res.status(500).json({ message: 'Failed to create appointment' });
  }
});

/**
 * API endpoint to get all appointments for a specific date
 * GET /api/appointments/date/:date
 * 
 * URL parameter:
 * - date: string (YYYY-MM-DD format)
 */
router.get('/date/:date', async (req: Request, res: Response) => {
  try {
    const dateStr = req.params.date;
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    const appointments = await appointmentStorage.getAppointmentsByDate(date);
    res.json(appointments);
  } catch (error) {
    console.error('Error getting appointments:', error);
    res.status(500).json({ message: 'Failed to get appointments' });
  }
});

/**
 * API endpoint to get a specific appointment by ID
 * GET /api/appointments/:id
 * 
 * URL parameter:
 * - id: number
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }
    
    const appointment = await appointmentStorage.getAppointment(id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('Error getting appointment:', error);
    res.status(500).json({ message: 'Failed to get appointment' });
  }
});

/**
 * API endpoint to update an existing appointment
 * PATCH /api/appointments/:id
 * 
 * URL parameter:
 * - id: number
 * 
 * Request body can include any of the appointment fields to update
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }
    
    // Validate the update data
    const validatedData = updateAppointmentSchema.parse(req.body);
    
    // Get the existing appointment
    const existingAppointment = await appointmentStorage.getAppointment(id);
    
    if (!existingAppointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check for conflicts if date or time is being updated
    if (validatedData.date || validatedData.startTime || validatedData.endTime) {
      const date = validatedData.date || existingAppointment.date;
      const startTime = validatedData.startTime || existingAppointment.startTime.toString();
      const endTime = validatedData.endTime || 
                     (existingAppointment.endTime ? existingAppointment.endTime.toString() : undefined);
      
      // Get conflicts excluding the current appointment
      const conflicts = (await appointmentStorage.checkForConflicts(
        new Date(date), 
        startTime, 
        endTime
      )).filter(a => a.id !== id);
      
      if (conflicts.length > 0) {
        return res.status(409).json({
          message: 'Updated time slot conflicts with existing appointments',
          conflicts
        });
      }
    }
    
    // Update the appointment
    const updatedAppointment = await appointmentStorage.updateAppointment(id, validatedData);
    
    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid appointment data',
        errors: error.errors
      });
    }
    
    res.status(500).json({ message: 'Failed to update appointment' });
  }
});

/**
 * API endpoint to delete an appointment
 * DELETE /api/appointments/:id
 * 
 * URL parameter:
 * - id: number
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }
    
    const deleted = await appointmentStorage.deleteAppointment(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Failed to delete appointment' });
  }
});

/**
 * API endpoint to check for conflicting appointments
 * GET /api/appointments/conflicts
 * 
 * Query parameters:
 * - date: string (YYYY-MM-DD format)
 * - startTime: string (HH:MM format)
 * - endTime?: string (HH:MM format) - optional
 */
router.get('/conflicts', (req: Request, res: Response) => {
  try {
    const { date, startTime, endTime } = req.query;
    
    if (!date || !startTime) {
      return res.status(400).json({ message: 'Date and start time are required' });
    }
    
    const dateObj = new Date(date as string);
    
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    const conflicts = await appointmentStorage.checkForConflicts(
      dateObj, 
      startTime as string, 
      endTime as string | undefined
    );
    
    res.json({
      hasConflicts: conflicts.length > 0,
      conflicts
    });
  } catch (error) {
    console.error('Error checking for conflicts:', error);
    res.status(500).json({ message: 'Failed to check for conflicts' });
  }
});

/**
 * API endpoint to get upcoming appointments
 * GET /api/appointments/upcoming
 * 
 * Query parameters:
 * - limit: number (optional, default 5) - max number of appointments to return
 */
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const limitStr = req.query.limit as string | undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : 5;
    
    if (isNaN(limit) || limit < 1) {
      return res.status(400).json({ message: 'Invalid limit parameter' });
    }
    
    const appointments = await appointmentStorage.getUpcomingAppointments(limit);
    res.json(appointments);
  } catch (error) {
    console.error('Error getting upcoming appointments:', error);
    res.status(500).json({ message: 'Failed to get upcoming appointments' });
  }
});

export default router;