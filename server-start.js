// Development server startup script that ensures proper port and host settings
// This script acts as a compatibility wrapper for Vite

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set environment variables to control Vite configuration
process.env.VITE_PORT = '5000';
process.env.VITE_HOST = '0.0.0.0';

console.log('Starting Ella AI development server on port 5000...');

// Use npm run dev with additional parameters to control Vite
const devProcess = spawn('npx', ['vite', '--port', '5000', '--host'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    // Add any additional environment variables needed for development
  }
});

// Handle server process events
devProcess.on('error', (err) => {
  console.error('Failed to start development server:', err);
  process.exit(1);
});

// Handle clean shutdown
process.on('SIGINT', () => {
  console.log('Shutting down development server...');
  devProcess.kill('SIGINT');
});

// Forward exit code from child process
devProcess.on('exit', (code) => {
  console.log(`Development server exited with code ${code}`);
  process.exit(code);
});