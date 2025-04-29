#!/usr/bin/env node

/**
 * Replit Proxy Server for YoBot/Ella AI
 * 
 * This server solves the host restrictions on Replit by:
 * 1. Running on port 5000 (Replit's expected port)
 * 2. Proxying requests to the Vite dev server or serving static files
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 5000;
const VITE_PORT = 5173;
const app = express();

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'YoBot/Ella AI Proxy Server'
  });
});

// Start Vite dev server in the background
function startVite() {
  console.log('Starting Vite development server...');
  
  // Start the Vite server on its default port
  const vite = spawn('npx', ['vite', '--port', VITE_PORT, '--host'], {
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, PORT: VITE_PORT }
  });

  vite.stdout.on('data', (data) => {
    console.log(`[Vite] ${data}`);
  });

  vite.stderr.on('data', (data) => {
    console.error(`[Vite Error] ${data}`);
  });

  vite.on('close', (code) => {
    console.log(`Vite process exited with code ${code}`);
  });

  return vite;
}

// Proxy all requests to the Vite server
app.use('/', createProxyMiddleware({
  target: `http://localhost:${VITE_PORT}`,
  changeOrigin: true,
  ws: true,
  logLevel: 'warn'
}));

// Start the proxy server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
==========================================
   YoBot/Ella AI Platform - Proxy Server
==========================================
Proxy server running at: http://localhost:${PORT}
Forwarding to Vite on: http://localhost:${VITE_PORT}
Health check: http://localhost:${PORT}/api/health
  `);
});

// Start Vite server
const viteProcess = startVite();

// Handle clean shutdown
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  if (viteProcess) {
    viteProcess.kill();
  }
  process.exit(0);
});
