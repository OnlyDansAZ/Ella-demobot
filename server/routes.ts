import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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

  const httpServer = createServer(app);

  return httpServer;
}
