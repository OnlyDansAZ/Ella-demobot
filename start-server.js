// Production-ready server startup script
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import cookieParser from 'cookie-parser';
import { registerRoutes } from './server/routes.js';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, 'dist/public')));

  // Register API routes
  const server = await registerRoutes(app);

  // For any request that doesn't match an API route, serve the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/public', 'index.html'));
  });

  // Start the server
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  // Handle termination signals
  process.on('SIGINT', () => {
    console.log('Shutting down server gracefully...');
    server.close(() => {
      console.log('Server terminated');
      process.exit(0);
    });
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});