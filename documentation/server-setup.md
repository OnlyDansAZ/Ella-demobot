# YoBot/Ella AI Platform - Server Setup Guide

## Port Configuration Issue

The YoBot/Ella AI Platform faces a port configuration mismatch when running in Replit:

- **Replit Workflow**: Expects the application to be accessible on port 5000
- **Vite Development Server**: Runs on port 5173 by default

This mismatch causes workflow failures and prevents proper development within Replit.

## Solution: Integration Server

We've created an integration server solution that addresses this mismatch through several approaches:

### Option 1: Express Server (Recommended for Replit)

The simplest approach is to use our standalone Express server:

```bash
# Start the basic Express server on port 5000
node server-express.js
```

This server:
- Opens immediately on port 5000 (satisfying Replit's requirement)
- Provides a health check endpoint at `/api/health`
- Returns a simple message confirming the server is running

### Option 2: Port Bridge with Vite (Recommended for Development)

For active development with hot reloading:

```bash
# Start the development environment with port bridging
node dev-server.js
```

This script:
1. Starts Vite on port 5173 (with all its development features)
2. Creates a port bridge from 5000 → 5173
3. Provides health checks and proper process management

### Option 3: Replit-Specific Starter (Most Reliable)

For compatibility with Replit's workflow system:

```bash
# Start using the Replit compatibility script
node start-dev.js
```

This script:
1. Opens port 5000 immediately (satisfying Replit's requirement)
2. Then starts Vite on port 5173
3. Sets up a proxy to forward requests between ports

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