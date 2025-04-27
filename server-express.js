#!/usr/bin/env node

/**
 * Minimal Express Server for YoBot/Ella AI
 * 
 * This minimal server satisfies the Replit port requirement
 * by immediately listening on port 5000 with a health check endpoint
 */

import express from 'express';

// Create Express application
const app = express();
const PORT = 5000;

// Add a basic route
app.get('/', (req, res) => {
  res.send('YoBot/Ella AI Platform - Server Running');
});

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'YoBot Express Server'
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
==========================================
   YoBot/Ella AI Platform - Server Running
==========================================
Server available at: http://localhost:${PORT}
Health check: http://localhost:${PORT}/api/health
  `);
});