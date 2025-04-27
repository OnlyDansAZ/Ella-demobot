#!/usr/bin/env node

/**
 * Workflow runner for YoBot application
 * This script is responsible for starting the application within a Replit workflow
 * 
 * It selects the appropriate startup script based on environment context
 */

import { spawn } from 'child_process';
import fs from 'fs';

// Check if running in Replit workflow
const isReplitWorkflow = process.env.REPL_ID && process.env.REPL_OWNER;

// Define command to run based on environment
let command, args;

if (isReplitWorkflow) {
  console.log('🌐 Running in Replit workflow environment');
  
  // Use workflow integration server that handles port mapping
  if (fs.existsSync('.workflow-start.js')) {
    command = 'node';
    args = ['.workflow-start.js'];
  } else {
    console.log('⚠️ Workflow start script not found, using fallback');
    command = 'npm';
    args = ['run', 'dev'];
  }
} else {
  console.log('💻 Running in local development environment');
  command = 'npm';
  args = ['run', 'dev'];
}

// Log the selected startup command
console.log(`🚀 Starting YoBot application with: ${command} ${args.join(' ')}`);

// Start the application
const appProcess = spawn(command, args, {
  stdio: 'inherit',
  shell: true
});

// Handle process events
appProcess.on('error', (err) => {
  console.error('⚠️ Failed to start application:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down application...');
  if (appProcess && !appProcess.killed) {
    appProcess.kill();
  }
  process.exit(0);
});