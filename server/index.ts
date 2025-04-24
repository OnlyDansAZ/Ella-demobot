import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initVectorDB } from "./vectordb";
import { seedKnowledgeBase } from "./documentProcessor";

// Global error handler for uncaught database errors 
// to prevent app crashes on database connection issues
process.on('uncaughtException', (error: any) => {
  // Check if it's a database connection error
  if (error.code && 
      (error.code === '57P01' || // Terminating connection
       error.code === '08006' || // Connection failure
       error.code === '08001' || // Unable to connect
       error.code === '57P03')) { // Cannot connect now
    
    console.error('Uncaught database connection error:', error.message);
    
    // Log the error but prevent app from crashing
    console.error('Database connection was interrupted. The application will continue running with degraded functionality.');
    
    // Don't throw the error further, just log it and keep the app running
    return;
  }
  
  // For non-database uncaught errors, log and let Node.js handle normally
  console.error('Uncaught exception:', error);
  throw error;
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize vector database for RAG capabilities
  try {
    log("Initializing vector database for RAG capabilities...");
    const dbInitialized = await initVectorDB();
    if (dbInitialized) {
      log("Vector database initialized successfully");
      
      // Seed knowledge base with YoBot product information
      log("Seeding knowledge base with YoBot product information...");
      const seedResult = await seedKnowledgeBase();
      if (seedResult.success) {
        log(`Knowledge base seeded successfully with ${seedResult.count} document chunks`);
      } else {
        log("Warning: Failed to seed knowledge base");
      }
    } else {
      log("Warning: Failed to initialize vector database");
    }
  } catch (error: unknown) {
    log(`Error initializing RAG system: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
