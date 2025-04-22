import React, { useState, useRef, useEffect } from "react";
import { Send, Volume2, VolumeX } from "lucide-react";
import { getBotResponse } from "@/lib/botResponses";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  text: string;
  isUser: boolean;
  id?: string;
}

const LiveDemo: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm Ella, YoBot's AI assistant. I'm here to demonstrate my capabilities. What would you like to know about my features?",
      isUser: false,
      id: "intro",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Using the browser's built-in speech synthesis for now
  const speakText = (text: string) => {
    if (!audioEnabled || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice properties
    utterance.rate = 0.9; // Slightly slower for better clarity
    utterance.pitch = 1.1; // Slightly higher pitch for a more natural female voice
    utterance.volume = 1.0;
    
    // Try to use a female voice if available
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.includes('female') || 
      voice.name.includes('Samantha') || 
      voice.name.includes('Victoria') ||
      voice.name.includes('Ava')
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    // Event handlers
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    // Start speaking
    window.speechSynthesis.speak(utterance);
  };

  // Toggle audio
  const toggleAudio = () => {
    if (isSpeaking && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setAudioEnabled(!audioEnabled);
  };

  // Speak a specific message
  const speakMessage = (messageId: string) => {
    const messageToSpeak = messages.find(m => m.id === messageId);
    if (messageToSpeak && !messageToSpeak.isUser) {
      speakText(messageToSpeak.text);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage = {
      text: inputValue,
      isUser: true,
      id: `user-${Date.now()}`,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    
    // Add bot response after a delay
    setTimeout(() => {
      const botResponseId = `bot-${Date.now()}`;
      const botResponseText = getBotResponse(inputValue);
      
      const botResponse = {
        text: botResponseText,
        isUser: false,
        id: botResponseId,
      };
      
      setMessages((prev) => [...prev, botResponse]);
      
      // Speak the bot's response
      if (audioEnabled) {
        setTimeout(() => speakText(botResponseText), 100);
      }
    }, 1000);
  };

  // Initialize and play welcome message
  useEffect(() => {
    // Load voices for speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    
    // Play the initial greeting message on load
    setTimeout(() => {
      if (audioEnabled && messages.length > 0 && messages[0].id === "intro") {
        speakText(messages[0].text);
      }
    }, 1000);
    
    // Clean up on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <section id="demo" className="py-16 px-4 bg-gray-800">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Try YoBot's Ella in Action</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Experience our AI assistant with this live demo. Ask questions,
            schedule meetings, or explore other features.
          </p>
        </div>

        <div className="mx-auto max-w-2xl bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
          <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center">
              <div className="relative">
                <img
                  src="https://img.icons8.com/color/96/000000/bot.png"
                  alt="Ella"
                  className={`h-8 w-8 bg-white rounded-full p-1 mr-3 ${isSpeaking ? 'ring-2 ring-green-400 ring-offset-1 ring-offset-gray-800' : ''}`}
                />
                {isSpeaking && (
                  <div className="absolute -top-1 -right-1 flex items-center justify-center">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium">Ella</h3>
                {isSpeaking && (
                  <p className="text-xs text-green-400">Speaking...</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleAudio}
                className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                title={audioEnabled ? "Disable voice" : "Enable voice"}
              >
                {audioEnabled ? (
                  <Volume2 className="h-4 w-4 text-green-400" />
                ) : (
                  <VolumeX className="h-4 w-4 text-gray-400" />
                )}
              </button>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
          </div>
          <div 
            ref={messagesContainerRef}
            className="p-4 h-96 overflow-y-auto space-y-4"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.isUser ? "justify-end" : "items-start"
                }`}
              >
                <div
                  className={`${
                    message.isUser
                      ? "bg-gray-700 text-white rounded-lg rounded-tr-none"
                      : "bg-[#0D82DA] text-white rounded-lg rounded-tl-none"
                  } p-3 max-w-md relative`}
                >
                  {message.text}
                  {!message.isUser && (
                    <button
                      onClick={() => message.id && speakMessage(message.id)}
                      className="absolute -top-2 -right-2 bg-gray-800 p-1.5 rounded-full hover:bg-gray-700 transition-colors"
                      title="Play message"
                    >
                      <Volume2 className="h-3 w-3 text-white" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-700">
            <form onSubmit={handleSubmit} className="flex">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-gray-700 text-white placeholder-gray-400 rounded-l-md px-4 py-2 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="bg-[#0D82DA] hover:bg-blue-600 text-white px-4 py-2 rounded-r-md transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveDemo;
