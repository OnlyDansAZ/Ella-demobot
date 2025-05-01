const http = require('http');

const PORT = 3000;

// Simple HTML content
const html = `<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>Ella AI - YoBot</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 0; background: #f9fafb; color: #1f2937; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    header { background: linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%); color: white; padding: 4rem 0; text-align: center; }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 4rem 0; }
    .feature { background: white; border-radius: 0.5rem; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 0.75rem 1.5rem; border-radius: 0.375rem; text-decoration: none; }
  </style>
</head>
<body>
  <header>
    <div class='container'>
      <h1>Ella AI</h1>
      <p>The AI Sales Assistant That Sounds Human</p>
    </div>
  </header>
  <div class='container'>
    <h2>Welcome to Ella AI</h2>
    <p>Ella is a comprehensive AI sales assistant capable of conducting natural, human-like conversations with your prospects.</p>
    <div class='features'>
      <div class='feature'>
        <h3>Outbound Sales Calls</h3>
        <p>Ella makes natural phone calls on your behalf, navigating complex conversations, managing objections, qualifying leads, and booking appointments.</p>
      </div>
      <div class='feature'>
        <h3>Text Conversations</h3>
        <p>Engage prospects through personalized SMS conversations that feel authentic and responsive.</p>
      </div>
      <div class='feature'>
        <h3>Appointment Setting</h3>
        <p>Ella schedules meetings directly on your calendar and sends reminder notifications.</p>
      </div>
    </div>
    <div style='text-align: center;'>
      <a href='#' class='btn'>Get Started with Ella AI</a>
    </div>
  </div>
</body>
</html>`;

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Ella AI server is operational',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Ella AI server running on http://localhost:${PORT}`);
});
