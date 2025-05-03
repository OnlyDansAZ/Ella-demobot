import { db } from "../db";
import { appointments } from "../shared/schema";
import { eq } from "drizzle-orm";

export class AppointmentStorage {
  async getAll() {
    return await db.select().from(appointments);
  }

  async getById(id: number) {
    const result = await db.select().from(appointments).where(eq(appointments.id, id));
    return result[0];
  }

  async create(data: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location?: string;
    notes?: string;
    userId: number;
  }) {
    const [newAppointment] = await db.insert(appointments).values(data).returning();
    return newAppointment;
  }

  async update(id: number, updates: Partial<typeof appointments.$inferInsert>) {
    const [updated] = await db.update(appointments).set(updates).where(eq(appointments.id, id)).returning();
    return updated;
  }

  async delete(id: number) {
    await db.delete(appointments).where(eq(appointments.id, id));
  }
}
