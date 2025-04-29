#!/usr/bin/env node

/**
 * Workflow Setup for YoBot/Ella AI
 * 
 * This script configures the Replit workflow to use our Express server
 * instead of the Vite development server.
 */

import { readdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the .replit-start.js file that will be used by the workflow
const replitStartContent = `#!/usr/bin/env node

/**
 * Special startup script for Replit's "Start application" workflow
 * This script starts the Express server on port 5000 (required by Replit)
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start the Express server
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
`;

// Write the file
writeFileSync(path.join(__dirname, '.replit-start.js'), replitStartContent, 'utf8');
console.log('Created .replit-start.js');

console.log('Workflow setup complete. Please restart the "Start application" workflow.');
