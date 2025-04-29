#!/usr/bin/env node

/**
 * Replit Deployment Server
 * 
 * This script starts the application directly on port 5000 as required by Replit
 * by configuring Vite to run on the correct port.
 */

import { spawn } from 'child_process';
import { createServer } from 'vite';
import os from 'os';

// Get hostname for Replit domain detection
const hostname = os.hostname();
const isReplit = hostname.includes('repl');

// Define constants
const PORT = 5000;

async function startViteOnPort5000() {
  const server = await createServer({
    // Configure Vite
    server: {
      port: PORT,
      host: '0.0.0.0', // Listen on all network interfaces
      strictPort: true, // Fail if port is already in use
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['./']
      },
      hmr: {
        // Allow HMR connections from all hosts
        clientPort: 443,
        host: '0.0.0.0'
      },
      // Allow connections from all domains
      cors: true,
      // No host restrictions
      origin: '*'
    }
  });

  await server.listen();
  
  console.log('Vite running directly on port 5000');
  console.log(`  ➜ Local:   http://localhost:${PORT}/`);
}

// Start the Vite server on port 5000
startViteOnPort5000().catch(err => {
  console.error('Error starting Vite:', err);
  process.exit(1);
});
