#!/usr/bin/env node

/**
 * Production Server for YoBot/Ella AI
 * 
 * This server is designed to run the production build of the application
 * by serving static files from the 'dist' directory.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 5000;

// Find the correct build directory
let distDir = path.join(__dirname, 'dist', 'public');
if (!fs.existsSync(distDir)) {
  distDir = path.join(__dirname, 'dist');
}

// Create Express application
const app = express();

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: 'production',
    service: 'YoBot/Ella AI Platform'
  });
});

// Setup API routes here if needed
// app.use('/api/...', apiRouter);

// Serve static files from the build directory
console.log(`Serving static files from: ${distDir}`);
app.use(express.static(distDir));

// For any request that doesn't match a static file, send React's index.html
app.get('*', (req, res) => {
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send(
      `<html>
        <head><title>YoBot/Ella AI Platform - Error</title></head>
        <body>
          <h1>Configuration Error</h1>
          <p>The application build files cannot be found.</p>
          <p>Please run <code>npm run build</code> to create the production build.</p>
        </body>
      </html>`
    );
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
==========================================
   YoBot/Ella AI Platform - Production Server
==========================================
Server available at: http://localhost:${PORT}
Health check: http://localhost:${PORT}/api/health
  `);
});