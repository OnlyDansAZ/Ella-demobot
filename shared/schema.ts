import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }),
  password: varchar("password", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const personas = pgTable("personas", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  systemPrompt: text("system_prompt"),
  memoryMode: text("memory_mode"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }),
  date: varchar("date", { length: 10 }),
  startTime: varchar("start_time", { length: 5 }),
  endTime: varchar("end_time", { length: 5 }),
  location: varchar("location", { length: 255 }),
  notes: text("notes"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
