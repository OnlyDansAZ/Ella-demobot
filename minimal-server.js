#!/usr/bin/env node

/**
 * Minimal Express Server for YoBot
 * 
 * This is a simplified server that just listens on port 5000
 * to verify that the port is accessible
 */

import express from 'express';

// Create Express app
const app = express();
const PORT = 5000;

// Basic route
app.get('/', (req, res) => {
  res.send('YoBot Minimal Server is running');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'YoBot Minimal Server',
    port: PORT
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                YOBOT APPLICATION                  ║
╠═══════════════════════════════════════════════════╣
║ Minimal server running on port ${PORT}              ║
║                                                   ║
║ Access the health check at:                       ║
║ http://localhost:${PORT}/api/health                 ║
╚═══════════════════════════════════════════════════╝
  `);
});