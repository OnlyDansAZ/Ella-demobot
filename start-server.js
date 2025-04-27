// Simple server startup that serves the Ella AI application on port 5000
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
// Skip auth for now to simplify startup
// import { setupAuth } from './server/auth.js';
import cookieParser from 'cookie-parser';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Skip auth setup for now
// setupAuth(app);

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'YoBot API is running' });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'client')));

// Catch-all route that serves the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Start server
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});