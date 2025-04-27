#!/usr/bin/env node

/**
 * Unified Server Startup
 * This script starts both the API server on port 5000 and forwards to Vite on port 5173
 * It's designed to be the single entry point for the application
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn } = require('child_process');
const app = express();
const PORT = process.env.PORT || 5000;
const VITE_PORT = 5173;

// Start Vite in the background
console.log('Starting Vite development server...');
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Set up proxy server
app.use('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'YoBot server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Log all API requests
app.use('/api', (req, res, next) => {
  console.log(`API Request: ${req.method} ${req.path}`);
  next();
});

// Forward everything else to Vite
app.use('/', createProxyMiddleware({
  target: `http://localhost:${VITE_PORT}`,
  changeOrigin: true,
  ws: true,
  logLevel: 'warn'
}));

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`YoBot server listening on http://0.0.0.0:${PORT}`);
  console.log(`Forwarding frontend requests to Vite on port ${VITE_PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  
  if (viteProcess) {
    viteProcess.kill();
  }
  
  process.exit(0);
});