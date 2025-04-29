import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

// Check if index.html exists, use default if not
let indexHtmlPath = path.join(__dirname, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.log('Creating default index.html...');
  
  const defaultHtml = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ella AI - YoBot</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 0;
        background: #f9fafb;
        color: #1f2937;
        line-height: 1.6;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }
      header {
        background: linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%);
        color: white;
        padding: 4rem 0;
        text-align: center;
      }
      h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
      }
      .card {
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        padding: 2rem;
        margin-bottom: 2rem;
      }
      .btn {
        display: inline-block;
        background: #2563eb;
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 0.375rem;
        text-decoration: none;
        font-weight: 500;
        cursor: pointer;
        border: none;
      }
      .btn:hover {
        background: #1d4ed8;
      }
      .status {
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 0.375rem;
      }
      .status.online {
        background: #d1fae5;
        color: #065f46;
      }
      .status.offline {
        background: #fee2e2;
        color: #b91c1c;
      }
    </style>
  </head>
  <body>
    <header>
      <div class="container">
        <h1>Ella AI</h1>
        <p>The advanced AI sales assistant for your business</p>
      </div>
    </header>
    
    <div class="container">
      <div class="card">
        <h2>Welcome to Ella AI</h2>
        <p>Ella is your comprehensive AI sales assistant designed to revolutionize your outbound sales process with human-like conversations.</p>
        <p>Our server is operational and ready to showcase Ella's capabilities.</p>
        
        <button id="checkStatus" class="btn">Check Server Status</button>
        <div id="statusDisplay" class="status"></div>
      </div>
      
      <div class="card">
        <h2>Key Features</h2>
        <ul>
          <li><strong>Outbound Sales Calls:</strong> Ella makes natural phone calls that qualify leads and book appointments</li>
          <li><strong>Text Conversations:</strong> Engage with leads through SMS that feels personal and responsive</li>
          <li><strong>Appointment Setting:</strong> Schedule meetings directly on your calendar</li>
          <li><strong>Client Follow-ups:</strong> Never lose a lead with automated, naturally-timed follow-up sequences</li>
        </ul>
      </div>
    </div>

    <script>
      document.getElementById('checkStatus').addEventListener('click', async () => {
        const statusDisplay = document.getElementById('statusDisplay');
        statusDisplay.textContent = 'Checking server status...';
        statusDisplay.className = 'status';
        
        try {
          const response = await fetch('/api/health');
          const data = await response.json();
          
          if (data.status === 'ok') {
            statusDisplay.textContent = `Server Online: ${data.message} (as of ${new Date(data.timestamp).toLocaleTimeString()})`;
            statusDisplay.className = 'status online';
          } else {
            statusDisplay.textContent = `Server Status: ${data.message}`;
            statusDisplay.className = 'status offline';
          }
        } catch (error) {
          statusDisplay.textContent = `Error: ${error.message}`;
          statusDisplay.className = 'status offline';
        }
      });
      
      // Check status on page load
      window.addEventListener('load', () => {
        document.getElementById('checkStatus').click();
      });
    </script>
  </body>
  </html>`;
  
  fs.writeFileSync(indexHtmlPath, defaultHtml);
}

// Create server
const server = http.createServer((req, res) => {
  console.log(`Request for ${req.url}`);
  
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(indexHtmlPath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'YoBot/Ella AI server is operational',
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Visit your Replit URL on port ${PORT} to see the application`);
});
