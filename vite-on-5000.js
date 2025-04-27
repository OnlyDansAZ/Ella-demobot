#!/usr/bin/env node

/**
 * Simple Script to Run Vite Directly on Port 5000
 * This script starts Vite on port 5000 instead of the default 5173
 */

import { spawn } from 'child_process';

// Start Vite directly on port 5000
console.log('Starting Vite on port 5000...');

const viteProcess = spawn('npx', ['vite', '--port', '5000', '--host', '0.0.0.0'], {
  stdio: 'inherit',
  env: process.env
});

// Handle process termination
process.on('SIGINT', () => {
  viteProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  viteProcess.kill('SIGTERM');
  process.exit(0);
});

viteProcess.on('close', (code) => {
  process.exit(code);
});