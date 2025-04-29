#!/usr/bin/env node

/**
 * Replit Deployment Server for YoBot/Ella AI
 * 
 * This script runs a production-ready server on port 3000
 * while Vite continues to run on port 5000 for development.
 */

import { spawn } from 'child_process';
import http from 'http';

console.log('Starting Ella AI deployment server on port 3000...');

// Start our custom server on port 3000
const serverProcess = spawn('node', ['replit-deploy-server.js'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: '3000' }
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

// Handle server process exit
serverProcess.on('close', (code) => {
  console.log('Server process exited with code ' + code);
  process.exit(code);
});

// Print instructions
console.log('\nImportant: Your landing page is now available at:');
console.log('https://[your-replit-url]:3000');
console.log('\nThe Vite development server continues to run on port 5000.')
