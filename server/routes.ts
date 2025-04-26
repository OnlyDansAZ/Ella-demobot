import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';
import { generateResponse, getFallbackResponse, generateImage } from './openai';
import documentRoutes from './routes/documentRoutes';
import calendlyRouter from './routes/calendlyRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import conversationRoutes from './routes/conversationRoutes';
import personaRoutes from './routes/personaRoutes';
import sessionRoutes from './routes/sessionRoutes';
import calendarRoutes from './routes/calendarRoutes';
import { personaManager } from './personaManager';
import { calendarService } from './calendarService';
// Import the SignalWire service with ElevenLabs integration
import signalWireRoutes from './routes/signalWireRoutes';
import { ELEVENLABS_AUDIO_DIR, cleanupOldAudioFiles } from './elevenLabsService';
import { getClient } from './signalWireClient';
import { WebSocketServer, WebSocket } from 'ws';

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize SignalWire client for phone calls and SMS
  try {
    await getClient();
    console.log('SignalWire client initialized');
  } catch (error) {
    console.error('Warning: SignalWire client initialization failed:', error);
    console.log('Will use mock client for development if needed');
  }
  
  // Clean up old audio files on startup
  cleanupOldAudioFiles();

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
  
  // Session management routes
  app.use("/api/session", sessionRoutes);
  
  // Calendar management routes
  app.use("/api/calendar", calendarRoutes);
  
  // SignalWire phone call routes
  // Use the SignalWire implementation with ElevenLabs
  app.use("/api", signalWireRoutes);
  
  // Serve temporary audio files with improved reliability
  app.get("/temp/:filename", (req, res) => {
    try {
      const { filename } = req.params;
      
      // Validate filename (prevent path traversal)
      if (!filename || filename.includes('..') || filename.includes('/')) {
        console.error(`Invalid audio filename requested: ${filename}`);
        return res.status(400).json({ success: false, error: "Invalid filename" });
      }
      
      // Build path to the requested file
      const filePath = path.join(ELEVENLABS_AUDIO_DIR, filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`Audio file not found: ${filePath}`);
        return res.status(404).json({ success: false, error: "Audio file not found" });
      }
      
      const fileStats = fs.statSync(filePath);
      if (fileStats.size === 0) {
        console.error(`Empty audio file: ${filePath}`);
        return res.status(500).json({ success: false, error: "Audio file is empty" });
      }
      
      // Determine MIME type based on file extension
      const extension = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream'; // Default
      
      if (extension === '.mp3') {
        contentType = 'audio/mpeg';
      } else if (extension === '.wav') {
        contentType = 'audio/wav';
      }
      
      // Set appropriate headers for better browser compatibility
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', fileStats.size);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`); // Changed to attachment for more reliable playback
      
      console.log(`Serving temporary audio file (${fileStats.size} bytes): ${filename}`);
      
      // Stream the file to the response with error handling
      const fileStream = fs.createReadStream(filePath);
      
      fileStream.on('error', (streamError) => {
        console.error(`Error streaming audio file ${filename}:`, streamError);
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: "Failed to stream audio file" });
        }
      });
      
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving audio file:', error);
      res.status(500).json({ success: false, error: "Failed to serve audio file" });
    }
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
  
  // Voice testing endpoint - allows testing voice directly in browser
  app.post("/api/test-voice", async (req, res) => {
    try {
      const { text, voiceGender, stabilityLevel } = req.body;
      
      if (!text) {
        return res.status(400).json({
          success: false,
          message: "Please provide text to speak"
        });
      }
      
      const { generateSpeech, getVoiceId } = await import('./elevenLabsService');
      
      // Use custom parameters if provided
      const voiceSettings = {
        stability: stabilityLevel ? parseFloat(stabilityLevel) : 0.30,
        similarityBoost: 0.80,
        style: 0.65,
        useSpeakerBoost: true
      };
      
      // Get appropriate voice ID based on gender preference
      const voiceId = getVoiceId(voiceGender || 'female');
      
      console.log(`Generating test voice sample with ${voiceGender || 'female'} voice and ${voiceSettings.stability} stability`);
      
      // Generate speech file
      const audioFilename = await generateSpeech(text, voiceId, voiceSettings);
      
      // Return path to the generated audio
      return res.json({
        success: true,
        audioUrl: `/temp/${audioFilename}`,
        message: "Voice generated successfully"
      });
    } catch (error: any) {
      console.error('Error generating test voice:', error);
      return res.status(500).json({
        success: false,
        message: "Failed to generate voice sample",
        error: error.message || "Unknown error"
      });
    }
  });

  // OpenAI-powered chat API
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history = [], sessionId, demoMode } = req.body;
      
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
      
      // Check if we're in demo mode - triggered by URL parameter or request body
      if (demoMode === 'true' || demoMode === true) {
        console.log("DEMO MODE ACTIVE: Using pre-defined sales demo responses");
        
        // Import demo scenarios
        const { getRelevantDemoScenario, getDemoContinuation } = await import('./demoScenarios');
        
        // Get the most relevant scenario based on the user's message
        const scenario = getRelevantDemoScenario(message);
        
        // If no scenario is found, use default response
        if (!scenario) {
          console.log("No matching demo scenario found, using default response");
          return res.json({
            success: true,
            response: "Thank you for your interest in YoBot! Our AI assistant helps businesses automate conversations and improve customer service. What specific features would you like to know more about?",
            isDemoMode: true,
            demoScenario: "Default"
          });
        }
        
        console.log(`Demo scenario selected: ${scenario.name}`);
        
        // Generate a demo response
        const demoResponse = getDemoContinuation(scenario, history, message);
        
        // Return the demo response with demo mode flag
        return res.json({ 
          success: true, 
          response: demoResponse,
          isDemoMode: true,
          demoScenario: scenario.name
        });
      }
      
      // Regular mode processing continues below
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
  
  // ElevenLabs text-to-speech endpoint with persona-specific voice settings
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
      
      let { text, options, sessionId, personaId } = req.body;
      
      if (!text) {
        return res.status(400).json({ 
          success: false,
          error: "Text parameter is required" 
        });
      }
      
          // Get persona-specific voice settings if available
      let voiceSettings;
      let personaName = "default";
      
      try {
        if (sessionId) {
          // If session ID is provided, get the persona associated with this session
          try {
            const sessionPersona = personaManager.getSessionPersona(sessionId);
            if (sessionPersona) {
              personaName = sessionPersona.name;
              
              if (sessionPersona.voiceSettings) {
                voiceSettings = sessionPersona.voiceSettings;
                console.log(`Using voice settings from session persona: ${sessionPersona.name}`);
              } else {
                console.log(`Session persona ${sessionPersona.name} has no voice settings, using defaults`);
              }
            }
          } catch (sessionError) {
            console.error('Failed to get session persona:', sessionError);
            // Will continue with default settings
          }
        } else if (personaId) {
          // If persona ID is directly provided, use that persona's voice settings
          try {
            const specificPersona = personaManager.getPersona(personaId);
            if (specificPersona) {
              personaName = specificPersona.name;
              
              if (specificPersona.voiceSettings) {
                voiceSettings = specificPersona.voiceSettings;
                console.log(`Using voice settings from specific persona: ${specificPersona.name}`);
              } else {
                console.log(`Specific persona ${specificPersona.name} has no voice settings, using defaults`);
              }
            }
          } catch (personaError) {
            console.error('Failed to get specific persona:', personaError);
            // Will continue with default settings
          }
        }
      } catch (error) {
        console.error('Error retrieving persona voice settings:', error);
        // Continue with default settings if there's an error
      }
      
      // Fallback to provided options or defaults if no persona voice settings
      const speechOptions = voiceSettings || options || {};
      
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
      
      // Using either persona-specific voice ID or the default Ella voice
      const voiceId = speechOptions.voiceId || "KgleQSAupUuS391XuXpI";
      
      try {
        console.log(`Generating speech with ElevenLabs direct API for persona: ${personaName}`);
        
        // Check if ElevenLabs API key is available
        if (!ELEVENLABS_API_KEY) {
          throw new Error("ElevenLabs API key is not configured or missing");
        }
        
        // Configure speech parameters with either persona-specific, user-provided, or defaults
        const stability = speechOptions.stability !== undefined ? speechOptions.stability : 0.5;
        const similarityBoost = speechOptions.similarityBoost !== undefined ? speechOptions.similarityBoost : 0.75;
        const style = speechOptions.style !== undefined ? speechOptions.style : 0.5;
        const useSpeakerBoost = speechOptions.useSpeakerBoost !== undefined ? speechOptions.useSpeakerBoost : true;
        
        console.log(`Using voice ID: ${voiceId} with parameters:`, { 
          stability, similarityBoost, style, useSpeakerBoost 
        });
        
        // Process text to improve speech readability
        const processedText = text
          .replace(/•\s*/g, "")      // Remove bullet points completely
          .replace(/\*/g, "")        // Remove asterisks completely
          .replace(/-\s+/g, "")      // Remove hyphens followed by whitespace
          .replace(/^\s*-\s*/gm, "") // Remove hyphens at the beginning of each line
          .replace(/\n\s*-\s*/g, "\n") // Replace newline-hyphen patterns with just newlines
          .replace(/\n+/g, ". ");    // Replace multiple newlines with periods to improve speech flow
        
        // Make a direct API call to ElevenLabs
        try {
          const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
              text: processedText,
              model_id: "eleven_multilingual_v2", // Use latest model
              voice_settings: {
                stability: stability,
                similarity_boost: similarityBoost,
                style: style,
                use_speaker_boost: useSpeakerBoost
              }
            })
          });
          
          // Handle API response errors
          if (!response.ok) {
            let errorText = '';
            try {
              const errorData = await response.json();
              errorText = JSON.stringify(errorData);
            } catch (e) {
              errorText = await response.text();
            }
            
            throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
          }
          
          // Get audio as buffer
          const audioData = await response.arrayBuffer();
          
          // Check if we got a valid audio response
          if (!audioData || audioData.byteLength === 0) {
            throw new Error('Received empty audio response from ElevenLabs');
          }
          
          console.log(`Received audio response: ${audioData.byteLength} bytes`);
          
          // Save the audio to a temporary file
          await fs.writeFile(tempFile, Buffer.from(audioData));
          
          // Read back the audio file for response
          const responseData = await fs.readFile(tempFile);
          
          if (!responseData || responseData.length === 0) {
            throw new Error("Generated audio file is empty or invalid");
          }
          
          // Set appropriate headers for audio streaming
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Cache-Control', 'no-cache');
          
          // Send the audio data
          res.send(responseData);
          
          // Clean up the temp file after sending
          await fs.remove(tempFile).catch((err: any) => console.error('Error removing temp file:', err));
        } catch (speechError) {
          console.error("Failed to generate speech with ElevenLabs:", speechError);
          throw new Error(`ElevenLabs API error: ${speechError instanceof Error ? speechError.message : String(speechError)}`);
        }
      } catch (error) {
        console.error("ElevenLabs API error:", error);
        res.status(500).json({ 
          success: false,
          error: "Failed to generate speech", 
          details: error instanceof Error ? error.message : String(error),
          personaUsed: personaName
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

  // Image generation endpoint using DALL-E 3
  app.post("/api/images/generate", async (req, res) => {
    try {
      const { prompt, size } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ 
          success: false, 
          error: "Please provide a prompt description for the image" 
        });
      }
      
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          success: false, 
          error: "OpenAI API key is not configured" 
        });
      }
      
      // Generate the image
      try {
        console.log(`Generating image with prompt: "${prompt}"`);
        const imageUrl = await generateImage(prompt, size);
        
        res.json({ 
          success: true, 
          imageUrl,
          prompt 
        });
      } catch (openaiError) {
        console.error("OpenAI image generation error:", openaiError);
        res.status(500).json({ 
          success: false, 
          error: "Failed to generate image",
          details: openaiError instanceof Error ? openaiError.message : String(openaiError)
        });
      }
    } catch (err) {
      console.error("Image generation API error:", err);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err)
      });
    }
  });

  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections in a set
  const activeConnections = new Set<WebSocket>();
  
  // WebSocket connection handler
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Add to active connections
    activeConnections.add(ws);
    
    // Send initial message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to YoBot real-time updates'
    }));
    
    // Handle messages from client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
        
        // Handle subscription to call updates
        if (data.type === 'subscribe' && data.callId) {
          console.log(`Client subscribed to call updates for call ID: ${data.callId}`);
          
          // Store callId in the WebSocket object for future reference
          (ws as any).subscribedCallId = data.callId;
          
          // Send confirmation
          ws.send(JSON.stringify({
            type: 'subscribed',
            callId: data.callId
          }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      activeConnections.delete(ws);
    });
  });
  
  // Export the active connections set so other parts of the app can send updates
  (global as any).websocketConnections = activeConnections;
  
  return httpServer;
}
