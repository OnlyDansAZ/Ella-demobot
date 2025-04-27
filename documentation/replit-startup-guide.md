# YoBot/Ella AI - Replit Startup Guide

## Quick Start Guide for Replit

The YoBot/Ella AI application requires a special startup procedure when running in Replit to handle a port configuration mismatch. This guide provides clear instructions for starting the application properly.

## Problem: Port Mismatch

Replit workflows expect applications to be accessible on port 5000, but the Vite development server runs on port 5173 by default. This mismatch prevents the workflow from properly detecting the application.

## Solution: Use Our Custom Starter

We've created multiple solutions to address this issue. To properly start the application in Replit, **stop the automatic workflow** and run one of the following commands in the Shell tab:

### Option 1: Use the Unified Starter (Recommended)

```bash
# Run the smart starter that auto-selects the best solution
./start-replit.sh
```

This will automatically select and run the optimal server solution for the current environment.

### Option 2: Run the Workflow Integration Script Directly

```bash
# Run the workflow integration script directly
node run-workflow.js
```

This script:
1. Opens port 5000 immediately
2. Sets up proxy forwarding (5000 → 5173)
3. Starts Vite on port 5173
4. Makes your app accessible at http://localhost:5000

### Option 3: Use the Simple Express Server 

```bash
# Run just the Express server
node server-express.js
```

Use this if you just need a simple server on port 5000.

## Verification

After starting one of these solutions, you can verify it's working by:

1. Checking for successful startup messages in the console
2. Accessing the health check endpoint at `http://localhost:5000/api/health`
3. Browsing to the application at `http://localhost:5000`

## Using in Production

For production deployment:

1. Build the application with `npm run build`
2. Serve the built files from port 5000

## Need More Details?

For a full technical explanation of all server options, see:
`documentation/server-setup.md`