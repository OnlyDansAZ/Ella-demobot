import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Flag to track database availability
export let isDatabaseAvailable = false;

// Create a mock pool and db for when the database is unavailable
class MockPool {
  async query() {
    throw new Error("Database is not available");
  }
  
  async connect() {
    throw new Error("Database is not available");
  }
  
  on() {
    return this;
  }
  
  end() {
    return Promise.resolve();
  }
}

let pool: Pool | MockPool;
let db: NeonDatabase<typeof schema>;

// Try to connect to the database, but don't crash if it fails
try {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not set. Using in-memory storage.");
    pool = new MockPool() as any;
  } else {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000 // 5 second timeout
    });
    
    // Test the connection
    pool.query('SELECT 1')
      .then(() => {
        console.log("Database connection successful");
        isDatabaseAvailable = true;
      })
      .catch(err => {
        console.warn("Database connection failed:", err.message);
        isDatabaseAvailable = false;
      });
  }
  
  // If we're here, we can create the database object
  db = drizzle(pool as any);
} catch (error) {
  console.error("Error initializing database:", error);
  pool = new MockPool() as any;
  
  // Create a mock db object with minimal functionality to prevent crashes
  db = {
    select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
    delete: () => ({ where: () => Promise.resolve([]) })
  } as any;
  
  isDatabaseAvailable = false;
}

export { pool, db };
