#!/bin/bash
# Simple script to run Ella AI landing page

echo "Starting Ella AI server on port 3000..."

# Kill any existing processes
pkill -f "node production-landing.js" || true

# Start the server
node production-landing.js &

# Wait for server to start
sleep 2

# Check if server is running
if curl -s http://localhost:3000/api/health > /dev/null; then
  echo "✅ Server is running on port 3000"
  echo "✅ Access your landing page at your Replit URL on port 3000"
  echo ""
  echo "To test locally: curl -s http://localhost:3000/api/health"
else
  echo "❌ Failed to start server"
fi
