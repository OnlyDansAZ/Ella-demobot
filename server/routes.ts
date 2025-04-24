import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// @ts-ignore
import ElevenLabs from "elevenlabs-node";
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateResponse, getFallbackResponse } from './openai';
import documentRoutes from './routes/documentRoutes';
import calendlyRouter from './routes/calendlyRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import conversationRoutes from './routes/conversationRoutes';
import personaRoutes from './routes/personaRoutes';
import { personaManager } from './personaManager';

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "YoBot API is running" });
  });
  
  // Document routes for RAG knowledge base management
  app.use("/api/documents", documentRoutes);
  
  // Calendly scheduling routes
  app.use("/api/calendly", calendlyRouter);
  
  // Appointment management routes
  app.use("/api/appointments", appointmentRoutes);
  
  // Conversation history routes
  app.use("/api/conversations", conversationRoutes);
  
  // Persona management routes
  app.use("/api/personas", personaRoutes);

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

  // OpenAI-powered chat API
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history = [], sessionId } = req.body;
      
      if (!message) {
        return res.status(400).json({ 
          success: false, 
          message: "Please provide a message" 
        });
      }
      
      if (!sessionId) {
        return res.status(400).json({ 
          success: false, 
          message: "Please provide a sessionId" 
        });
      }
      
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        console.warn("OpenAI API key not found, using fallback responses");
        const fallbackResponse = getFallbackResponse(message);
        return res.json({ success: true, response: fallbackResponse });
      }
      
      // Log conversation history for debugging context issues
      if (message.toLowerCase().includes("schedule") || 
          message.toLowerCase().includes("appointment") ||
          message.toLowerCase().includes("remember")) {
        console.log("Conversation history for context-sensitive request:", 
          history.map((msg: any) => `${msg.role}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`));
      }
      
      // Get the active persona for this session
      const persona = personaManager.getSessionPersona(sessionId);
      console.log(`Using persona: ${persona.id}`);
      
      // Generate AI response using OpenAI
      try {
        console.log("Generating OpenAI response for:", message);
        // Use the session ID directly for persona lookup
        const aiResponse = await generateResponse(message, history, null, null, sessionId);
        
        // Log the AI's response for important queries to help diagnose context issues
        if (message.toLowerCase().includes("schedule") || 
            message.toLowerCase().includes("appointment") ||
            message.toLowerCase().includes("time")) {
          console.log("AI response to scheduling query:", aiResponse);
        }
        
        res.json({ 
          success: true,
          response: aiResponse 
        });
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
        
        // If OpenAI fails, fall back to simple responses
        const fallbackResponse = getFallbackResponse(message);
        res.json({ 
          success: true,
          response: fallbackResponse 
        });
      }
    } catch (err) {
      console.error("Chat API error:", err);
      res.status(500).json({ 
        success: false, 
        error: "Failed to generate response",
        details: err instanceof Error ? err.message : String(err)
      });
    }
  });
  
  // Legacy bot response API - kept for backward compatibility
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
      "pricing": "We offer four tiers: Starter, Pro, Enterprise, and Platinum. Each tier has different features.",
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
  
  // ElevenLabs text-to-speech endpoint with enhanced options
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
      
      let { text, options } = req.body;
      
      if (!text) {
        return res.status(400).json({ 
          success: false,
          error: "Text parameter is required" 
        });
      }
      
      // Default options if not provided
      const speechOptions = options || {};
      
      // Process text to improve speech readability
      // Replace bullet points and similar characters with proper phrases for better speech
      text = text
        .replace(/•\s*/g, "")      // Remove bullet points completely
        .replace(/\*/g, "")        // Remove asterisks completely
        .replace(/-\s+/g, "")      // Remove hyphens followed by whitespace
        .replace(/^\s*-\s*/gm, "") // Remove hyphens at the beginning of each line
        .replace(/\n\s*-\s*/g, "\n"); // Replace newline-hyphen patterns with just newlines
      
      // Process SSML tags if present
      const hasSSML = text.includes('<break') || text.includes('<prosody') || text.includes('<emphasis');
      
      // Create temp file path for audio
      const tempFile = path.join(os.tmpdir(), `speech-${Date.now()}.mp3`);
      
      // Using the user-provided voice ID for Ella
      const voiceId = "KgleQSAupUuS391XuXpI";
      
      try {
        console.log("Generating speech with ElevenLabs");
        
        // Initialize ElevenLabs with the API key from environment
        const elevenLabs = new ElevenLabs({
          apiKey: ELEVENLABS_API_KEY,
          voiceId: voiceId
        });
        
        // Configure speech parameters with either defaults or user-provided options
        const stability = speechOptions.stability !== undefined ? speechOptions.stability : 0.5;
        const similarityBoost = speechOptions.similarityBoost !== undefined ? speechOptions.similarityBoost : 0.75;
        const style = speechOptions.style !== undefined ? speechOptions.style : 0.5;
        const useSpeakerBoost = speechOptions.useSpeakerBoost !== undefined ? speechOptions.useSpeakerBoost : true;
        
        console.log(`Using voice ID: ${voiceId} with parameters:`, { 
          stability, similarityBoost, style, useSpeakerBoost 
        });
        
        // Generate audio from ElevenLabs with enhanced options
        const result = await elevenLabs.textToSpeech({
          textInput: text,
          fileName: tempFile,
          stability,
          similarityBoost,
          style,
          speakerBoost: useSpeakerBoost,
          // Use modelId for the newest model if available
          modelId: "eleven_turbo_v2"
        });
        
        console.log("ElevenLabs response:", result);
        
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
