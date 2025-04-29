#!/usr/bin/env node

/**
 * Replit Deployment Server for YoBot/Ella AI
 * 
 * This script handles both development and production modes:
 * - In development: Proxies requests to Vite dev server
 * - In production: Serves static files from the build directory
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
// Import http-proxy-middleware dynamically to avoid path-to-regexp issue
let createProxyMiddleware;
try {
  const httpProxyMiddleware = await import('http-proxy-middleware');
  createProxyMiddleware = httpProxyMiddleware.createProxyMiddleware;
} catch (error) {
  console.error('Failed to import http-proxy-middleware:', error);
}
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 5000;
const VITE_PORT = 5173;
const isProduction = process.env.NODE_ENV === 'production';
// Check both possible build output locations
const distPublicDir = path.join(__dirname, 'dist', 'public');
const distDir = path.join(__dirname, 'dist');

// Check if either directory contains an index.html file
const hasDistPublicFiles = fs.existsSync(distPublicDir) && fs.existsSync(path.join(distPublicDir, 'index.html'));
const hasDistFiles = fs.existsSync(distDir) && fs.existsSync(path.join(distDir, 'index.html'));

// Determine which directory to use
const buildDir = hasDistPublicFiles ? distPublicDir : distDir;
const hasBuiltFiles = hasDistPublicFiles || hasDistFiles;

// Create Express application
const app = express();

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: isProduction || hasBuiltFiles ? 'production' : 'development',
    service: 'YoBot/Ella AI Platform'
  });
});

// Handle API routes here if needed

// Serve static files or proxy to dev server
if (isProduction || hasBuiltFiles) {
  // Production mode - serve static files
  console.log(`Running in PRODUCTION mode - serving static files from ${buildDir}`);
  app.use(express.static(buildDir));
  
  // For any request that doesn't match above, send React's index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildDir, 'index.html'));
  });
} else {
  // Development mode - proxy to Vite dev server
  console.log('Running in DEVELOPMENT mode - proxying to Vite');
  
  if (createProxyMiddleware) {
    app.use('/', createProxyMiddleware({
      target: `http://localhost:${VITE_PORT}`,
      changeOrigin: true,
      ws: true,
      logLevel: 'warn'
    }));
  } else {
    console.log('Proxy middleware not available. Starting a simple server instead.');
    app.get('/', (req, res) => {
      res.send('YoBot/Ella AI Platform - Development Server<br><br>Please run: <code>npm run dev</code> to start the development server.');
    });
  }
}

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
==========================================
   YoBot/Ella AI Platform - Server Running
==========================================
Server mode: ${isProduction || hasBuiltFiles ? 'PRODUCTION' : 'DEVELOPMENT'}
Server available at: http://localhost:${PORT}
Health check: http://localhost:${PORT}/api/health
  `);
});
