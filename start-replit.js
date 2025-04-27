#!/usr/bin/env node

/**
 * Replit Starter for YoBot/Ella AI
 * 
 * Loads the proper script based on the environment.
 * This script selects the optimal server solution for Replit.
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';

// Available server options
const serverOptions = [
  { name: 'Workflow Runner', script: './run-workflow.js' },
  { name: 'Express Server', script: './server-express.js' },
  { name: 'Port Bridge', script: './dev-server.js' },
  { name: 'Minimal Workflow', script: './workflow-setup.js' }
];

// Select the best available script in order of preference
let selectedScript = null;
for (const option of serverOptions) {
  if (existsSync(option.script)) {
    selectedScript = option;
    break;
  }
}

if (selectedScript) {
  console.log(`
╔═══════════════════════════════════════════════════╗
║             YOBOT/ELLA AI PLATFORM                ║
╠═══════════════════════════════════════════════════╣
║ Starting server: ${selectedScript.name.padEnd(33, ' ')} ║
║ Script: ${selectedScript.script.padEnd(38, ' ')} ║
╚═══════════════════════════════════════════════════╝
  `);

  // Execute the selected script
  const serverProcess = spawn('node', [selectedScript.script], {
    stdio: 'inherit',
    env: process.env
  });

  // Handle process termination
  process.on('SIGINT', () => {
    serverProcess.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    serverProcess.kill('SIGTERM');
  });

  serverProcess.on('exit', (code) => {
    process.exit(code);
  });
} else {
  console.error('No server scripts found! Please run npm install first.');
  process.exit(1);
}