#!/bin/bash

# YoBot Ella AI Deployment Script
# This script deploys the application for production use

echo "================================"
echo "Ella AI Deployment Script"
echo "================================"

# Step 1: Stop any existing servers
echo "\n[1/4] Stopping any existing servers..."
pkill -f "node replit-deploy-server.js" || true

# Step 2: Update the deployment files
echo "\n[2/4] Preparing deployment files..."

# Create deployment directory if it doesn't exist
mkdir -p deploy

# Copy necessary files
cp replit-deploy-server.js deploy/
cp index.html deploy/ 2>/dev/null || echo "No index.html found, will use built-in template"

# Step 3: Create a startup script
echo "\n[3/4] Creating startup script..."

cat > deploy/start.js << 'EOL'
#!/usr/bin/env node

/**
 * Production Server for YoBot/Ella AI
 */

import { spawn } from 'child_process';

console.log('Starting Ella AI production server...');

// Start the server
const server = spawn('node', ['replit-deploy-server.js'], {
  stdio: 'inherit'
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});
EOL

chmod +x deploy/start.js

# Step 4: Create a README.md with deployment instructions
echo "\n[4/4] Creating deployment documentation..."

cat > deploy/README.md << 'EOL'
# Ella AI Deployment Package

This package contains the Ella AI landing page and server for production deployment.

## Getting Started

1. To start the server, run:

```bash
node start.js
```

2. The server will run on port 5000 by default. You can change this by setting the PORT environment variable:

```bash
PORT=8080 node start.js
```

## Files Included

- `start.js`: Main server starter script
- `replit-deploy-server.js`: HTTP server implementation
- `index.html`: Landing page template (if customized)

## Server API Endpoints

- `/`: Main landing page
- `/api/health`: Health check endpoint that returns server status

## Need Help?

Contact support@yobot.ai for assistance with your deployment.
EOL

echo "\n================================"
echo "Deployment package created in: ./deploy"
echo "\nTo start the production server:"
echo "cd deploy && node start.js"
echo "================================"
