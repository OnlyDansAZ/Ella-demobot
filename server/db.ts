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
    pool.on('error', (err: any) => {
      // Check for known error types that require special handling
      const isAdminTermination = err.code === '57P01'; // Administrator command termination
      const isFatalError = err.severity === 'FATAL';
      
      if (isAdminTermination) {
        console.warn('Database connection terminated by administrator. This is expected in some environments.');
      } else {
        console.error('Unexpected database error:', err.message, err.code);
      }
      
      // Update status regardless of error type
      updateDatabaseStatus(false);
      
      // Adjust reconnection strategy based on error type
      const reconnectDelay = isAdminTermination ? 10000 : 5000; // Longer delay for admin terminations
      
      // Try to reconnect with backoff
      console.log(`Scheduling database reconnection in ${reconnectDelay/1000} seconds...`);
      setTimeout(() => {
        console.log('Attempting to reconnect to database after error...');
        
        try {
          // Create a fresh pool if it's a fatal error
          if (isFatalError && process.env.DATABASE_URL) {
            console.log('Recreating connection pool after fatal error');
            pool = new Pool({ 
              connectionString: process.env.DATABASE_URL,
              connectionTimeoutMillis: 10000 // 10 second timeout
            });
          }
          
          pool.query('SELECT 1')
            .then(() => {
              console.log('Database reconnection successful');
              updateDatabaseStatus(true);
            })
            .catch(err => {
              console.error('Database reconnection failed:', err.message);
              
              // Schedule another retry with exponential backoff
              const furtherDelay = reconnectDelay * 2;
              console.log(`Scheduling another reconnection attempt in ${furtherDelay/1000} seconds...`);
              setTimeout(() => {
                console.log('Making another reconnection attempt...');
                pool.query('SELECT 1')
                  .then(() => {
                    console.log('Database reconnection successful on second attempt');
                    updateDatabaseStatus(true);
                  })
                  .catch(e => {
                    console.error('Database reconnection failed on second attempt. Falling back to file storage:', e.message);
                  });
              }, furtherDelay);
            });
        } catch (reconnectError) {
          console.error('Error during reconnection attempt:', reconnectError);
        }
      }, reconnectDelay);
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
  fallbackOperation: () => Promise<T> | T,
  operationName: string = 'Database operation'
): Promise<T> {
  // First check if database is available
  if (!isDatabaseAvailable) {
    console.log(`${operationName}: Database unavailable, using fallback storage`);
    return fallbackOperation();
  }
  
  try {
    // Set a timeout for database operations to prevent long-hanging queries
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${operationName} timed out after 5000ms`));
      }, 5000);
    });
    
    // Race the database operation against the timeout
    const result = await Promise.race([
      dbOperation(),
      timeoutPromise
    ]) as T;
    
    return result;
  } catch (error: any) {
    // Handle specific error codes that indicate database connectivity issues
    const isConnectionError = 
      error.code === '57P01' || // Administrator command termination
      error.code === '08006' || // Connection failure
      error.code === '08001' || // Unable to establish connection
      error.code === '08004' || // Rejected connection
      error.code === '57P03' || // Cannot connect now
      error.message?.includes('timeout') ||
      error.message?.includes('connection');
    
    if (isConnectionError) {
      console.warn(`${operationName}: Database connection issue, using fallback:`, error.message);
      // Only update status for connection-related errors
      updateDatabaseStatus(false);
    } else {
      console.error(`${operationName}: Operation failed with non-connection error:`, error);
    }
    
    // Use fallback for all error types
    return fallbackOperation();
  }
}

export { pool, db };
