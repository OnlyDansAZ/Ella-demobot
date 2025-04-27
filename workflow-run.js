#!/usr/bin/env node

/**
 * Workflow runner script for YoBot application
 * This is the script called directly by the workflow system
 */

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = dirname(fileURLToPath(import.meta.url));

// Path to our integrated server
const SERVER_PATH = join(__dirname, 'start-server.js');

console.log('🤖 YoBot Application - Workflow Runner');
console.log('Starting integrated server...');

// Start the integrated server as a child process
const serverProcess = spawn('node', [SERVER_PATH], {
  stdio: 'inherit',
  shell: true
});

serverProcess.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

// Keep the process running
process.stdin.resume();

// Handle clean shutdown
process.on('SIGINT', () => {
  console.log('Shutting down application...');
  
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
  
  process.exit(0);
});