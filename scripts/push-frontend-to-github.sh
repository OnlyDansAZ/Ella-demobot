#!/bin/bash

# Push Ella AI Frontend to GitHub
# This script extracts and pushes just the frontend portion to GitHub

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed. Please install git first."
    exit 1
fi

# Prompt for GitHub repository URL if not provided
if [ -z "$1" ]; then
    echo -n "Enter your GitHub repository URL (e.g., https://github.com/username/repo.git): "
    read REPO_URL
else
    REPO_URL=$1
fi

# Validate GitHub URL format
if [[ ! $REPO_URL =~ ^https://github.com/ ]]; then
    echo "Error: Invalid GitHub URL format. It should start with 'https://github.com/'"
    exit 1
fi

echo "🚀 Preparing to push the frontend to GitHub repository: $REPO_URL"

# Create temporary directory for frontend
TEMP_DIR="ella-frontend-temp"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

echo "📂 Extracting frontend files..."

# Copy frontend files
cp -r client/* $TEMP_DIR/
cp vite.config.ts $TEMP_DIR/
cp tsconfig.json $TEMP_DIR/
cp tailwind.config.ts $TEMP_DIR/
cp postcss.config.js $TEMP_DIR/
cp theme.json $TEMP_DIR/
cp .env.production.example $TEMP_DIR/.env.example

# Create a proper package.json for the frontend
cat > $TEMP_DIR/package.json << EOL
{
  "name": "ella-ai-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-aspect-ratio": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-collapsible": "^1.1.4",
    "@radix-ui/react-context-menu": "^2.2.7",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-hover-card": "^1.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-menubar": "^1.1.7",
    "@radix-ui/react-navigation-menu": "^1.2.7",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.3",
    "@radix-ui/react-radio-group": "^1.1.5",
    "@radix-ui/react-scroll-area": "^1.1.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.1.3",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.5",
    "@radix-ui/react-toast": "^1.1.6",
    "@radix-ui/react-toggle": "^1.1.3",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.6",
    "@tanstack/react-query": "^5.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "cmdk": "^0.2.0",
    "date-fns": "^2.30.0",
    "framer-motion": "^10.16.4",
    "lucide-react": "^0.279.0",
    "react": "^18.2.0",
    "react-day-picker": "^8.8.2",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.46.1",
    "react-icons": "^4.11.0",
    "react-resizable-panels": "^0.0.55",
    "recharts": "^2.8.0",
    "tailwind-merge": "^1.14.0",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.7.3",
    "wouter": "^2.11.0",
    "zod": "^3.22.2"
  },
  "devDependencies": {
    "@types/node": "^20.6.2",
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.15",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "postcss": "^8.4.29",
    "tailwindcss": "^3.3.3",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  }
}
EOL

# Create a README.md for the frontend repo
cat > $TEMP_DIR/README.md << EOL
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

## Getting Started

1. Clone the repository
2. Install dependencies
   \`\`\`
   npm install
   \`\`\`
3. Start the development server
   \`\`\`
   npm run dev
   \`\`\`

## Environment Configuration

Create a \`.env\` file with the following variables:

\`\`\`
VITE_API_URL=your_backend_api_url
\`\`\`
EOL

# Create a .gitignore file
cat > $TEMP_DIR/.gitignore << EOL
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Dependencies
node_modules
.npm
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions

# Build outputs
dist
dist-ssr
*.local
.cache
.output
.vite

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment files
.env
.env.*
!.env.example

# Testing
/coverage
/cypress/screenshots
/cypress/videos

# System Files
Thumbs.db
EOL

# Navigate to the temporary directory
cd $TEMP_DIR

# Initialize git repo
echo "🔧 Initializing git repository..."
git init

# Add all files
echo "Adding files to git..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "Initial commit of Ella AI Frontend"

# Add remote
echo "Adding remote repository..."
git remote add origin $REPO_URL

# Push to GitHub
echo "Pushing to GitHub..."
echo "This might prompt for your GitHub username and password or token."

git push -u origin master || git push -u origin main

# Check if push was successful
if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed frontend to GitHub!"
    echo "Your frontend code is now available at: $REPO_URL"
else
    echo "❌ Failed to push to GitHub."
    echo "You might need to:"
    echo "1. Make sure you have the correct access permissions"
    echo "2. If you're using 2FA, make sure you're using a personal access token instead of your password"
    echo "3. Make sure the repository exists and is empty"
fi

# Clean up
cd ..
echo "Cleaning up temporary directory..."
# Uncomment the following line if you want to automatically clean up the temp directory
# rm -rf $TEMP_DIR

echo "Done! You can find the extracted frontend code in the '$TEMP_DIR' directory."