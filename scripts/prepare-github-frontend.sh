#!/bin/bash

# Prepare Ella AI Frontend for GitHub
# This script extracts the frontend portion of Ella and prepares it for GitHub

echo "🚀 Preparing Ella AI Frontend for GitHub..."

# Create a temporary directory for frontend files
FRONTEND_DIR="ella-frontend-github"

echo "📁 Creating directory structure..."
mkdir -p $FRONTEND_DIR
mkdir -p $FRONTEND_DIR/src
mkdir -p $FRONTEND_DIR/public

# Copy frontend files
echo "📋 Copying frontend files..."
cp -r client/src/* $FRONTEND_DIR/src/
cp -r public/* $FRONTEND_DIR/public/ 2>/dev/null || true

# Copy important configuration files
echo "🔧 Copying configuration files..."
cp package.json $FRONTEND_DIR/
cp tsconfig.json $FRONTEND_DIR/
cp vite.config.ts $FRONTEND_DIR/
cp tailwind.config.ts $FRONTEND_DIR/
cp postcss.config.js $FRONTEND_DIR/
cp theme.json $FRONTEND_DIR/

# Create a dedicated GitHub README
cat > $FRONTEND_DIR/README.md << EOL
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

## Building for Production

To build the application for production:

\`\`\`
npm run build
\`\`\`

The built files will be located in the \`dist\` directory.

## License

[Specify your license here]

EOL

# Create a frontend-specific .gitignore
cat > $FRONTEND_DIR/.gitignore << EOL
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

# Create GitHub specific files
echo "🔗 Creating GitHub specific files..."

# Create GitHub pull request template
mkdir -p $FRONTEND_DIR/.github/PULL_REQUEST_TEMPLATE
cat > $FRONTEND_DIR/.github/PULL_REQUEST_TEMPLATE/pull_request_template.md << EOL
## Description

Please include a summary of the change and which issue is fixed. Include relevant motivation and context.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to not work as expected)
- [ ] This change requires a documentation update

## How Has This Been Tested?

Please describe the tests you ran to verify your changes. Provide instructions so we can reproduce.

## Checklist:

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
EOL

# Create GitHub issue templates
mkdir -p $FRONTEND_DIR/.github/ISSUE_TEMPLATE
cat > $FRONTEND_DIR/.github/ISSUE_TEMPLATE/bug_report.md << EOL
---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment (please complete the following information):**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Additional context**
Add any other context about the problem here.
EOL

cat > $FRONTEND_DIR/.github/ISSUE_TEMPLATE/feature_request.md << EOL
---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
EOL

# Create package.json specifically for the frontend
cat > $FRONTEND_DIR/package.json << EOL
{
  "name": "ella-ai-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\""
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
    "prettier": "^3.0.3",
    "tailwindcss": "^3.3.3",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  }
}
EOL

# Create a modified vite.config.ts for the frontend-only project
cat > $FRONTEND_DIR/vite.config.ts << EOL
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on \`mode\` in the current directory.
  // Set the third parameter to '' to load all env regardless of the \`VITE_\` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@assets': path.resolve(__dirname, './public'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
EOL

# Create an environment template file
cat > $FRONTEND_DIR/.env.example << EOL
# API configuration
VITE_API_URL=http://localhost:5000

# Optional: Google Analytics ID
VITE_GA_ID=

# Optional: Theme customization
VITE_DEFAULT_THEME=light
EOL

# Create GitHub Actions workflow for CI/CD
mkdir -p $FRONTEND_DIR/.github/workflows
cat > $FRONTEND_DIR/.github/workflows/ci.yml << EOL
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Lint
      run: npm run lint
EOL

echo "📦 Creating archive for GitHub..."
zip -r ella-frontend-github.zip $FRONTEND_DIR

echo "✅ GitHub preparation complete!"
echo "The frontend code has been extracted to the '$FRONTEND_DIR' directory."
echo "A zip file 'ella-frontend-github.zip' has been created for easy transport."
echo ""
echo "To push to GitHub, follow these steps:"
echo "1. Create a new repository on GitHub"
echo "2. Extract the zip file"
echo "3. Initialize git and push:"
echo "   cd $FRONTEND_DIR"
echo "   git init"
echo "   git add ."
echo "   git commit -m \"Initial commit\""
echo "   git remote add origin https://github.com/yourusername/your-repo-name.git"
echo "   git push -u origin main"
echo ""
echo "Note: Make sure to replace 'yourusername/your-repo-name' with your actual GitHub repository."