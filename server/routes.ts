import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// @ts-ignore
import ElevenLabs from "elevenlabs-node";
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "YoBot API is running" });
  });

  // Contact form submission endpoint
  app.post("/api/contact", (req, res) => {
    const { name, email, message } = req.body;
    
    // Validate inputs
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide name, email and message" 
      });
    }
    
    // In a real app, this would store the contact in a database or send an email
    console.log("Contact form submission:", { name, email, message });
    
    // Return success response
    res.json({ 
      success: true, 
      message: "Thank you for contacting us! We will get back to you soon." 
    });
  });

  // Bot response API - used if you want to leverage server for generating responses
  app.post("/api/bot/response", (req, res) => {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide a message" 
      });
    }
    
    const lowercaseMessage = message.toLowerCase();
    let response = "I'm not sure I understand that question. You can ask about YoBot's features, pricing tiers, or try commands like 'schedule' or 'call'.";
    
    // Simple response mapping (in a real app, this would be more sophisticated)
    const responseMap: Record<string, string> = {
      "hello": "Hello! How can I assist you today?",
      "hi": "Hi there! What would you like to know about YoBot?",
      "features": "YoBot offers calendar management, call handling, record keeping, bill payment, and custom personalities. The features vary by tier.",
      "pricing": "We offer four tiers: Starter ($19/month), Pro ($49/month), Enterprise ($99/month), and Platinum ($199/month). Each tier has different features.",
      "help": "I'm here to help! You can ask about features, pricing, or try commands like 'schedule a meeting'."
    };
    
    // Check for exact match
    if (responseMap[lowercaseMessage]) {
      response = responseMap[lowercaseMessage];
    } else {
      // Check for partial matches
      for (const key in responseMap) {
        if (lowercaseMessage.includes(key)) {
          response = responseMap[key];
          break;
        }
      }
    }
    
    res.json({ 
      success: true,
      response 
    });
  });
  
  // ElevenLabs text-to-speech endpoint
  app.post("/api/speech", async (req, res) => {
    try {
      // Access ElevenLabs API key from environment
      const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
      
      if (!ELEVENLABS_API_KEY) {
        return res.status(500).json({ 
          success: false,
          error: "ElevenLabs API key is not configured" 
        });
      }
      
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ 
          success: false,
          error: "Text parameter is required" 
        });
      }
      
      // Create temp file path for audio
      const tempFile = path.join(os.tmpdir(), `speech-${Date.now()}.mp3`);
      
      // Using the user-provided voice ID
      const voiceId = "KgleQSAupUuS391XuXpI";
      
      try {
        // First check if we can get user info to validate the API key
        console.log("Attempting to use ElevenLabs with API key");
        
        // Use axios directly for better debugging
        const axios = require('axios');
        const audioResponse = await axios({
          method: 'post',
          url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': 'sk_9ef05054f89dae4c84c4ae5c4217da2098fce71818a98dc5'
          },
          data: {
            text: text,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          },
          responseType: 'stream'
        });
        
        console.log("ElevenLabs API direct response status:", audioResponse.status);
        
        // Write the audio data to a temporary file
        const writer = fs.createWriteStream(tempFile);
        audioResponse.data.pipe(writer);
        
        // Wait for the file to be written
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        
        // Read the audio file
        const audioData = await fs.readFile(tempFile);
        
        // Set appropriate headers for audio streaming
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-cache');
        
        // Send the audio data
        res.send(audioData);
        
        // Clean up the temp file after sending
        await fs.remove(tempFile).catch((err: any) => console.error('Error removing temp file:', err));
      } catch (error) {
        console.error("ElevenLabs API error:", error);
        res.status(500).json({ 
          success: false,
          error: "Failed to generate speech", 
          details: error instanceof Error ? error.message : String(error)
        });
      }
    } catch (err) {
      console.error("Speech generation error:", err);
      res.status(500).json({ 
        success: false,
        error: "Internal server error", 
        details: err instanceof Error ? err.message : String(err)
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
