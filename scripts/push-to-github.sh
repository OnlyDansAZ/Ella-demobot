#!/bin/bash

# Push Ella AI to GitHub
# This script helps push the Ella AI code to an existing GitHub repository

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

echo "🚀 Preparing to push to GitHub repository: $REPO_URL"

# Check if .git directory exists
if [ -d ".git" ]; then
    echo "Git repository already initialized. Checking remotes..."
    
    # Check if 'origin' remote exists
    if git remote | grep -q "^origin$"; then
        echo "Remote 'origin' already exists. Updating its URL..."
        git remote set-url origin $REPO_URL
    else
        echo "Adding remote 'origin'..."
        git remote add origin $REPO_URL
    fi
else
    echo "Initializing git repository..."
    git init
    
    echo "Adding remote 'origin'..."
    git remote add origin $REPO_URL
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "Creating .gitignore file..."
    cat > .gitignore << EOL
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
!.env.production.example

# Testing
/coverage
/cypress/screenshots
/cypress/videos

# System Files
Thumbs.db

# Data files (we don't want to push potentially private data)
/data
EOL
fi

# Add all files
echo "Adding files to git..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "Initial commit of Ella AI"

# Push to GitHub
echo "Pushing to GitHub..."
echo "This might prompt for your GitHub username and password or token."

git push -u origin master || git push -u origin main

# Check if push was successful
if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo "Your code is now available at: $REPO_URL"
else
    echo "❌ Failed to push to GitHub."
    echo "You might need to:"
    echo "1. Make sure you have the correct access permissions"
    echo "2. If you're using 2FA, make sure you're using a personal access token instead of your password"
    echo "3. Make sure the repository exists and is empty"
fi