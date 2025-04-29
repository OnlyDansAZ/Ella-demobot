#!/usr/bin/env node

/**
 * Custom Server for Ella AI on port 3000
 * 
 * This server provides a reliable landing page and API endpoints
 * that work regardless of Vite host restrictions.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = 3000;

// Define the HTML content for our landing page
const landingPageHTML = `<!DOCTYPE html>
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
    h2 {
      font-size: 2rem;
      margin-bottom: 1.5rem;
      color: #2563eb;
    }
    p {
      margin-bottom: 1.5rem;
    }
    .subtitle {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 4rem;
      margin-bottom: 4rem;
    }
    .feature {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }
    .feature-icon {
      width: 4rem;
      height: 4rem;
      background: rgba(37, 99, 235, 0.1);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
      color: #2563eb;
    }
    .pricing {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 4rem;
      margin-bottom: 4rem;
    }
    .plan {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      text-align: center;
    }
    .plan-name {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .plan-price {
      font-size: 2.5rem;
      font-weight: 700;
      color: #2563eb;
      margin-bottom: 1rem;
    }
    .plan-features {
      text-align: left;
      margin-bottom: 2rem;
    }
    .plan-features li {
      margin-bottom: 0.5rem;
      list-style: none;
      position: relative;
      padding-left: 1.5rem;
    }
    .plan-features li:before {
      content: "✓";
      color: #10b981;
      position: absolute;
      left: 0;
    }
    .button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      text-decoration: none;
      font-weight: 500;
      transition: background 0.3s ease;
    }
    .button:hover {
      background: #1d4ed8;
    }
    .button-outline {
      background: transparent;
      border: 1px solid #2563eb;
      color: #2563eb;
    }
    .button-outline:hover {
      background: rgba(37, 99, 235, 0.1);
    }
    .section-title {
      text-align: center;
      margin-bottom: 3rem;
    }
    .cta {
      background: linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%);
      color: white;
      padding: 4rem 0;
      text-align: center;
      border-radius: 0.5rem;
      margin-bottom: 4rem;
    }
    .cta h2 {
      color: white;
    }
    footer {
      background: #1f2937;
      color: white;
      padding: 4rem 0;
    }
    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
    }
    .footer-logo {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .footer-links h3 {
      margin-bottom: 1rem;
      font-size: 1.25rem;
    }
    .footer-links ul {
      list-style: none;
      padding: 0;
    }
    .footer-links li {
      margin-bottom: 0.5rem;
    }
    .footer-links a {
      color: #9ca3af;
      text-decoration: none;
      transition: color 0.3s ease;
    }
    .footer-links a:hover {
      color: white;
    }
    .copyright {
      text-align: center;
      margin-top: 4rem;
      color: #9ca3af;
      font-size: 0.875rem;
    }
    .api-status {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      margin-top: 2rem;
    }
    .status-indicator {
      display: inline-block;
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      background: #10b981;
      margin-right: 0.5rem;
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>Ella AI</h1>
      <p class="subtitle">The AI Sales Assistant That Sounds Human</p>
      <a href="#pricing" class="button">View Pricing</a>
      <a href="#contact" class="button button-outline">Contact Us</a>
    </div>
  </header>

  <div class="container">
    <div class="section-title">
      <h2>What Ella Can Do For You</h2>
      <p>Ella isn't just another AI bot. She's a comprehensive sales assistant capable of handling your entire outbound sales process with human-like conversations.</p>
    </div>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">📞</div>
        <h3>Outbound Sales Calls</h3>
        <p>Ella makes natural phone calls on your behalf, navigating complex conversations, managing objections, qualifying leads, and booking appointments.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">💬</div>
        <h3>Text Conversations</h3>
        <p>Engage prospects through personalized SMS conversations that feel authentic and responsive, with no AI-sounding templates.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">📅</div>
        <h3>Appointment Setting</h3>
        <p>Ella schedules meetings directly on your calendar, handles rescheduling, and sends reminder notifications to maximize show rates.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">🔄</div>
        <h3>Smart Follow-ups</h3>
        <p>Never lose a lead with intelligent follow-up sequences that adjust timing and approach based on prospect engagement.</p>
      </div>
    </div>

    <div class="section-title" id="pricing">
      <h2>Pricing Plans</h2>
      <p>Choose the plan that fits your business needs and scale as you grow.</p>
    </div>

    <div class="pricing">
      <div class="plan">
        <div class="plan-name">Starter</div>
        <div class="plan-price">$5,000</div>
        <p>+ $499/month</p>
        <ul class="plan-features">
          <li>Up to 500 calls per month</li>
          <li>Basic conversation engine</li>
          <li>Calendar integration</li>
          <li>Email notifications</li>
          <li>8am-5pm support</li>
        </ul>
        <a href="#contact" class="button">Get Started</a>
      </div>
      <div class="plan">
        <div class="plan-name">Professional</div>
        <div class="plan-price">$10,000</div>
        <p>+ $999/month</p>
        <ul class="plan-features">
          <li>Up to 2,000 calls per month</li>
          <li>Advanced conversation engine</li>
          <li>Full CRM integration</li>
          <li>SMS & email follow-ups</li>
          <li>24/7 premium support</li>
        </ul>
        <a href="#contact" class="button">Get Started</a>
      </div>
      <div class="plan">
        <div class="plan-name">Enterprise</div>
        <div class="plan-price">Custom</div>
        <p>Tailored to your needs</p>
        <ul class="plan-features">
          <li>Unlimited calls</li>
          <li>Custom conversation flows</li>
          <li>Full system integration</li>
          <li>Dedicated success manager</li>
          <li>White-label options</li>
        </ul>
        <a href="#contact" class="button">Contact Us</a>
      </div>
    </div>

    <div class="cta" id="contact">
      <h2>Ready to transform your sales process?</h2>
      <p>Get in touch with our team to schedule a demo and see Ella in action.</p>
      <a href="mailto:sales@yobot.ai" class="button">Request a Demo</a>
    </div>

    <div class="api-status">
      <h3>Server Status</h3>
      <p><span class="status-indicator"></span> API health endpoint: <span id="status-message">Operational</span></p>
      <p><button onclick="checkApiHealth()" class="button button-outline">Check API Status</button></p>
      <div id="api-response"></div>
    </div>
  </div>

  <footer>
    <div class="container">
      <div class="footer-content">
        <div>
          <div class="footer-logo">Ella AI</div>
          <p>The most advanced AI sales assistant, powered by YoBot.</p>
        </div>
        <div class="footer-links">
          <h3>Company</h3>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Blog</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h3>Resources</h3>
          <ul>
            <li><a href="#">Documentation</a></li>
            <li><a href="#">API Reference</a></li>
            <li><a href="#">Support</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h3>Legal</h3>
          <ul>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Cookie Policy</a></li>
          </ul>
        </div>
      </div>
      <div class="copyright">
        &copy; 2025 YoBot Inc. All rights reserved.
      </div>
    </div>
  </footer>

  <script>
    function checkApiHealth() {
      const responseElement = document.getElementById('api-response');
      const statusMessage = document.getElementById('status-message');
      responseElement.innerHTML = 'Checking API health...';
      
      fetch('/api/health')
        .then(response => response.json())
        .then(data => {
          statusMessage.textContent = 'Operational';
          responseElement.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        })
        .catch(error => {
          statusMessage.textContent = 'Service Disruption';
          responseElement.innerHTML = `<pre>Error: ${error.message}</pre>`;
        });
    }
  </script>
</body>
</html>`;

// Create HTTP server
const server = http.createServer((req, res) => {
  const url = req.url;
  console.log(`Request for ${url}`);

  // API endpoint for health check
  if (url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'YoBot/Ella AI server is operational',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Serve landing page for root URL or any non-API route
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(landingPageHTML);
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Visit your Replit URL on port ${PORT} to see the application`);
});
