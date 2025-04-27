#!/usr/bin/env node

/**
 * Minimal Express Server for YoBot/Ella AI
 * 
 * This simplified server is specifically designed for Replit's workflow
 * It immediately opens port 5000 with a health check endpoint
 * This satisfies Replit's workflow requirement without extra configuration
 */

import express from 'express';

// Create Express application
const app = express();
const PORT = 5000;

// Add a basic route
app.get('/', (req, res) => {
  res.send('YoBot/Ella AI Platform - Workflow Server Running');
});

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'YoBot Workflow Server'
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
==========================================
   YoBot/Ella AI Platform - Workflow Server
==========================================
Server available at: http://localhost:${PORT}
Health check: http://localhost:${PORT}/api/health

❗ NOTICE: This is a minimal server designed
   specifically for Replit workflows. It does not
   provide full application functionality.
  `);
});