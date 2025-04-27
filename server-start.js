// Custom server startup script
import { spawn } from 'child_process';
import { createServer } from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import express from 'express';

// Start the vite dev server as a child process
const viteProcess = spawn('npm', ['run', 'dev'], { 
  stdio: 'inherit',
  shell: true 
});

console.log('Starting Vite development server...');

// Give vite some time to start
setTimeout(() => {
  // Create a proxy server on port 5000 that forwards to the Vite server
  const app = express();
  
  // Add health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'YoBot proxy server is running' });
  });
  
  // Proxy all other requests to the Vite development server
  app.use('/', createProxyMiddleware({ 
    target: 'http://localhost:5173',
    changeOrigin: true,
    ws: true,
    logLevel: 'debug'
  }));
  
  // Start the proxy server
  const server = app.listen(5000, '0.0.0.0', () => {
    console.log('📣 Proxy server running at http://0.0.0.0:5000 -> forwarding to Vite on port 5173');
  });
  
  // Handle shutdown gracefully
  process.on('SIGINT', () => {
    console.log('Shutting down proxy server...');
    server.close();
    viteProcess.kill();
    process.exit(0);
  });
  
}, 3000); // Wait 3 seconds for Vite to start