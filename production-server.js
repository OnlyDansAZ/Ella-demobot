
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoutes } from './server/routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// JSON parsing middleware
app.use(express.json());

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register API routes
registerRoutes(app);

// Serve static files from the React app build directory
app.use(express.static('dist/public', { maxAge: '1h' }));

// Handle React routing, return all requests to React app
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist/public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on port ${PORT}`);
});
