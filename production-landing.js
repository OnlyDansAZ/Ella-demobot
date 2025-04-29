#!/usr/bin/env node

/**
 * Production Landing Page Server for Ella AI
 * 
 * This script provides a reliable server for production deployment
 * that works independently of Vite's host restrictions.
 */

import http from 'http';

// Configuration
const PORT = process.env.PORT || 3000;

// Simple HTML landing page
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ella AI - YoBot</title>
  <style>
    :root {
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --accent: #8b5cf6;
      --text: #1f2937;
      --text-light: #6b7280;
      --background: #f9fafb;
      --white: #ffffff;
      --success: #10b981;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--background);
      color: var(--text);
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }
    
    header {
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: var(--white);
      padding: 6rem 0;
      text-align: center;
    }
    
    h1 {
      font-size: 3rem;
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }
    
    h2 {
      font-size: 2rem;
      margin-bottom: 1.5rem;
      color: var(--primary);
      text-align: center;
    }
    
    .header-subtitle {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }
    
    .btn {
      display: inline-block;
      background-color: var(--white);
      color: var(--primary);
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      font-weight: 500;
      text-decoration: none;
      margin: 0.5rem;
      transition: all 0.3s ease;
    }
    
    .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    
    .btn-primary {
      background-color: var(--primary);
      color: var(--white);
    }
    
    .btn-primary:hover {
      background-color: var(--primary-dark);
    }
    
    .section {
      padding: 5rem 0;
    }
    
    .section-dark {
      background-color: #f3f4f6;
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }
    
    .feature {
      background-color: var(--white);
      border-radius: 0.5rem;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }
    
    .feature:hover {
      transform: translateY(-5px);
    }
    
    .feature-content {
      padding: 1.5rem;
    }
    
    .feature-icon {
      width: 3rem;
      height: 3rem;
      background-color: rgba(37, 99, 235, 0.1);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }
    
    .feature h3 {
      margin-bottom: 1rem;
      font-size: 1.25rem;
    }
    
    .feature p {
      color: var(--text-light);
    }
    
    .pricing {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }
    
    .plan {
      background-color: var(--white);
      border-radius: 0.5rem;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
      text-align: center;
      padding: 2rem;
    }
    
    .plan:hover {
      transform: translateY(-5px);
    }
    
    .plan-name {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .plan-price {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: var(--primary);
    }
    
    .plan-billing {
      color: var(--text-light);
      margin-bottom: 1.5rem;
    }
    
    .plan-features {
      margin-bottom: 2rem;
      text-align: left;
    }
    
    .plan-features li {
      margin-bottom: 0.75rem;
      list-style: none;
      position: relative;
      padding-left: 1.5rem;
    }
    
    .plan-features li:before {
      content: '✓';
      position: absolute;
      left: 0;
      color: var(--success);
    }
    
    .cta {
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: var(--white);
      text-align: center;
      padding: 4rem 0;
      border-radius: 0.5rem;
    }
    
    .cta h2 {
      color: var(--white);
      margin-bottom: 1rem;
    }
    
    .api-status {
      margin-top: 3rem;
      padding: 2rem;
      background-color: var(--white);
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .status-indicator {
      display: inline-block;
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      background-color: var(--success);
      margin-right: 0.5rem;
    }
    
    pre {
      background-color: #f1f5f9;
      padding: 1rem;
      border-radius: 0.5rem;
      overflow: auto;
      margin-top: 1rem;
    }
    
    footer {
      background-color: var(--text);
      color: var(--white);
      padding: 3rem 0;
      margin-top: 5rem;
    }
    
    .footer-content {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    }
    
    .footer-company {
      flex: 0 0 100%;
      margin-bottom: 2rem;
    }
    
    .footer-links {
      flex: 1 0 200px;
    }
    
    .footer-links h3 {
      margin-bottom: 1rem;
      font-size: 1.25rem;
    }
    
    .footer-links ul {
      list-style: none;
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
      color: var(--white);
    }
    
    .copyright {
      text-align: center;
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: #9ca3af;
    }
    
    @media (max-width: 768px) {
      h1 {
        font-size: 2rem;
      }
      
      h2 {
        font-size: 1.5rem;
      }
      
      .container {
        padding: 0 1rem;
      }
      
      .footer-content {
        flex-direction: column;
      }
      
      .footer-links {
        margin-bottom: 2rem;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>Meet Ella AI</h1>
      <p class="header-subtitle">The AI Sales Assistant That Sounds Human</p>
      <div>
        <a href="#pricing" class="btn btn-primary">View Pricing</a>
        <a href="#contact" class="btn">Contact Us</a>
      </div>
    </div>
  </header>

  <section class="section" id="features">
    <div class="container">
      <h2>What Ella Can Do For You</h2>
      <p style="text-align: center; max-width: 700px; margin: 0 auto 3rem;">Ella isn't just another AI bot. She's a comprehensive sales assistant capable of handling your entire outbound sales process with human-like conversations.</p>
      
      <div class="features">
        <div class="feature">
          <div class="feature-content">
            <div class="feature-icon">📞</div>
            <h3>Outbound Sales Calls</h3>
            <p>Ella makes natural phone calls on your behalf, navigating complex conversations, managing objections, qualifying leads, and booking appointments.</p>
          </div>
        </div>
        
        <div class="feature">
          <div class="feature-content">
            <div class="feature-icon">💬</div>
            <h3>Text Conversations</h3>
            <p>Engage prospects through personalized SMS conversations that feel authentic and responsive, with no AI-sounding templates.</p>
          </div>
        </div>
        
        <div class="feature">
          <div class="feature-content">
            <div class="feature-icon">📅</div>
            <h3>Appointment Setting</h3>
            <p>Ella schedules meetings directly on your calendar, handles rescheduling, and sends reminder notifications to maximize show rates.</p>
          </div>
        </div>
        
        <div class="feature">
          <div class="feature-content">
            <div class="feature-icon">🔄</div>
            <h3>Smart Follow-ups</h3>
            <p>Never lose a lead with intelligent follow-up sequences that adjust timing and approach based on prospect engagement.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section-dark" id="pricing">
    <div class="container">
      <h2>Pricing Plans</h2>
      <p style="text-align: center; max-width: 700px; margin: 0 auto 3rem;">Choose the plan that fits your business needs and scale as you grow.</p>
      
      <div class="pricing">
        <div class="plan">
          <div class="plan-name">Starter</div>
          <div class="plan-price">$5,000</div>
          <div class="plan-billing">+ $499/month</div>
          <ul class="plan-features">
            <li>Up to 500 calls per month</li>
            <li>Basic conversation engine</li>
            <li>Calendar integration</li>
            <li>Email notifications</li>
            <li>8am-5pm support</li>
          </ul>
          <a href="#contact" class="btn btn-primary">Get Started</a>
        </div>
        
        <div class="plan" style="border: 2px solid var(--primary); transform: scale(1.05);">
          <div class="plan-name">Professional</div>
          <div class="plan-price">$10,000</div>
          <div class="plan-billing">+ $999/month</div>
          <ul class="plan-features">
            <li>Up to 2,000 calls per month</li>
            <li>Advanced conversation engine</li>
            <li>Full CRM integration</li>
            <li>SMS & email follow-ups</li>
            <li>24/7 premium support</li>
          </ul>
          <a href="#contact" class="btn btn-primary">Get Started</a>
        </div>
        
        <div class="plan">
          <div class="plan-name">Enterprise</div>
          <div class="plan-price">Custom</div>
          <div class="plan-billing">Tailored to your needs</div>
          <ul class="plan-features">
            <li>Unlimited calls</li>
            <li>Custom conversation flows</li>
            <li>Full system integration</li>
            <li>Dedicated success manager</li>
            <li>White-label options</li>
          </ul>
          <a href="#contact" class="btn btn-primary">Contact Us</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="contact">
    <div class="container">
      <div class="cta">
        <h2>Ready to transform your sales process?</h2>
        <p style="margin-bottom: 2rem;">Get in touch with our team to schedule a demo and see Ella in action.</p>
        <a href="mailto:sales@yobot.ai" class="btn">Request a Demo</a>
      </div>
      
      <div class="api-status">
        <h3>Server Status</h3>
        <p><span class="status-indicator"></span> API Status: <span id="status-text">Operational</span></p>
        <button id="check-api" class="btn">Check API Status</button>
        <div id="api-response"></div>
      </div>
    </div>
  </section>

  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-company">
          <h3>Ella AI</h3>
          <p>The AI sales assistant that sounds and feels like a real person, powered by YoBot.</p>
        </div>
        
        <div class="footer-links">
          <h3>Product</h3>
          <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#">Testimonials</a></li>
            <li><a href="#">Case Studies</a></li>
          </ul>
        </div>
        
        <div class="footer-links">
          <h3>Company</h3>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
        
        <div class="footer-links">
          <h3>Resources</h3>
          <ul>
            <li><a href="#">Documentation</a></li>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">API Reference</a></li>
            <li><a href="#">Privacy Policy</a></li>
          </ul>
        </div>
      </div>
      
      <div class="copyright">
        &copy; 2025 YoBot Inc. All rights reserved.
      </div>
    </div>
  </footer>

  <script>
    document.getElementById('check-api').addEventListener('click', function() {
      const responseDiv = document.getElementById('api-response');
      const statusText = document.getElementById('status-text');
      responseDiv.innerHTML = 'Checking API health...';
      
      fetch('/api/health')
        .then(response => response.json())
        .then(data => {
          statusText.textContent = 'Operational';
          responseDiv.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
        })
        .catch(error => {
          statusText.textContent = 'Service Disruption';
          responseDiv.innerHTML = '<pre>Error: ' + error.message + '</pre>';
        });
    });
  </script>
</body>
</html>`;

// Create HTTP server
const server = http.createServer((req, res) => {
  const url = req.url;
  console.log(`Request for ${url}`);

  // Handle API requests
  if (url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'YoBot/Ella AI server is operational',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Serve landing page for all other routes
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(htmlContent);
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Visit your Replit URL on port ${PORT} to see the application`);
});
