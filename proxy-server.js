#!/usr/bin/env node

/**
 * Simple Proxy Server for YoBot/Ella AI
 * 
 * This minimal server:
 * 1. Opens on port 5000 immediately (to satisfy Replit)
 * 2. Starts the Vite dev server on port 5173
 * 3. Proxies between them
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';

// Configuration
const PORT = 5000;
const VITE_PORT = 5173;

// Create Express app
const app = express();

// Add a health check endpoint that's immediately available
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'YoBot Proxy Server'
  });
});

// First start the server (to immediately open port 5000)
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`YoBot proxy server running on port ${PORT}`);
  startVite();
});

// Launch Vite dev server
function startVite() {
  console.log('Starting Vite development server...');
  const vite = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  // Wait for Vite to start before setting up proxy
  setTimeout(() => {
    setupProxy();
  }, 3000);
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down servers...');
    if (vite && !vite.killed) {
      vite.kill();
    }
    server.close();
    process.exit(0);
  });
}

// Set up proxy middleware to Vite
function setupProxy() {
  const proxy = createProxyMiddleware({
    target: `http://localhost:${VITE_PORT}`,
    changeOrigin: true,
    ws: true
  });
  
  // Add the proxy middleware
  app.use('/', proxy);
  
  console.log(`Proxy configured: ${PORT} → ${VITE_PORT}`);
  console.log('Application ready at http://localhost:5000');
}