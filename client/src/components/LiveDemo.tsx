import React, { useState, useRef, useEffect } from "react";
import { Send, Volume2, VolumeX, Mic, MicOff, RefreshCw } from "lucide-react";
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
  const [isListening, setIsListening] = useState(false);
  const [voiceInputSupported, setVoiceInputSupported] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Speak text function using ElevenLabs API
  const speakText = async (text: string) => {
    if (!audioEnabled) return;
    
    // Stop any currently playing audio
    if (audio.current) {
      audio.current.pause();
      audio.current.currentTime = 0;
    }
    
    try {
      setIsSpeaking(true);
      
      // Call our API endpoint to get speech audio
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error('Speech generation failed');
      }
      
      // Get audio blob from response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create audio element if it doesn't exist
      if (!audio.current) {
        const audioElement = new Audio();
        audioElement.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioElement.src); // Clean up the URL
        };
        audioElement.onerror = () => {
          console.error('Audio playback error');
          setIsSpeaking(false);
        };
        audio.current = audioElement;
      }
      
      // Set new audio source and play
      audio.current.src = audioUrl;
      await audio.current.play();
    } catch (error) {
      console.error('Error generating or playing speech:', error);
      setIsSpeaking(false);
      
      // Fall back to browser's speech synthesis as backup
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel(); // Cancel any ongoing speech
          
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.error('Fallback speech synthesis error:', err);
          setIsSpeaking(false);
        }
      } else {
        setIsSpeaking(false);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (isSpeaking) {
      // Stop any currently playing audio
      if (audio.current) {
        audio.current.pause();
        audio.current.currentTime = 0;
      }
      
      // Also cancel any speech synthesis as fallback
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
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

  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage = {
      text: inputValue,
      isUser: true,
      id: `user-${Date.now()}`,
    };
    
    const userInput = inputValue;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      // Format conversation history for context
      const conversationHistory = messages.slice(-6).map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text
      }));
      
      // Call our OpenAI-powered API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userInput,
          history: conversationHistory
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }
      
      const data = await response.json();
      
      if (data.success && data.response) {
        const botResponseId = `bot-${Date.now()}`;
        
        const botResponse = {
          text: data.response,
          isUser: false,
          id: botResponseId,
        };
        
        setMessages((prev) => [...prev, botResponse]);
        
        // Speak the bot's response
        if (audioEnabled) {
          setTimeout(() => speakText(data.response), 100);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error getting bot response:', error);
      
      // Add a fallback error response
      const botResponse = {
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        isUser: false,
        id: `bot-error-${Date.now()}`,
      };
      
      setMessages((prev) => [...prev, botResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  // Start speech recognition
  const startSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not available in your browser or could not be initialized. Please try a modern browser like Chrome, Edge, or Safari.");
      return;
    }
    
    // Stop any speaking before starting listening
    if (isSpeaking) {
      if (audio.current) {
        audio.current.pause();
        audio.current.currentTime = 0;
      }
      
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      setIsSpeaking(false);
    }
    
    try {
      // Show a helpful message the first time
      if (!localStorage.getItem('micPermissionAsked')) {
        localStorage.setItem('micPermissionAsked', 'true');
        alert("YoBot needs microphone access to hear you. Please allow microphone access when prompted.");
      }
      
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      alert("Could not access your microphone. Please check your browser permissions and try again.");
      setIsListening(false);
    }
  };

  // Stop speech recognition
  const stopSpeechRecognition = () => {
    if (!recognitionRef.current) return;
    
    recognitionRef.current.stop();
    setIsListening(false);
  };

  // Initialize speech recognition and play welcome message
  useEffect(() => {
    // Check if the browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      try {
        setVoiceInputSupported(true);
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        // Log when recognition starts
        recognition.onstart = () => {
          console.log('Speech recognition started');
          setIsListening(true);
        };
        
        recognition.onresult = async (event: any) => {
          console.log('Speech recognition result received');
          
          try {
            const transcript = event.results[0][0].transcript;
            console.log('Transcript:', transcript);
            
            setInputValue(transcript);
            
            // Process the transcript
            if (transcript && transcript.trim()) {
              // Create and add user message
              const userMessage = {
                text: transcript,
                isUser: true,
                id: `user-${Date.now()}`,
              };
              
              setMessages((prev) => [...prev, userMessage]);
              setIsLoading(true);
              
              try {
                // Format conversation history for API
                const conversationHistory = messages.slice(-6).map(msg => ({
                  role: msg.isUser ? "user" : "assistant",
                  content: msg.text
                }));
                
                // Call our OpenAI-powered API endpoint
                const response = await fetch('/api/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    message: transcript,
                    history: conversationHistory
                  }),
                });
                
                if (!response.ok) {
                  throw new Error('Failed to get AI response');
                }
                
                const data = await response.json();
                
                if (data.success && data.response) {
                  const botResponseId = `bot-${Date.now()}`;
                  
                  const botResponse = {
                    text: data.response,
                    isUser: false,
                    id: botResponseId,
                  };
                  
                  setMessages((prev) => [...prev, botResponse]);
                  
                  // Speak the bot's response
                  if (audioEnabled) {
                    setTimeout(() => speakText(data.response), 100);
                  }
                }
              } catch (error) {
                console.error('Speech input API error:', error);
                
                // Add a fallback error response
                const botResponse = {
                  text: "I'm sorry, I'm having trouble connecting right now. Please try again.",
                  isUser: false,
                  id: `bot-error-${Date.now()}`,
                };
                
                setMessages((prev) => [...prev, botResponse]);
              } finally {
                setIsLoading(false);
              }
            }
          } catch (err) {
            console.error('Error processing speech result:', err);
          }
          
          setIsListening(false);
        };
        
        recognition.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          // Show a message to the user if permission is denied
          if (event.error === 'not-allowed') {
            alert('Microphone access is required for voice input. Please enable microphone permissions in your browser settings.');
          }
        };
        
        recognitionRef.current = recognition;
      } catch (error) {
        console.error('Error setting up speech recognition:', error);
        setVoiceInputSupported(false);
      }
    } else {
      console.log('Speech recognition not supported in this browser');
      setVoiceInputSupported(false);
    }
    
    // Play the initial greeting message on load
    setTimeout(() => {
      if (audioEnabled && messages.length > 0 && messages[0].id === "intro") {
        speakText(messages[0].text);
      }
    }, 1000);
    
    // Clean up on unmount
    return () => {
      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      
      // Cancel any speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      // Stop any playing audio
      if (audio.current) {
        audio.current.pause();
        audio.current.src = '';
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
          <p className="text-gray-300 max-w-2xl mx-auto mb-4">
            Experience our AI assistant with this live demo. Ask questions,
            schedule meetings, or explore other features.
          </p>
          {voiceInputSupported && (
            <div className="bg-gray-700 p-3 rounded-md max-w-md mx-auto text-left flex items-start border-l-4 border-blue-500">
              <Mic className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-white block mb-1">Voice Control Available!</span>
                Click the microphone button below the chat window to speak to Ella.
                Your browser will ask for microphone permission the first time you try this.
              </p>
            </div>
          )}
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
            
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-gray-800 text-white rounded-lg rounded-tl-none p-3 max-w-md flex items-center">
                  <RefreshCw className="h-4 w-4 text-blue-400 mr-2 animate-spin" />
                  <span className="text-gray-300">Ella is thinking...</span>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-700">
            <form onSubmit={handleSubmit} className="flex items-center">
              {voiceInputSupported && (
                <div className="relative mr-2">
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`p-3 rounded-full ${
                      isListening 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } transition-colors shadow-lg transform hover:scale-105 active:scale-95`}
                    title={isListening ? "Stop listening" : "Start voice input"}
                  >
                    {isListening ? (
                      <MicOff className="h-5 w-5 text-white" />
                    ) : (
                      <Mic className="h-5 w-5 text-white" />
                    )}
                  </button>
                  {!isListening && (
                    <span className="absolute -top-2 -right-2 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                    </span>
                  )}
                </div>
              )}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isListening ? "Listening..." : "Type your message..."}
                  className={`w-full bg-gray-700 text-white placeholder-gray-400 ${
                    voiceInputSupported ? 'rounded-l-md' : 'rounded-l-md'
                  } px-4 py-2 focus:outline-none ${
                    isListening ? 'animate-pulse border border-red-500' : ''
                  }`}
                  required
                  disabled={isListening}
                />
                {isListening && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="bg-[#0D82DA] hover:bg-blue-600 text-white px-4 py-2 rounded-r-md transition-colors"
                disabled={isListening}
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
