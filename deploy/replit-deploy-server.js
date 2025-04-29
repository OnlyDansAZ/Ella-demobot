import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

// Define simple HTML content
const htmlContent = `<!DOCTYPE html>
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
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    .feature {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }
    .feature h3 {
      color: #2563eb;
      margin-top: 0;
    }
    .pricing {
      margin-top: 4rem;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }
    .plan {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      text-align: center;
    }
    .plan-name {
      font-size: 1.25rem;
      font-weight: 600;
    }
    .plan-price {
      font-size: 2.5rem;
      font-weight: 700;
      color: #2563eb;
      margin: 1rem 0;
    }
    .plan-billing {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }
    footer {
      background: #1f2937;
      color: white;
      padding: 3rem 0;
      margin-top: 4rem;
      text-align: center;
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
    
    <h2>Key Features</h2>
    <div class="features">
      <div class="feature">
        <h3>Outbound Sales Calls</h3>
        <p>Ella makes natural phone calls that qualify leads and book appointments. Her voice is almost indistinguishable from a human sales representative.</p>
      </div>
      <div class="feature">
        <h3>Text Conversations</h3>
        <p>Engage with leads through SMS that feels personal and responsive. Ella manages the entire conversation flow with natural language.</p>
      </div>
      <div class="feature">
        <h3>Appointment Setting</h3>
        <p>Schedule meetings directly on your calendar. Ella handles the back-and-forth to find the perfect time slot for both parties.</p>
      </div>
      <div class="feature">
        <h3>Smart Follow-ups</h3>
        <p>Never lose a lead with automated, naturally-timed follow-up sequences that adapt to prospect engagement patterns.</p>
      </div>
    </div>
    
    <div class="pricing">
      <h2>Pricing Plans</h2>
      <div class="pricing-grid">
        <div class="plan">
          <div class="plan-name">Starter</div>
          <div class="plan-price">$5,000</div>
          <div class="plan-billing">+ $499/month</div>
          <p>Perfect for small businesses just getting started with AI sales automation.</p>
          <button class="btn">Get Started</button>
        </div>
        <div class="plan">
          <div class="plan-name">Pro</div>
          <div class="plan-price">$10,000</div>
          <div class="plan-billing">+ $999/month</div>
          <p>Ideal for growing businesses ready to scale their sales operations.</p>
          <button class="btn">Get Started</button>
        </div>
        <div class="plan">
          <div class="plan-name">Enterprise</div>
          <div class="plan-price">Custom</div>
          <div class="plan-billing">Contact for pricing</div>
          <p>For large organizations with complex sales processes and high volume needs.</p>
          <button class="btn">Contact Sales</button>
        </div>
      </div>
    </div>
  </div>

  <footer>
    <div class="container">
      <p>&copy; 2025 YoBot, Inc. All rights reserved.</p>
    </div>
  </footer>

  <script>
    // Simple script to check server status
    document.getElementById('checkStatus').addEventListener('click', async () => {
      const statusDisplay = document.getElementById('statusDisplay');
      statusDisplay.textContent = 'Checking server status...';
      statusDisplay.className = 'status';
      
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (data.status === 'ok') {
          statusDisplay.textContent = 'Server Online: YoBot/Ella AI server is operational';
          statusDisplay.className = 'status online';
        } else {
          statusDisplay.textContent = 'Server Status: ' + data.message;
          statusDisplay.className = 'status offline';
        }
      } catch (error) {
        statusDisplay.textContent = 'Error: ' + error.message;
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

// Create server
const server = http.createServer((req, res) => {
  console.log(`Request for ${req.url}`);
  
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlContent);
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
