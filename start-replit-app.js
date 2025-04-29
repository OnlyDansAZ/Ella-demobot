#!/usr/bin/env node

/**
 * Replit App Starter for YoBot/Ella AI
 * 
 * This script decides which server to start:
 * 1. If Vite is not working correctly with the Replit host, it uses our custom server
 * 2. Otherwise, it allows the Vite server to run
 */

import { spawn } from 'child_process';
import http from 'http';
import { setTimeout } from 'timers/promises';

// Configuration
const PORT = process.env.PORT || 5000;
const VITE_TEST_TIMEOUT = 5000; // 5 seconds to wait for Vite to start

// Start Vite server (this is what the Replit workflow tries to start by default)
console.log('Starting Vite development server...');
const viteProcess = spawn('npx', ['vite'], {
  stdio: 'inherit',
  detached: true
});

// Function to check if the Vite server is accessible
async function checkViteServer() {
  try {
    await setTimeout(2000); // Give Vite a chance to start
    
    console.log('Testing Vite server access...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('http://localhost:5000/', {
      signal: controller.signal
    });
    
    if (response.ok) {
      console.log('Vite server is working properly!');
      return true;
    }
    
    console.log('Vite server response not OK:', response.status);
    return false;
  } catch (error) {
    console.log('Error accessing Vite server:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  try {
    // Try to use Vite first
    const viteWorking = await checkViteServer();
    
    if (!viteWorking) {
      console.log('Vite server is not accessible. Killing Vite process...');
      
      // Kill the Vite process
      if (viteProcess.pid) {
        process.kill(-viteProcess.pid, 'SIGTERM');
      }
      
      // Wait a moment for the port to be released
      await setTimeout(1000);
      
      // Start our custom server instead
      console.log('Starting custom deployment server...');
      const customServer = spawn('node', ['replit-deploy-server.js'], {
        stdio: 'inherit'
      });
      
      // Handle server process exit
      customServer.on('close', (code) => {
        console.log(`Custom server process exited with code ${code}`);
        process.exit(code);
      });
    } else {
      // If Vite is working, just let it run
      viteProcess.unref();
      console.log('Using Vite server for development.');
    }
  } catch (error) {
    console.error('Error in startup script:', error);
    process.exit(1);
  }
}

// Start the application
main();
