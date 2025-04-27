#!/usr/bin/env node

// Simple script to start the authentication test server
// This is the quickest way to see our auth system working
const { spawn } = require('child_process');
const path = require('path');

// Path to the authentication server
const AUTH_SERVER_SCRIPT = path.join(__dirname, 'basic-server.js');

// Start the auth server
console.log('Starting authentication test server...');
const serverProcess = spawn('node', [AUTH_SERVER_SCRIPT], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// Handle any errors
serverProcess.on('error', (err) => {
  console.error('Failed to start authentication server:', err);
  process.exit(1);
});

console.log('Press Ctrl+C to stop the server');

// Handle clean shutdown
process.on('SIGINT', () => {
  console.log('Shutting down authentication server...');
  process.exit(0);
});