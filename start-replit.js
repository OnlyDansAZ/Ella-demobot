#!/usr/bin/env node

/**
 * Replit Integration Server for YoBot Application
 * 
 * This script solves the port mismatch issue by:
 * 1. Starting an Express server on port 5000 (required by Replit workflow)
 * 2. Starting the Vite development server on its default port 5173
 * 3. Proxying all requests from port 5000 to the Vite server
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express server
const app = express();
const PORT = 5000; // Fixed port required by Replit
const VITE_PORT = 5173; // Vite's default port

// Add middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Start Vite development server
console.log('📱 Starting Vite development server...');
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Handle Vite process events
viteProcess.on('error', (err) => {
  console.error('Failed to start Vite server:', err);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'YoBot integration server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    vitePort: VITE_PORT
  });
});

// Log API requests for debugging
app.use('/api', (req, res, next) => {
  console.log(`API Request: ${req.method} ${req.path}`);
  next();
});

// Proxy all requests to Vite server
const viteProxy = createProxyMiddleware({
  target: `http://localhost:${VITE_PORT}`,
  changeOrigin: true,
  ws: true, // Support WebSockets
  logLevel: 'warn'
});

// Use the proxy for all non-api requests
app.use('/', viteProxy);

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║                 YOBOT APPLICATION                  ║
╠════════════════════════════════════════════════════╣
║ Integration server running on port ${PORT}             ║
║ Forwarding requests to Vite on port ${VITE_PORT}          ║
║                                                    ║
║ The application is now available at:              ║
║ http://localhost:${PORT}                             ║
╚════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  
  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill();
    console.log('Vite server terminated');
  }
  
  process.exit(0);
});