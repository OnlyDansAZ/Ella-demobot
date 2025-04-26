#!/bin/bash

# Ella AI Deployment Script
# This script prepares the Ella AI application for production deployment

echo "🚀 Starting Ella AI deployment process..."

# Set environment to production
export NODE_ENV=production

# Check for required environment variables
echo "📋 Checking required environment variables..."

REQUIRED_VARS=(
  "OPENAI_API_KEY"
  "ELEVENLABS_API_KEY"
  "SIGNALWIRE_PROJECT_ID"
  "SIGNALWIRE_TOKEN"
  "SIGNALWIRE_SPACE_URL"
  "SIGNALWIRE_PHONE_NUMBER"
  "DATABASE_URL"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
  echo -e "\n⚠️  Warning: The following required environment variables are not set:"
  for var in "${MISSING_VARS[@]}"; do
    echo "   - $var"
  done
  echo -e "\nThese variables must be configured in your production environment."
fi

# Clean previous builds
echo -e "\n🧹 Cleaning previous builds..."
if [ -d "dist" ]; then
  rm -rf dist
  echo "Previous build directory removed."
fi

# Create production build
echo -e "\n🔨 Creating production build..."
npm run build

if [ $? -ne 0 ]; then
  echo -e "\n❌ Build failed. Please check the errors above."
  exit 1
fi

echo -e "\n✅ Build completed successfully!"

# Generate deployment report
echo -e "\n📊 Generating deployment report..."

VERSION=$(node -e "console.log(require('./package.json').version || 'N/A')")
NODE_VERSION=$(node -v)
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > deployment-report.txt << EOL
ELLA AI DEPLOYMENT REPORT
=========================
Generated: $DATE
Version: $VERSION
Node Version: $NODE_VERSION

Environment Variables Status:
----------------------------
EOL

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "$var: ⚠️ Missing" >> deployment-report.txt
  else
    echo "$var: ✓" >> deployment-report.txt
  fi
done

cat >> deployment-report.txt << EOL

Build Info:
----------
- Build Command: npm run build
- Output Directory: dist
- Build Date: $DATE

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
EOL

echo "Deployment report generated at: deployment-report.txt"

# Final instructions
echo -e "\n🏁 Production build process complete!"
echo -e "\nNext steps:"
echo "1. Review the deployment report"
echo "2. Deploy the contents of the \"dist\" directory to your hosting provider"
echo "3. Configure environment variables in your production environment"
echo "4. Run database migrations if necessary"
echo "5. Configure your domain and SSL settings"
echo -e "\nRefer to documentation/deployment_guide.md for detailed instructions.\n"