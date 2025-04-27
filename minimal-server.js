// Minimal express server for testing
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'YoBot minimal API server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Simple API for message testing
app.post('/api/message', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  console.log('Received message:', message);
  
  // Simple response for testing
  const responses = [
    "Thanks for your message! I'll get back to you soon.",
    "I've received your message and will process it shortly.",
    "Your message has been recorded.",
    "Thanks for reaching out! How can I help you further?"
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  res.json({
    success: true,
    message: randomResponse
  });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Start server on port 5000
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Minimal server running on http://0.0.0.0:${PORT}`);
});