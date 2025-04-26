<<<<<<< HEAD
# YoBot Enterprise AI Voice Platform

An intelligent voice communication platform that leverages cutting-edge telecommunications technology to simplify and enhance phone interactions using AI that sounds almost indistinguishable from humans.

![YoBot Logo](./attached_assets/YoBot%20Engange%20Smarter%20Logo%20w%20no%20background.png)

## Overview

YoBot is a comprehensive AI sales assistant capable of conducting natural, human-like conversations over the phone. The system handles outbound sales calls, texting, appointment setting, client follow-ups, and product sales - functioning as a complete virtual salesperson.

## Key Features

- **Ultra-Realistic Voice**: Premium-quality voice synthesis using ElevenLabs
- **Intelligent Conversation**: Natural language understanding and generation
- **Appointment Scheduling**: Seamless calendar integration and management
- **Multi-Channel Communication**: Voice calls, SMS, and chat
- **Sales Process Automation**: Lead qualification, follow-ups, and engagement
- **CRM Integration**: Comprehensive customer relationship management
- **Analytics & Reporting**: Detailed performance metrics and insights

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express 
- **Voice Technology**: ElevenLabs for speech synthesis
- **Telecommunications**: SignalWire for call infrastructure
- **Speech Recognition**: Web Speech API
- **Language Processing**: OpenAI GPT models

## Product Tiers

1. **Starter** ($5K + $499/mo): Basic AI assistant with appointment scheduling and 24/7 customer service
2. **Pro** ($8K + $799/mo): Advanced reporting, CRM integration, and custom voice training
3. **Enterprise**: Custom solutions with advanced features and integrations
4. **Platinum**: Full white-label solution with dedicated AI training and support

## Production Implementation

For deploying YoBot in a production environment with high-quality voice calls, refer to our comprehensive documentation:

- [Production Implementation Guide](./documentation/PRODUCTION-IMPLEMENTATION.md): Overview of the production architecture
- [Detailed Technical Implementation](./documentation/production-voice-implementation.md): Complete technical guide with code examples
- [AWS S3 Setup Guide](./documentation/AWS-S3-SETUP.md): Step-by-step instructions for setting up cloud storage

## Development Tools

We provide useful utilities for managing voice and call functionality:

- [Voice CDN Tool](./scripts/voice-cdn-tool.sh): CLI utility to generate, optimize, and upload speech files

## Setup & Configuration

### Prerequisites

- Node.js v20+
- AWS account (for production deployment with S3)
- SignalWire account with phone number
- ElevenLabs API key

### Environment Variables

Configure the following environment variables:

```
# SignalWire Credentials
SIGNALWIRE_SPACE_URL=your-space-url
SIGNALWIRE_PROJECT_ID=your-project-id
SIGNALWIRE_TOKEN=your-token
SIGNALWIRE_PHONE_NUMBER=your-phone-number

# ElevenLabs Text-to-Speech
ELEVENLABS_API_KEY=your-elevenlabs-key

# For Production (CDN Audio Hosting)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
S3_BUCKET_NAME=your-bucket-name
```
=======
# Ella AI Frontend

Ella is an intelligent AI-powered sales assistant designed to handle outbound sales calls, texting, appointment setting, client follow-ups, and product sales. This repository contains the frontend portion of the Ella AI platform.

## Key Features

- Advanced AI conversation engine with stateful memory
- Calendar integration with automated follow-ups
- Interactive call management
- Real-time voice synthesis using ElevenLabs
- Follow-up intelligence with meeting summaries and action tracking
- Persona management for different sales contexts

## Technology Stack

- React 18 with TypeScript
- Tailwind CSS for styling
- Shadcn UI components
- TanStack Query for data fetching
- Wouter for routing
>>>>>>> bcccf4cfa403e4b14b358b3f28aa3c582fb9ab56

## Getting Started

1. Clone the repository
<<<<<<< HEAD
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Access the application at `http://localhost:5000`

## Deployment

For production deployment, ensure you've configured the CDN-based audio hosting as described in the production implementation guides.

## License

Copyright © 2025 YoBot - All Rights Reserved
=======
2. Install dependencies
   ```
   npm install
   ```
3. Start the development server
   ```
   npm run dev
   ```

## Environment Configuration

Create a `.env` file with the following variables:

```
VITE_API_URL=your_backend_api_url
```
>>>>>>> bcccf4cfa403e4b14b358b3f28aa3c582fb9ab56
