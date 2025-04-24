import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { EventEmitter } from 'events';

neonConfig.webSocketConstructor = ws;

// Flag to track database availability
export let isDatabaseAvailable = false;

// Create an event emitter to notify when database status changes
export const dbStatusEmitter = new EventEmitter();

// Function to update database status and emit event
export const updateDatabaseStatus = (status: boolean) => {
  const previousStatus = isDatabaseAvailable;
  isDatabaseAvailable = status;
  
  // Only emit if the status changed
  if (previousStatus !== status) {
    dbStatusEmitter.emit('statusChanged', status);
    console.log(`Database status changed to: ${status ? 'Available' : 'Unavailable'}`);
  }
};

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
        updateDatabaseStatus(true);
      })
      .catch(err => {
        console.warn("Database connection failed:", err.message);
        updateDatabaseStatus(false);
        
        // Set up a retry mechanism for reconnection
        let retryCount = 0;
        const maxRetries = 5;
        const retryInterval = 5000; // 5 seconds
        
        const retryConnection = () => {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying database connection (${retryCount}/${maxRetries})...`);
            
            setTimeout(() => {
              pool.query('SELECT 1')
                .then(() => {
                  console.log("Database connection successful on retry");
                  updateDatabaseStatus(true);
                })
                .catch(err => {
                  console.warn(`Database connection retry ${retryCount} failed:`, err.message);
                  retryConnection(); // Try again
                });
            }, retryInterval * Math.pow(2, retryCount - 1)); // Exponential backoff
          } else {
            console.error("Max database connection retries reached. Using fallback storage.");
          }
        };
        
        // Start retry process
        retryConnection();
      });
  }
  
  // If we're here, we can create the database object
  db = drizzle(pool as any);
  
  // Add error handler to pool to catch connection errors
  if (pool instanceof Pool) {
    pool.on('error', (err) => {
      console.error('Unexpected database error:', err.message);
      updateDatabaseStatus(false);
      
      // Try to reconnect
      setTimeout(() => {
        console.log('Attempting to reconnect to database after error...');
        pool.query('SELECT 1')
          .then(() => {
            console.log('Database reconnection successful');
            updateDatabaseStatus(true);
          })
          .catch(err => {
            console.error('Database reconnection failed:', err.message);
          });
      }, 5000);
    });
  }
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
  
  updateDatabaseStatus(false);
}

// Create a function to safely execute database operations with fallback
export async function safeDbOperation<T>(
  dbOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T> | T
): Promise<T> {
  if (!isDatabaseAvailable) {
    console.log('Database unavailable, using fallback storage');
    return fallbackOperation();
  }
  
  try {
    return await dbOperation();
  } catch (error) {
    console.error('Database operation failed, using fallback:', error);
    updateDatabaseStatus(false);
    return fallbackOperation();
  }
}

export { pool, db };
