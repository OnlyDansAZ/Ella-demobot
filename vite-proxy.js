#!/usr/bin/env node

/**
 * Vite Proxy for Ella AI Application
 * 
 * This script creates a minimal proxy that addresses Vite's host restrictions
 * in the Replit environment.
 */

import http from 'http';
import https from 'https';
import url from 'url';

// Configuration
const PORT = process.env.PORT || 3001;
const VITE_PORT = 5000;

// Create proxy server
const server = http.createServer((req, res) => {
  console.log(`Proxy request: ${req.method} ${req.url}`);
  
  // Parse the request URL
  const parsedUrl = url.parse(req.url);
  
  // Construct options for the proxied request
  const options = {
    hostname: 'localhost',
    port: VITE_PORT,
    path: parsedUrl.path,
    method: req.method,
    headers: req.headers
  };
  
  // Remove the host header to avoid conflicts
  delete options.headers.host;
  
  // Create the proxied request
  const proxyReq = http.request(options, (proxyRes) => {
    // Copy the headers from the proxied response
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    
    // Set the status code
    res.writeHead(proxyRes.statusCode);
    
    // Pipe the proxy response to the original response
    proxyRes.pipe(res);
  });
  
  // Handle errors
  proxyReq.on('error', (e) => {
    console.error(`Proxy error: ${e.message}`);
    res.writeHead(502); // Bad Gateway
    res.end(`Proxy Error: ${e.message}`);
  });
  
  // Pipe the original request to the proxied request
  req.pipe(proxyReq);
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Vite proxy running on http://localhost:${PORT}`);
  console.log(`Proxying requests to Vite server at http://localhost:${VITE_PORT}`);
  console.log('Access your application at your Replit URL');
});
