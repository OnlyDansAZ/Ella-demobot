#!/usr/bin/env node

/**
 * Startup script for YoBot/Ella AI on Replit
 * - Runs proxy server that works around Replit's domain restrictions
 * - Handles both production and development modes
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 5000;
const VITE_PORT = 5173;
const isProduction = process.env.NODE_ENV === 'production';
const distDir = path.join(__dirname, 'dist');
const hasBuiltFiles = fs.existsSync(distDir) && fs.existsSync(path.join(distDir, 'index.html'));

// Create Express application
const app = express();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: isProduction || hasBuiltFiles ? 'production' : 'development',
    service: 'YoBot/Ella AI Platform'
  });
});

// Start Vite in development mode if needed
let viteProcess = null;

if (!isProduction && !hasBuiltFiles) {
  // Development mode with Vite
  console.log('Starting in DEVELOPMENT mode with Vite proxy');
  
  // Start the Vite server on its default port
  viteProcess = spawn('npx', ['vite', '--port', VITE_PORT, '--host'], {
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, PORT: VITE_PORT }
  });

  viteProcess.stdout.on('data', (data) => {
    console.log(`[Vite] ${data}`);
  });

  viteProcess.stderr.on('data', (data) => {
    console.error(`[Vite Error] ${data}`);
  });

  viteProcess.on('close', (code) => {
    console.log(`Vite process exited with code ${code}`);
  });

  // Proxy to Vite
  app.use('/', createProxyMiddleware({
    target: `http://localhost:${VITE_PORT}`,
    changeOrigin: true,
    ws: true,
    logLevel: 'warn'
  }));
} else {
  // Production mode serving static files
  console.log(`Running in PRODUCTION mode - serving from ${distDir}`);
  app.use(express.static(distDir));
  
  // For any request that doesn't match a static file
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  const mode = isProduction || hasBuiltFiles ? 'PRODUCTION' : 'DEVELOPMENT';
  console.log(`
==========================================
   YoBot/Ella AI Platform - Ready
==========================================
Server mode: ${mode}
Server available at: http://localhost:${PORT}
Health check: http://localhost:${PORT}/api/health
`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  if (viteProcess) {
    viteProcess.kill();
  }
  process.exit(0);
});
