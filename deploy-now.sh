#!/bin/bash

echo "=== Deploying Ella AI Landing Page ==="
echo "This script will deploy a production-ready landing page for Ella AI."

# Stop any running servers
pkill -f "node production-landing.js" || true

# Run the server in the background
node production-landing.js > ella-server.log 2>&1 &

# Check if server started successfully
sleep 2
if curl -s http://localhost:3000/api/health > /dev/null; then
  echo "✅ Deployment successful!"
  echo "🌐 Your landing page is now available at:"
  echo "   http://localhost:3000"
  echo "   or your Replit URL on port 3000"
  echo ""
  echo "💡 To check server logs: cat ella-server.log"
  echo "💡 To stop the server: pkill -f \"node production-landing.js\""
else
  echo "❌ Deployment failed. Check ella-server.log for details."
fi
