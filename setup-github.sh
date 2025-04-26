#!/bin/bash

# Ella Frontend GitHub Setup Script
# This script automates the process of extracting and pushing the Ella frontend to GitHub

echo "=== Ella Frontend GitHub Setup ==="
echo ""

# Check if tar file exists
if [ ! -f "ella-frontend.tar.gz" ]; then
    echo "Error: ella-frontend.tar.gz not found!"
    echo "Please make sure you've downloaded the archive file."
    exit 1
fi

# Create directory and extract
echo "Step 1: Extracting archive..."
mkdir -p ella-frontend
tar -xzf ella-frontend.tar.gz -C ella-frontend
cd ella-frontend

# Initialize git
echo ""
echo "Step 2: Initializing git repository..."
git init
git add .
git commit -m "Initial commit of Ella AI Frontend"

# Set up remote
echo ""
echo "Step 3: Setting up GitHub remote..."
echo "Using repository: https://github.com/OnlyDansAZ/ella-frontend.git"
git remote add origin https://github.com/OnlyDansAZ/ella-frontend.git

# Push to GitHub
echo ""
echo "Step 4: Pushing to GitHub..."
echo "This will prompt for your GitHub credentials."
echo ""
echo "IMPORTANT: If you have 2FA enabled on GitHub, you'll need to use a personal access token"
echo "instead of your password. You can create one at: https://github.com/settings/tokens"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
git push -u origin main

# Success message
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Your Ella frontend has been pushed to GitHub."
    echo "View your repository at: https://github.com/OnlyDansAZ/ella-frontend"
    echo ""
    
    # Ask about GitHub Pages
    echo "Would you like to set up GitHub Pages for hosting?"
    echo "1. Yes, set up GitHub Pages"
    echo "2. No, I'll do it later"
    read -p "Enter your choice (1 or 2): " choice
    
    if [ "$choice" = "1" ]; then
        echo ""
        echo "To set up GitHub Pages:"
        echo "1. Go to https://github.com/OnlyDansAZ/ella-frontend/settings/pages"
        echo "2. Under 'Source', select 'Deploy from a branch'"
        echo "3. Select 'main' branch"
        echo "4. Click 'Save'"
        echo ""
        echo "Your site will be available at: https://onlydansaz.github.io/ella-frontend/"
    fi
    
    echo ""
    echo "Done! 🎉"
else
    echo ""
    echo "❌ There was an error pushing to GitHub."
    echo "Please check your credentials and try again."
fi