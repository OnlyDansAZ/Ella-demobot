#!/usr/bin/env node

/**
 * Create Deployment Package Script for YoBot/Ella AI
 * 
 * This script creates a minimal deployment package with:
 * 1. A static HTML landing page
 * 2. Express server to serve it
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure paths
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(distDir, 'public');

// Create necessary directories
async function createDirectories() {
  console.log('Creating directories...');
  try {
    await fs.mkdir(distDir, { recursive: true });
    await fs.mkdir(publicDir, { recursive: true });
    console.log('Directories created successfully.');
  } catch (error) {
    console.error('Error creating directories:', error);
    throw error;
  }
}

// Create a simple HTML landing page
async function createLandingPage() {
  console.log('Creating landing page...');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YoBot Ella AI | Intelligent Voice Communication Platform</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    body {
      background: #f9fafb;
      color: #111827;
      line-height: 1.5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    header {
      background-color: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 1rem 0;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: #4f46e5;
    }
    .hero {
      padding: 6rem 0;
      text-align: center;
    }
    .hero h1 {
      font-size: 3rem;
      margin-bottom: 1.5rem;
      color: #1f2937;
    }
    .hero p {
      font-size: 1.25rem;
      max-width: 800px;
      margin: 0 auto 2rem;
      color: #4b5563;
    }
    .cta-button {
      display: inline-block;
      background-color: #4f46e5;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      font-weight: 500;
      text-decoration: none;
      transition: background-color 0.2s;
    }
    .cta-button:hover {
      background-color: #4338ca;
    }
    .features {
      padding: 4rem 0;
      background-color: #ffffff;
    }
    .features h2 {
      text-align: center;
      font-size: 2rem;
      margin-bottom: 3rem;
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }
    .feature-card {
      background-color: #f9fafb;
      border-radius: 0.5rem;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .feature-card h3 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      color: #1f2937;
    }
    .feature-card p {
      color: #6b7280;
    }
    footer {
      background-color: #1f2937;
      color: #9ca3af;
      padding: 2rem 0;
      text-align: center;
    }
    footer p {
      margin-bottom: 1rem;
    }
    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2rem;
      }
      .hero p {
        font-size: 1rem;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="container header-content">
      <div class="logo">YoBot Ella AI</div>
      <nav>
        <!-- Navigation links will go here -->
      </nav>
    </div>
  </header>

  <section class="hero">
    <div class="container">
      <h1>Meet Ella: Your AI Sales Assistant</h1>
      <p>An intelligent voice communication platform with advanced conversation capabilities and robust authentication mechanisms, focusing on creating seamless and secure user interactions.</p>
      <a href="#contact" class="cta-button">Get Started</a>
    </div>
  </section>

  <section class="features">
    <div class="container">
      <h2>Key Features</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <h3>Natural Voice Interactions</h3>
          <p>Engage with customers using natural-sounding voice that's almost indistinguishable from human conversation.</p>
        </div>
        <div class="feature-card">
          <h3>Comprehensive Sales Automation</h3>
          <p>Handle outbound calls, appointment setting, follow-ups, and complete sales processes with advanced AI.</p>
        </div>
        <div class="feature-card">
          <h3>Secure Communications</h3>
          <p>Enterprise-grade security and authentication ensures all customer interactions remain private and protected.</p>
        </div>
      </div>
    </div>
  </section>

  <footer>
    <div class="container">
      <p>&copy; 2025 YoBot Ella AI. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>`;

  try {
    await fs.writeFile(path.join(publicDir, 'index.html'), html);
    console.log('Landing page created successfully.');
  } catch (error) {
    console.error('Error creating landing page:', error);
    throw error;
  }
}

// Main function to create the deployment package
async function createDeploymentPackage() {
  console.log('Creating deployment package...');
  try {
    await createDirectories();
    await createLandingPage();
    console.log('Deployment package created successfully.');
  } catch (error) {
    console.error('Error creating deployment package:', error);
    process.exit(1);
  }
}

// Run the main function
createDeploymentPackage();