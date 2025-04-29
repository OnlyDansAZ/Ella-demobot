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

// Get current file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 5000;
const DIST_DIR = path.join(__dirname, 'dist');

// Check if dist directory exists
const distExists = fs.existsSync(DIST_DIR);

// Create Express app
const app = express();

// Serve static files from dist directory if it exists
if (distExists) {
  console.log(`Serving static files from: ${DIST_DIR}`);
  app.use(express.static(DIST_DIR));
} else {
  console.log('Dist directory not found. Serving built-in landing page instead.');
  // Fall back to serving index.html from root directory
  app.get('/', (req, res) => {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        console.error('Error reading index.html:', err);
        return res.send('Welcome to Ella AI. The landing page is being updated.');
      }
      res.set('Content-Type', 'text/html');
      res.send(data);
    });
  });
}

// Define API endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'YoBot/Ella AI production server is operational',
    timestamp: new Date().toISOString()
  });
});

// Handle all other routes for SPA
app.get('*', (req, res) => {
  if (distExists) {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  } else {
    // If no dist directory, redirect to root
    res.redirect('/');
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on http://localhost:${PORT}`);
  console.log(`Server started at: ${new Date().toLocaleString()}`);
});
