#!/usr/bin/env node

/**
 * Build and Deploy Script for YoBot Ella AI
 * 
 * This script handles the build process for deploying on Replit:
 * 1. Builds the React application
 * 2. Configures the server for production
 */

import { execSync } from 'child_process';
import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting build process for YoBot Ella AI...');

try {
  // Step 1: Build the React application
  console.log('\n📦 Building React application...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');

  // Step 2: Start the server for production
  console.log('\n🌐 Starting server for production...');
  console.log('Server will be available at http://localhost:5000');
  
  // Optionally create a simple Express server for production
  const expressServerCode = `
  import express from 'express';
  import path from 'path';
  import { fileURLToPath } from 'url';
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const app = express();
  const PORT = process.env.PORT || 5000;
  
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, 'dist/public')));
  
  // Handle API routes here
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'YoBot Ella AI server is running!' });
  });
  
  // For any request that doesn't match above, send React's index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/public/index.html'));
  });
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`YoBot Ella AI server running on port \${PORT}\`);
  });
  `;

  // Write production server file
  fs.writeFileSync('production-server.js', expressServerCode);
  console.log('✅ Production server configured!');
  
  console.log('\n✨ Deployment preparation complete!');
  console.log('To start the production server, run: node production-server.js');
  
} catch (error) {
  console.error('❌ Build process failed:', error.message);
  process.exit(1);
}
