#!/bin/bash

# Simple Deployment Script for Ella AI
echo "Deploying Ella AI simple server..."

# Stop any running servers
echo "Stopping any running servers..."
pkill -f "node simple-server.js" || true

# Create the deployment directory
mkdir -p prod-deploy

# Copy the necessary files
cp simple-server.js prod-deploy/

# Create a startup script
cat > prod-deploy/start.sh << 'EOF'
#!/bin/bash
node simple-server.js
EOF

chmod +x prod-deploy/start.sh

echo "Deployment complete!"
echo "To start the server, run:"
echo "cd prod-deploy && ./start.sh"
