#!/usr/bin/env node

/**
 * Production Build Script
 * 
 * This script prepares the Ella AI application for production deployment by:
 * 1. Verifying required environment variables are set
 * 2. Creating an optimized production build
 * 3. Generating a deployment report
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk'); // We'll use the built-in console colors instead

// Define required environment variables for production
const REQUIRED_ENV_VARS = [
  'OPENAI_API_KEY',
  'ELEVENLABS_API_KEY',
  'SIGNALWIRE_PROJECT_ID',
  'SIGNALWIRE_TOKEN',
  'SIGNALWIRE_SPACE_URL',
  'SIGNALWIRE_PHONE_NUMBER',
  'DATABASE_URL'
];

// Define additional recommended environment variables
const RECOMMENDED_ENV_VARS = [
  'PORT',
  'NODE_ENV'
];

console.log('\n🚀 Starting Ella AI production build process...\n');

// Step 1: Check for required environment variables
console.log('📋 Checking required environment variables...');
const missingVars = [];

REQUIRED_ENV_VARS.forEach(envVar => {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
});

if (missingVars.length > 0) {
  console.log('\n⚠️  Warning: The following required environment variables are not set:');
  missingVars.forEach(variable => {
    console.log(`   - ${variable}`);
  });
  console.log('\nThese variables must be configured in your production environment.');
}

// Check for recommended environment variables
const missingRecommended = [];
RECOMMENDED_ENV_VARS.forEach(envVar => {
  if (!process.env[envVar]) {
    missingRecommended.push(envVar);
  }
});

if (missingRecommended.length > 0) {
  console.log('\n📝 Note: The following recommended environment variables are not set:');
  missingRecommended.forEach(variable => {
    console.log(`   - ${variable}`);
  });
}

// Set NODE_ENV to production for the build process
process.env.NODE_ENV = 'production';

// Step 2: Create production build
console.log('\n🔨 Creating production build...');

try {
  // Clean previous builds if they exist
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    console.log('Cleaning previous build...');
    fs.rmSync(distPath, { recursive: true, force: true });
  }

  // Run the build process
  console.log('Running build command...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.error('\n❌ Build failed with error:', error.message);
  process.exit(1);
}

// Step 3: Generate deployment report
console.log('\n📊 Generating deployment report...');

// Get package info
const packageJson = require(path.join(process.cwd(), 'package.json'));

// Create deployment report
const reportPath = path.join(process.cwd(), 'deployment-report.txt');
const reportContent = `
ELLA AI DEPLOYMENT REPORT
=========================
Generated: ${new Date().toISOString()}
Version: ${packageJson.version || 'N/A'}
Node Version: ${process.version}

Environment Variables Status:
----------------------------
${REQUIRED_ENV_VARS.map(v => `${v}: ${process.env[v] ? '✓' : '⚠️ Missing'}`).join('\n')}

Recommended Environment Variables:
----------------------------------
${RECOMMENDED_ENV_VARS.map(v => `${v}: ${process.env[v] ? '✓' : 'Not set'}`).join('\n')}

Build Info:
----------
- Build Command: npm run build
- Output Directory: dist
- Build Date: ${new Date().toISOString()}

Deployment Instructions:
----------------------
1. Deploy the contents of the 'dist' directory to your hosting provider
2. Ensure all required environment variables are configured
3. Set up the database using the migration scripts
4. Configure your domain and SSL certificate

Next Steps:
----------
- See documentation/deployment_guide.md for detailed deployment instructions
- Run any necessary database migrations
- Verify API integrations once deployed
- Set up monitoring and logging
`;

fs.writeFileSync(reportPath, reportContent);
console.log(`Deployment report generated at: ${reportPath}`);

// Final instructions
console.log('\n🏁 Production build process complete!');
console.log('\nNext steps:');
console.log('1. Review the deployment report');
console.log('2. Deploy the contents of the "dist" directory to your hosting provider');
console.log('3. Configure environment variables in your production environment');
console.log('4. Run database migrations if necessary');
console.log('5. Configure your domain and SSL settings');
console.log('\nRefer to documentation/deployment_guide.md for detailed instructions.\n');