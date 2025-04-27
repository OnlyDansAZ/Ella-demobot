# Ella AI Production Deployment Guide

This guide provides step-by-step instructions for deploying the Ella AI application in a production environment.

## Prerequisites

Before deploying, ensure you have:

1. Node.js 20.x or later installed
2. PostgreSQL database setup and credentials
3. Required API keys:
   - OpenAI API key
   - ElevenLabs API key (for premium voice)
   - SignalWire credentials (for phone calls and SMS)
   - Twilio credentials (alternative for SMS if used)

## Environment Setup

1. Clone the repository from GitHub:
   ```bash
   git clone https://github.com/your-organization/ella-ai.git
   cd ella-ai
   ```

2. Create a production environment file:
   ```bash
   cp .env.production.example .env.production
   ```

3. Edit the `.env.production` file with your actual credentials:
   ```
   # Application Settings
   NODE_ENV=production
   PORT=5000

   # OpenAI API Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # ElevenLabs Voice Configuration
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

   # SignalWire Communication Service
   SIGNALWIRE_PROJECT_ID=your_signalwire_project_id
   SIGNALWIRE_TOKEN=your_signalwire_token
   SIGNALWIRE_SPACE_URL=your_signalwire_space_url
   SIGNALWIRE_PHONE_NUMBER=your_signalwire_phone_number

   # Database Configuration
   DATABASE_URL=postgres://username:password@host:port/database
   PGUSER=db_username
   PGPASSWORD=db_password
   PGHOST=db_host
   PGPORT=db_port
   PGDATABASE=db_name
   
   # Session Secret (generate a strong random string)
   SESSION_SECRET=generate_a_secure_random_string_here
   ```

## Database Setup

1. Ensure your PostgreSQL database is running and accessible.

2. Push the database schema using Drizzle:
   ```bash
   npm run db:push
   ```

3. Verify that the tables were created successfully:
   ```bash
   psql -U your_db_username -d your_db_name -c "\dt"
   ```

## Building for Production

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the frontend and backend:
   ```bash
   npm run build
   ```

## Starting the Production Server

1. Start the production server:
   ```bash
   npm run start
   ```

2. Alternatively, use PM2 for better process management:
   ```bash
   npm install -g pm2
   pm2 start start-server.js --name "ella-ai"
   ```

## Authentication

The system comes pre-configured with a default administrator account:
- Username: `admin`
- Password: `admin123`

**IMPORTANT**: Change this password immediately after deployment by logging in and using the profile settings page.

## Monitoring and Maintenance

1. Monitor the application logs:
   ```bash
   pm2 logs ella-ai
   ```

2. Check application health:
   ```bash
   curl http://your-server-domain:5000/api/health
   ```

3. Restart the application if needed:
   ```bash
   pm2 restart ella-ai
   ```

## Backup and Recovery

1. Regular database backups are recommended:
   ```bash
   pg_dump -U your_db_username -d your_db_name > backup_$(date +%Y%m%d).sql
   ```

2. Set up automated backups using cron jobs.

## Troubleshooting

### Common Issues

1. **Database Connection Problems**:
   - Verify database credentials in `.env.production`
   - Check if the database server is running
   - Ensure network firewall allows connections to the database port

2. **API Keys Not Working**:
   - Verify keys are correctly entered in `.env.production`
   - Check API provider dashboards for usage limits or account issues

3. **Server Won't Start**:
   - Check ports are not in use: `lsof -i :5000`
   - Ensure Node.js version is compatible
   - Verify all dependencies are installed: `npm install`

### Getting Help

If you encounter persistent issues, contact support at:
- Email: support@example.com
- GitHub Issues: https://github.com/your-organization/ella-ai/issues

## Security Considerations

1. Always change default passwords immediately
2. Store API keys and secrets securely
3. Keep the application and its dependencies updated
4. Use HTTPS for all production deployments
5. Set up proper network firewalls and security groups

## Performance Optimization

1. Consider using a content delivery network (CDN) for static assets
2. Set up database query caching
3. Scale vertically (larger servers) or horizontally (multiple instances) as needed

---

© 2025 YoBot Inc. All rights reserved.