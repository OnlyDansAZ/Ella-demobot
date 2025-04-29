# Ella AI Deployment Guide

This guide explains how to deploy the Ella AI application in various environments.

## Option 1: Running on Replit (Development)

When developing on Replit, you have two options:

### A. Using the Default Vite Development Server
The Vite server runs on port 5000 by default, but may have host restrictions that prevent it from working correctly on Replit:

```bash
# Use the Replit workflow to start Vite
# Or manually restart the workflow with "Start application"
```

### B. Running the Simplified Landing Page Server
For a more reliable experience on Replit, use our custom server:

```bash
node start-replit.js
```

This will:
1. Start a basic HTTP server on port 3000
2. Serve the Ella AI landing page
3. Allow the API health endpoint to work

You can access this server at: `https://[your-replit-url]:3000`

## Option 2: Production Deployment

For production deployments, we've created a dedicated deployment package:

```bash
# 1. Generate the deployment package
./deploy.sh

# 2. Navigate to the deployment directory
cd deploy

# 3. Start the production server
node start.js
```

The production server:
- Runs on port 5000 by default (customize with the PORT environment variable)
- Serves the landing page with all key features
- Provides API endpoints for integration
- Is optimized for reliability and performance

## Environment Variables

When deploying to production, make sure to set these environment variables:

```
# API Keys
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Voice/SMS Provider (SignalWire)
SIGNALWIRE_PROJECT_ID=your_project_id
SIGNALWIRE_TOKEN=your_token
SIGNALWIRE_SPACE_URL=your_space_url
SIGNALWIRE_PHONE_NUMBER=your_phone_number

# Alternative SMS Provider (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# Database (PostgreSQL)
DATABASE_URL=postgres://username:password@host:port/database
```

## Server API Endpoints

- **GET /** - Main landing page showcasing Ella AI
- **GET /api/health** - Health check endpoint returning server status

## Authentication

The system comes pre-configured with a default administrator account:
- Username: `admin`
- Password: `admin123`

**IMPORTANT**: Change this password immediately after deployment.

## Troubleshooting

If you encounter issues with the Vite development server on Replit:

1. Stop any running servers
2. Run `node replit-deploy-server.js` to use the simplified server
3. Access your application at port 5000

## Need Assistance?

Contact support@yobot.ai for deployment assistance or troubleshooting.

---

© 2025 YoBot Inc. All rights reserved.