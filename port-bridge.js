#!/usr/bin/env node

/**
 * Port Bridge for YoBot/Ella AI Application
 * 
 * This script creates a bridge between the required port (5000) and the Vite dev port (5173)
 * It allows the application to be accessed through port 5000 while running on its native port
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createServer } from 'http';

// Configuration
const TARGET_PORT = 5173; // Vite's default port
const BRIDGE_PORT = 5000; // Required port for Replit

// Create Express app
const app = express();

// Add basic health check endpoint
app.get('/bridge-health', (req, res) => {
  res.json({
    status: 'Bridge active',
    targeting: `http://localhost:${TARGET_PORT}`,
    listeningOn: BRIDGE_PORT,
    timestamp: new Date().toISOString()
  });
});

// Create proxy middleware
const proxy = createProxyMiddleware({
  target: `http://localhost:${TARGET_PORT}`,
  changeOrigin: true,
  ws: true, // Support WebSockets
  pathRewrite: {
    '^/bridge-health': '/' // Keep our health endpoint accessible
  },
  onProxyReq: (proxyReq, req, res) => {
    // Log the proxy request
    console.log(`[Port Bridge] ${req.method} ${req.url} → ${TARGET_PORT}`);
  },
  onError: (err, req, res) => {
    console.error('[Port Bridge] Proxy error:', err);
    res.writeHead(502, {
      'Content-Type': 'text/plain'
    });
    res.end('Proxy error: Target server not responding. Please check if Vite is running.');
  }
});

// Use the proxy for all routes except our health endpoint
app.use('/', proxy);

// Create HTTP server
const server = createServer(app);

// Start the server
server.listen(BRIDGE_PORT, '0.0.0.0', () => {
  console.log(`
╔═════════════════════════════════════════════════╗
║              PORT BRIDGE ACTIVE                 ║
╠═════════════════════════════════════════════════╣
║ Forwarding port ${BRIDGE_PORT} → ${TARGET_PORT}                 ║
║                                                 ║
║ Your application is now accessible at:          ║
║ http://localhost:${BRIDGE_PORT}                       ║
║                                                 ║
║ Health check: http://localhost:${BRIDGE_PORT}/bridge-health ║
╚═════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down port bridge...');
  server.close(() => {
    console.log('Port bridge terminated');
    process.exit(0);
  });
});