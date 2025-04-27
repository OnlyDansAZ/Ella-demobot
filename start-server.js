#!/usr/bin/env node

/**
 * Main server entry point for the YoBot application
 * This script ensures the server is available on port 5000 while
 * still using Vite for development
 */

// Rather than modifying package.json, we'll create an integrated server that:
// 1. Starts a server on port 5000 (required by the Replit workflow)
// 2. Proxies to the Vite development server when needed

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express server
const app = express();
const PORT = process.env.PORT || 5000;
const VITE_PORT = 5173;

console.log('📡 Starting YoBot integrated server...');

// Start the Vite development server as a child process
console.log('🛠️ Starting Vite development server...');
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  detached: false
});

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'YoBot server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Add middleware to log API requests
app.use('/api', (req, res, next) => {
  console.log(`API Request: ${req.method} ${req.path}`);
  next();
});

// Create proxy middleware to forward requests to Vite
console.log(`⚡ Setting up proxy from port ${PORT} to Vite on port ${VITE_PORT}`);
const viteProxy = createProxyMiddleware({
  target: `http://localhost:${VITE_PORT}`,
  changeOrigin: true,
  ws: true,
  logLevel: 'silent'
});

// Use proxy for all other requests
app.use('/', viteProxy);

// Start the server on port 5000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 YoBot server running at http://0.0.0.0:${PORT}`);
  console.log(`🔄 Forwarding frontend requests to Vite on port ${VITE_PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  
  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill();
  }
  
  process.exit(0);
});