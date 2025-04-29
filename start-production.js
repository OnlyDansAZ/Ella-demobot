#!/usr/bin/env node

/**
 * Simple Production Server for YoBot/Ella AI
 * 
 * This server runs the static landing page we've created
 * without relying on Vite's development server.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 5000;
const distDir = path.join(__dirname, 'dist', 'public');

const app = express();

// Serve static files
app.use(express.static(distDir));

// API route example
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'YoBot/Ella AI Platform'
  });
});

// For all other requests, serve the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`YoBot/Ella AI Platform running at http://localhost:${PORT}`);
});
