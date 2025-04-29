#!/usr/bin/env node

/**
 * Basic HTTP server for YoBot/Ella AI
 * 
 * This ultra-simple server just serves our single HTML file
 * without any dependencies or complications.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`Request for ${req.url}`);
  
  // Serve the index.html file for the root path
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } 
  // Handle API endpoint
  else if (req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      timestamp: new Date().toISOString()
    }));
  }
  // Handle 404 for all other routes
  else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
