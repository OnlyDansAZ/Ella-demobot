#!/usr/bin/env node

/**
 * Workflow starter script for YoBot/Ella AI
 * 
 * This script ensures the server starts properly on Replit
 */

import { spawn } from 'child_process';

// Start the server using the minimal-server.cjs file
const serverProcess = spawn('node', ['minimal-server.cjs'], {
  stdio: 'inherit'
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
