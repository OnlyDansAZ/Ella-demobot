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
