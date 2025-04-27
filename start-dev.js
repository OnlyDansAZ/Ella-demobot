#!/usr/bin/env node

/**
 * Replit Compatible Development Starter for YoBot/Ella AI Application
 * 
 * This specialized script is designed to:
 * 1. Open port 5000 first (required by Replit)
 * 2. Only then start Vite on port 5173
 * 3. Bridge the two ports for seamless access
 * 
 * This approach ensures the workflow will start successfully
 */

import express from 'express';
import { spawn } from 'child_process';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Configuration
const REQUIRED_PORT = 5000; // Replit requires this port
const VITE_PORT = 5173;     // Vite's default port

// Process management
let viteProcess = null;

// Create Express app
const app = express();

// Initial health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'initializing',
    message: 'YoBot/Ella AI platform is starting up...',
    port: REQUIRED_PORT,
    timestamp: new Date().toISOString()
  });
});

// Create the server first (to immediately satisfy Replit's port check)
const server = app.listen(REQUIRED_PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║             YOBOT/ELLA AI PLATFORM                ║
╠═══════════════════════════════════════════════════╣
║ Initialization server started on port ${REQUIRED_PORT}      ║
║ Starting Vite development environment...          ║
╚═══════════════════════════════════════════════════╝
  `);
  
  // Start Vite development server
  startViteServer();
});

// Start the Vite server
function startViteServer() {
  console.log('📱 Starting Vite development server...');
  
  // Start Vite with output visible
  viteProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: VITE_PORT.toString()
    }
  });
  
  viteProcess.on('error', (err) => {
    console.error('⚠️ Failed to start Vite server:', err);
    process.exit(1);
  });
  
  // Set up the proxy after a delay to ensure Vite is running
  setTimeout(setupProxy, 5000);
}

// Configure proxy to Vite
function setupProxy() {
  // Remove the initial route
  app._router.stack.pop();
  
  // Update health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'running',
      message: 'YoBot/Ella AI platform is running',
      port: REQUIRED_PORT,
      vitePort: VITE_PORT,
      timestamp: new Date().toISOString()
    });
  });
  
  // Create proxy middleware to Vite
  const proxy = createProxyMiddleware({
    target: `http://localhost:${VITE_PORT}`,
    changeOrigin: true,
    ws: true,
    logLevel: 'warn'
  });
  
  // Apply the proxy middleware
  app.use('/', proxy);
  
  console.log(`
╔═══════════════════════════════════════════════════╗
║             YOBOT/ELLA AI PLATFORM                ║
╠═══════════════════════════════════════════════════╣
║ Application successfully started!                 ║
║                                                   ║
║ Access the application at:                        ║
║ http://localhost:${REQUIRED_PORT}                       ║
║                                                   ║
║ Health check: http://localhost:${REQUIRED_PORT}/api/health    ║
╚═══════════════════════════════════════════════════╝
  `);
}

// Handle termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down application...');
  
  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill();
    console.log('✓ Vite server terminated');
  }
  
  server.close(() => {
    console.log('✓ Express server closed');
    process.exit(0);
  });
});