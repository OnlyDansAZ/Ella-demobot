#!/usr/bin/env node
import express from 'express';
import { spawn } from 'child_process';
import { createProxyMiddleware } from 'http-proxy-middleware';

const PORT = 3000;        
const VITE_PORT = 5173;

const app = express();

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
  startVite();
});

function startVite() {
  const vite = spawn('npx', ['vite', '--port', VITE_PORT.toString(), '--host'], {
    stdio: 'inherit',
    shell: true
  });

  vite.on('error', (err) => {
    console.error('Failed to start Vite:', err);
    process.exit(1);
  });

  setTimeout(() => {
    app.use('/', createProxyMiddleware({
      target: `http://localhost:${VITE_PORT}`,
      changeOrigin: true,
      ws: true
    }));
  }, 3000);
}

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});