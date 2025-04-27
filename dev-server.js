#!/usr/bin/env node

/**
 * Development Server for YoBot/Ella AI Application
 * 
 * This script manages the startup process for:
 * 1. Vite development server on port 5173
 * 2. Port bridge providing access on port 5000
 * 
 * It handles graceful startup and shutdown processes to ensure
 * proper coordination between all the required services
 */

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Process management
let viteProcess = null;
let bridgeProcess = null;

// Start Vite development server
function startVite() {
  console.log('📱 Starting Vite development server...');
  
  viteProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: '5173'
    }
  });
  
  viteProcess.on('error', (err) => {
    console.error('⚠️ Failed to start Vite server:', err);
    cleanupAndExit(1);
  });
  
  // Give Vite time to start up
  setTimeout(() => {
    startPortBridge();
  }, 3000);
}

// Start the port bridge
function startPortBridge() {
  console.log('🔄 Starting port bridge (5000 → 5173)...');
  
  bridgeProcess = spawn('node', [join(__dirname, 'port-bridge.js')], {
    stdio: 'inherit',
    shell: true
  });
  
  bridgeProcess.on('error', (err) => {
    console.error('⚠️ Failed to start port bridge:', err);
    cleanupAndExit(1);
  });
}

// Clean up processes and exit
function cleanupAndExit(code = 0) {
  console.log('\n🛑 Shutting down development environment...');
  
  // Terminate bridge process
  if (bridgeProcess && !bridgeProcess.killed) {
    bridgeProcess.kill();
    console.log('Port bridge terminated');
  }
  
  // Terminate Vite process
  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill();
    console.log('Vite server terminated');
  }
  
  // Exit with provided code
  process.exit(code);
}

// Handle interruption signals
process.on('SIGINT', () => cleanupAndExit());
process.on('SIGTERM', () => cleanupAndExit());

// Display startup banner
console.log(`
╔═══════════════════════════════════════════════════╗
║             YOBOT/ELLA AI PLATFORM                ║
╠═══════════════════════════════════════════════════╣
║ Starting Development Environment                  ║
║                                                   ║
║ The application will be available at:             ║
║ http://localhost:5000                             ║
║                                                   ║
║ Bridge health check: http://localhost:5000/bridge-health ║
╚═══════════════════════════════════════════════════╝
`);

// Start the development environment
startVite();