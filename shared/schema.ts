import { pgTable, text, serial, integer, boolean, timestamp, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Appointments table for persistent storage of scheduled events
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  title: text("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time"),
  location: text("location"),
  status: text("status").default("confirmed"), // confirmed, cancelled, completed
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  calendarId: text("calendar_id"), // For external calendar integration
  timeZone: text("time_zone").default("UTC"),
});

// Create Zod schema for appointment insertion
export const insertAppointmentSchema = createInsertSchema(appointments)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    date: z.coerce.date(), // Allow string date input which will be converted to Date
    startTime: z.string(), // Accept time as string in form 'HH:MM'
    endTime: z.string().optional(), // Optional end time
  });

export const updateAppointmentSchema = createInsertSchema(appointments)
  .partial()
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type UpdateAppointment = z.infer<typeof updateAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
