#!/usr/bin/env node

/**
 * Production Server for YoBot/Ella AI
 */

import { spawn } from 'child_process';

console.log('Starting Ella AI production server...');

// Start the server
const server = spawn('node', ['replit-deploy-server.js'], {
  stdio: 'inherit'
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});
