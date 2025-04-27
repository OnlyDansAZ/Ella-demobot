#!/usr/bin/env node

/**
 * Special startup script for the Replit workflow
 * This ensures the server is available on port 5000 as required by the workflow
 */

// Import required modules for the integration server
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { spawn } from 'child_process';

// Create Express server
const app = express();
const PORT = 5000; // Required port for Replit
const VITE_PORT = 5173; // Vite's default port

// Core middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Start Vite development server
console.log('📱 Starting Vite development server...');
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Handle Vite process error
viteProcess.on('error', (err) => {
  console.error('⚠️ Failed to start Vite server:', err);
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

// Log API requests
app.use('/api', (req, res, next) => {
  console.log(`API Request: ${req.method} ${req.path}`);
  next();
});

// Proxy all requests to Vite server
const viteProxy = createProxyMiddleware({
  target: `http://localhost:${VITE_PORT}`,
  changeOrigin: true,
  ws: true,
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
║ Replit Workflow Integration Server                ║
║ - Listening on port ${PORT}                        ║
║ - Forwarding to Vite on port ${VITE_PORT}          ║
║                                                    ║
║ Access the application at:                        ║
║ http://localhost:${PORT}                           ║
╚════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  
  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill();
    console.log('Vite server terminated');
  }
  
  process.exit(0);
});