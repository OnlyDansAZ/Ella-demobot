#!/usr/bin/env node

import express from 'express';
const app = express();
const PORT = 5000;

// Basic route
app.get('/', (req, res) => {
  res.send('YoBot Basic Server is running');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'YoBot Basic Server',
    port: PORT
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
YoBot Application - Basic Server
Running on port ${PORT}
Access the health check at http://localhost:${PORT}/api/health
  `);
});