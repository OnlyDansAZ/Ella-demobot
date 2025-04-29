#!/usr/bin/env node

/**
 * Server Startup Script for YoBot/Ella AI
 * 
 * This script starts the Express server on port 5000
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start the Express server
console.log('Starting Express server...');
const serverProcess = spawn('node', ['express-server.js'], {
  stdio: 'inherit',
  cwd: __dirname
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
