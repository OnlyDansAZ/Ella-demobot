#!/usr/bin/env node

/**
 * Workflow Runner for YoBot/Ella AI
 * 
 * This script is specifically designed to run in Replit workflows
 * It immediately opens port 5000 and then starts the Vite dev server
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';

// Create Express application to immediately open port 5000
const app = express();
const PORT = 5000;

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'YoBot Workflow Runner'
  });
});

// Start Vite development server
const viteProcess = spawn('npx', ['vite'], { 
  stdio: 'inherit', 
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' }
});

// Set up proxy (after brief delay to allow Vite to start)
setTimeout(() => {
  // Add proxy middleware
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    ws: true,
    logLevel: 'silent'
  }));

  console.log(`
╔═══════════════════════════════════════════════════╗
║             YOBOT/ELLA AI PLATFORM                ║
╠═══════════════════════════════════════════════════╣
║ Workflow Runner Active                            ║
║ - Port 5000 is now open (satisfying Replit)       ║
║ - Vite server running on port 5173               ║
║ - Requests forwarded: 5000 → 5173               ║
║                                                   ║
║ Health check: http://localhost:5000/api/health    ║
╚═══════════════════════════════════════════════════╝
  `);
}, 2000);

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║             YOBOT/ELLA AI PLATFORM                ║
╠═══════════════════════════════════════════════════╣
║ Initializing Workflow Runner...                   ║
║ - Opening port 5000 immediately                   ║
║ - Starting Vite development server...             ║
╚═══════════════════════════════════════════════════╝
  `);
});

// Handle process termination
process.on('SIGINT', () => {
  viteProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  viteProcess.kill();
  process.exit(0);
});