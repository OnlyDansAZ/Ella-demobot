#!/bin/bash

# Build and Run Script for YoBot/Ella AI
# This script builds the application and starts the production server

# Terminal colors
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

echo -e "${YELLOW}=======================================${NC}"
echo -e "${YELLOW}  YoBot/Ella AI Platform Build & Run${NC}"
echo -e "${YELLOW}=======================================${NC}"
echo 

# Step 1: Build the project
echo -e "${CYAN}Step 1: Building the project...${NC}"
echo "This may take a few minutes."
npm run build

# Check if build succeeded
if [ ! -d "dist" ]; then
  echo -e "${RED}Build failed or dist directory not found.${NC}"
  exit 1
fi

echo -e "${GREEN}Build completed successfully!${NC}"
echo 

# Step 2: Start the production server
echo -e "${CYAN}Step 2: Starting production server...${NC}"
node production-app-server.js
