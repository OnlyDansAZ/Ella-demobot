#!/usr/bin/env node

/**
 * Run Workflow Script for YoBot/Ella AI
 * 
 * This is a specialized script that:
 * 1. Immediately opens port 5000 to satisfy Replit's workflow requirements
 * 2. Then runs the regular npm run dev command to start Vite
 * 
 * This approach provides a unified solution that works with the current workflow
 * configuration without requiring changes to .replit or package.json
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
    status: 'ready',
    timestamp: new Date().toISOString(),
    service: 'YoBot Run Workflow Server'
  });
});

// Start listening on port 5000 immediately
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║             YOBOT/ELLA AI PLATFORM                ║
╠═══════════════════════════════════════════════════╣
║ Port 5000 is now open (satisfying Replit)         ║
║ Setting up proxy to Vite (port 5173)...           ║
╚═══════════════════════════════════════════════════╝
  `);
  
  // After server is listening, set up the proxy to port 5173
  // where Vite will be running
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    ws: true,
    logLevel: 'silent',
    onProxyReq: (proxyReq, req, res) => {
      // Optional logging
    }
  }));
  
  console.log(`
╔═══════════════════════════════════════════════════╗
║             PROXY BRIDGE ACTIVE                   ║
╠═══════════════════════════════════════════════════╣
║ Forwarding requests: Port 5000 → 5173            ║
║ Your app will be accessible at:                   ║
║ http://localhost:5000                             ║
╚═══════════════════════════════════════════════════╝
  `);
  
  // Then start Vite directly (not via npm run dev which would cause recursion)
  // We don't pass --port because Vite will use its default (5173)
  // which we're already proxying to
  const viteProcess = spawn('npx', ['vite'], { 
    stdio: 'inherit', 
    env: process.env
  });
  
  // Handle Vite process termination
  viteProcess.on('close', (code) => {
    console.log(`Vite process exited with code ${code}`);
    server.close(() => {
      process.exit(code);
    });
  });
});

// Handle process termination
process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});