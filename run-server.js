#!/usr/bin/env node

/**
 * Simplified server runner for the Replit workflow
 * This script starts a server on port 5000 that forwards to the Vite server
 */

// Import required modules
import express from 'express';
import cookieParser from 'cookie-parser';
import { spawn } from 'child_process';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Configuration
const PORT = 5000; // The port required by the Replit workflow
const VITE_PORT = 5173; // Vite's default port

// Create Express server
const app = express();

// Add middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Start Vite development server
console.log('Starting Vite development server...');
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'YoBot server is running',
    timestamp: new Date().toISOString()
  });
});

// Add API middleware
app.use('/api', (req, res, next) => {
  console.log(`API Request: ${req.method} ${req.path}`);
  next();
});

// Forward all requests to Vite
app.use('/', createProxyMiddleware({
  target: `http://localhost:${VITE_PORT}`,
  changeOrigin: true,
  ws: true,
  logLevel: 'silent'
}));

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`YoBot proxy server running on http://0.0.0.0:${PORT}`);
  console.log(`Forwarding to Vite on port ${VITE_PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close();
  
  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill();
  }
  
  process.exit(0);
});