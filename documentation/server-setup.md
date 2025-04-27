# YoBot/Ella AI Platform - Server Setup Guide

## Port Configuration Issue

The YoBot/Ella AI Platform faces a port configuration mismatch when running in Replit:

- **Replit Workflow**: Expects the application to be accessible on port 5000
- **Vite Development Server**: Runs on port 5173 by default

This mismatch causes workflow failures and prevents proper development within Replit.

## Solution: Unified Starter Script

We've created a unified solution that automatically selects the best server option:

```bash
# Start using the unified Replit starter
./start-replit.sh
# or
node start-replit.js
```

This script automatically selects and runs the optimal server solution based on availability:
1. Workflow Runner (run-workflow.js) - Best for Replit integration
2. Express Server (server-express.js) - Simplest standalone option
3. Port Bridge (dev-server.js) - Best for development work
4. Minimal Workflow (workflow-setup.js) - Fastest startup option

## Detailed Server Options

### Option 1: Workflow Runner (Best for Replit)

The most integrated solution for Replit workflows:

```bash
# Run the workflow-optimized server
node run-workflow.js
```

This script:
- Immediately opens port 5000 (satisfying Replit's workflow requirement)
- Sets up a proxy to forward requests from 5000 → 5173
- Automatically starts Vite on port 5173
- Provides a health check endpoint at `/api/health`

### Option 2: Express Server (Simplest)

The most straightforward standalone approach:

```bash
# Start the basic Express server on port 5000
node server-express.js
```

This server:
- Opens immediately on port 5000 (satisfying Replit's requirement)
- Provides a health check endpoint at `/api/health`
- Returns a simple message confirming the server is running

### Option 3: Port Bridge (Best for Development)

For active development with hot reloading:

```bash
# Start the development environment with port bridging
node dev-server.js
```

This script:
1. Starts Vite on port 5173 (with all its development features)
2. Creates a port bridge from 5000 → 5173
3. Provides health checks and proper process management

### Option 4: Minimal Workflow Setup

For the fastest possible initialization:

```bash
# Run the minimal workflow setup
node workflow-setup.js
```

This script:
1. Opens port 5000 immediately (satisfying Replit's requirement)
2. Provides a minimal health check endpoint
3. Doesn't start the full application stack

## Server-Side API Access

All server solutions maintain API access at the following endpoints:

- **Health Check**: `/api/health`
- **All API Routes**: These remain accessible at their usual paths

## Deployment Notes

For production deployment:

1. Build the application using `npm run build`
2. Serve the static files directly from port 5000

## Troubleshooting

If experiencing port conflicts or process termination:

1. Check for existing processes using `lsof -i :5000` or `lsof -i :5173`
2. Terminate any conflicting processes before restarting
3. If needed, restart the Replit environment completely