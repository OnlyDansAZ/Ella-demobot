#!/usr/bin/env node

/**
 * Special startup script for Replit's "Start application" workflow
 * This script starts the Express server on port 5000 (required by Replit)
 * which then proxies requests to the Vite development server
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express server
const app = express();
const PORT = process.env.PORT || 5000;
const VITE_PORT = 5173;

// Core middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'YoBot application is running',
    timestamp: new Date().toISOString(),
    replit: process.env.REPL_ID ? true : false,
    port: PORT
  });
});

// Start Vite server with npm run dev
console.log('📱 Starting Vite development server...');
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Log all API requests
app.use('/api', (req, res, next) => {
  console.log(`API Request: ${req.method} ${req.url}`);
  next();
});

// Create proxy for Vite
console.log(`🔄 Setting up proxy from port ${PORT} to Vite on port ${VITE_PORT}`);
const viteProxy = createProxyMiddleware({
  target: `http://localhost:${VITE_PORT}`,
  changeOrigin: true,
  ws: true,
  logLevel: 'error'
});

// Forward all other requests to Vite
app.use('/', viteProxy);

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 YoBot application running at http://0.0.0.0:${PORT}`);
  console.log('✅ Server ready: Press Ctrl+C to stop');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down YoBot application...');
  
  // Close the Express server
  server.close(() => {
    console.log('Express server closed');
  });
  
  // Kill the Vite process
  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill();
    console.log('Vite server terminated');
  }
  
  process.exit(0);
});