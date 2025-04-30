#!/usr/bin/env node
import express from 'express';
import { spawn } from 'child_process';
import { createProxyMiddleware } from 'http-proxy-middleware';

const PORT = 5000;
const VITE_PORT = 5173;

const app = express();

// Health check endpoint (simplified from original)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║             YOBOT/ELLA AI PLATFORM                ║
╠═══════════════════════════════════════════════════╣
║ Initialization server started on port ${PORT}      ║
║ Starting Vite development environment...          ║
╚═══════════════════════════════════════════════════╝
`);
  startVite();
});

function startVite() {
  console.log('📱 Starting Vite development server...');
  const vite = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: VITE_PORT }
  });

  vite.on('error', (err) => {
    console.error('⚠️ Failed to start Vite server:', err);
    process.exit(1);
  });

  // Setup proxy after giving Vite time to start
  setTimeout(() => {
    app.use('/', createProxyMiddleware({
      target: `http://localhost:${VITE_PORT}`,
      changeOrigin: true,
      ws: true
    }));
    console.log(`
╔═══════════════════════════════════════════════════╗
║             YOBOT/ELLA AI PLATFORM                ║
╠═══════════════════════════════════════════════════╣
║ Application successfully started!                 ║
║                                                   ║
║ Access the application at:                        ║
║ http://localhost:${PORT}                       ║
║                                                   ║
║ Health check: http://localhost:${PORT}/health    ║
╚═══════════════════════════════════════════════════╝
`);
  }, 2000);
}

// Handle shutdown gracefully (improved from original)
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down application...');
  server.close(() => {
    console.log('✓ Express server closed');
    process.exit(0);
  });
});