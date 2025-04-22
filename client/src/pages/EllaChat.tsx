import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Send, Volume2, VolumeX, ArrowLeft, User, Brain, Edit, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { predefinedPersonas, customPersonaTemplate } from '@/lib/personas';
import { ScheduleMeeting } from '@/components/ScheduleMeeting';
import { useCalendly } from '@/hooks/use-calendly';
import yobotLogo from "../assets/yobot-logo.png";
import yobotHeadLogo from "../assets/yobot-head-logo.png";
import yobotTransparentLogo from "../assets/yobot-transparent-logo.png";

// Define the structure for chat messages
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function EllaChat() {
  // State for managing the conversation
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm Ella, your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(80);
  
  // Scheduling state
  const [showCalendly, setShowCalendly] = useState(false);
  const { calendlyUrl, meetingTypes } = useCalendly();
  
  // Persona state
  const [selectedPersona, setSelectedPersona] = useState<string>("default");
  const [useCustomPersona, setUseCustomPersona] = useState(false);
  const [customPersonaText, setCustomPersonaText] = useState(customPersonaTemplate);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Speech recognition setup
  const recognitionRef = useRef<any>(null);
  
  useEffect(() => {
    // Initialize speech recognition when component mounts
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      // Set up event handlers
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    // Clean up on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
      }
    };
  }, []);
  
  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        alert('Failed to start speech recognition. Please try again.');
        setIsListening(false);
      }
    } else if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser');
    } else {
      alert('Speech recognition failed to initialize. Please refresh the page.');
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
    setIsListening(false);
  };
  
  // Function to send a message
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Create a new user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };
    
    // Add the user message to the chat
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Make the API call to get a response from Ella
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content
          })),
          persona: useCustomPersona ? null : selectedPersona,
          customPersonaPrompt: useCustomPersona ? customPersonaText : null
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Create a new bot message
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          isUser: false,
          timestamp: new Date()
        };
        
        // Add the bot message to the chat
        setMessages(prev => [...prev, botMessage]);
        
        // Check if the response contains Calendly booking references
        const lowerCaseResponse = data.response.toLowerCase();
        if (
          (lowerCaseResponse.includes('calendly') || 
           lowerCaseResponse.includes('schedule a meeting') || 
           lowerCaseResponse.includes('booking link') ||
           lowerCaseResponse.includes('book a time')) && 
          !showCalendly
        ) {
          // Get the calendly URL from the API
          try {
            const calendlyResponse = await fetch('/api/calendly/url');
            const calendlyData = await calendlyResponse.json();
            if (calendlyData.success && calendlyData.url) {
              setCalendlyUrl(calendlyData.url);
              setShowCalendly(true);
            }
          } catch (error) {
            console.error('Error fetching Calendly URL:', error);
          }
        }
        
        // If not muted, play the audio
        if (!isMuted) {
          playAudio(data.response);
        }
      } else {
        console.error('Failed to get response:', data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to play audio response
  const playAudio = async (text: string) => {
    try {
      // Process text on client side to also remove bullet points and asterisks
      // This is a second layer of defense in case server-side processing doesn't catch all
      const processedText = text
        .replace(/•\s*/g, "") // Remove bullet points
        .replace(/\*/g, "") // Remove asterisks completely
        .replace(/-\s+/g, "") // Remove hyphens at the start of lines
        .replace(/^\s*-\s*/gm, ""); // Remove hyphens at the start of each line in multiline text
      
      console.log("Original text:", text);
      console.log("Processed text for speech:", processedText);
      
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: processedText })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElement = new Audio(audioUrl);
        audioElement.volume = volume / 100;
        
        // Properly handle cleanup when audio finishes
        audioElement.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
        
        // Handle errors properly
        audioElement.onerror = (e) => {
          console.error('Audio playback error:', e);
          URL.revokeObjectURL(audioUrl);
        };
        
        // Use a more robust play mechanism with better error handling for mobile
        try {
          await audioElement.play();
        } catch (playError) {
          console.error('Failed to play audio - likely a mobile autoplay restriction:', playError);
          // Fallback to browser speech synthesis if available
          if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(processedText);
            utterance.volume = volume / 100;
            window.speechSynthesis.speak(utterance);
          }
        }
      } else {
        console.error('Failed to get speech:', await response.text());
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input on start
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // State for mobile settings panel
  const [showSettingsOnMobile, setShowSettingsOnMobile] = useState(false);

  return (
    <div className="max-w-5xl mx-auto p-1 sm:p-4">
      <div className="flex items-center justify-between mb-2 sm:mb-6">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mr-1 sm:mr-3 overflow-hidden p-0">
            <img src={yobotTransparentLogo} alt="YoBot Logo" className="h-full w-full object-contain" />
          </Avatar>
          <div>
            <h1 className="text-base sm:text-xl font-bold">Ella</h1>
            <p className="text-[10px] sm:text-sm text-muted-foreground">YoBot AI Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="md:hidden text-xs px-2 py-1 h-7"
            onClick={() => setShowSettingsOnMobile(!showSettingsOnMobile)}
          >
            {showSettingsOnMobile ? "Chat" : "Settings"}
          </Button>
          <Link href="/">
            <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid md:grid-cols-4 gap-2 sm:gap-6">
        {/* Main Chat Area - 3/4 width on desktop, hidden on mobile when settings are shown */}
        <div className={`md:col-span-3 ${showSettingsOnMobile ? 'hidden md:block' : 'block'}`}>
          <Card className="border rounded-lg shadow-sm h-[80vh] sm:h-[70vh] flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-1 sm:p-4">
              <div className="space-y-2 sm:space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[80%] rounded-lg p-1.5 sm:p-3 ${
                        message.isUser
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-muted rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-xs sm:text-base">{message.content}</p>
                      <div className={`text-[8px] sm:text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-muted-foreground'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[90%] sm:max-w-[80%] rounded-lg p-1.5 sm:p-3 bg-muted rounded-bl-none">
                      <div className="flex space-x-1 sm:space-x-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                {showCalendly && (
                  <div className="my-4 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs sm:text-sm font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        Schedule a Meeting
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        onClick={() => setShowCalendly(false)}
                      >
                        ✕
                      </Button>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">
                      Ella has detected you might want to schedule a meeting. Use the button below to open the scheduling page.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <ScheduleMeeting 
                        buttonText="Schedule Meeting"
                        buttonVariant="default"
                        calendlyUrl={calendlyUrl}
                        popupTitle="Select a time to meet"
                        size="md"
                      />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            
            <div className="p-1 sm:p-4 border-t">
              <div className="flex space-x-1 sm:space-x-2">
                <Button
                  variant={isListening ? 'destructive' : 'outline'}
                  size="icon"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading}
                  className="shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                >
                  {isListening ? <MicOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Mic className="h-3 w-3 sm:h-4 sm:w-4" />}
                </Button>
                <Input
                  ref={inputRef}
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isLoading || isListening}
                  className="flex-1 text-xs sm:text-base h-8 sm:h-10"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={isLoading || !inputMessage.trim()}
                  className="shrink-0 h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-1">
                      <div className="h-2 w-2 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="hidden sm:inline">Processing</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Send</span>
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Settings Panel - 1/4 width on desktop, full width on mobile when settings are shown */}
        <div className={`md:col-span-1 ${showSettingsOnMobile ? 'block' : 'hidden md:block'}`}>
          <Card className="border rounded-lg shadow-sm h-[80vh] sm:h-[70vh] overflow-y-auto">
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm sm:text-lg mb-2 sm:mb-4">Settings</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="md:hidden -mt-1 h-6 w-6 p-0"
                  onClick={() => setShowSettingsOnMobile(false)}
                >
                  <ArrowLeft className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-3 sm:space-y-6">
                <div className="space-y-1 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="voice-toggle" className="text-xs sm:text-base">Voice Output</Label>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {isMuted ? <VolumeX className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" /> : <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />}
                      <Switch 
                        id="voice-toggle" 
                        checked={!isMuted}
                        onCheckedChange={(checked) => setIsMuted(!checked)}
                      />
                    </div>
                  </div>
                  
                  {!isMuted && (
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="volume-slider" className="text-xs sm:text-sm">Volume</Label>
                        <span className="text-xs sm:text-sm">{volume}%</span>
                      </div>
                      <Slider
                        id="volume-slider"
                        min={0}
                        max={100}
                        step={1}
                        value={[volume]}
                        onValueChange={(value) => setVolume(value[0])}
                      />
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Persona Settings Section */}
                <div className="space-y-2 sm:space-y-4">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                    <h3 className="text-xs sm:text-sm font-medium">Ella's Persona</h3>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Predefined persona selector */}
                    <div className={useCustomPersona ? "opacity-50" : ""}>
                      <Label htmlFor="persona-select" className="text-[10px] sm:text-xs mb-1 block">
                        Select Predefined Persona
                      </Label>
                      <Select 
                        value={selectedPersona} 
                        onValueChange={setSelectedPersona}
                        disabled={useCustomPersona}
                      >
                        <SelectTrigger id="persona-select" className="text-[10px] sm:text-xs h-7 sm:h-9">
                          <SelectValue placeholder="Choose persona" />
                        </SelectTrigger>
                        <SelectContent>
                          {predefinedPersonas.map(persona => (
                            <SelectItem 
                              key={persona.id} 
                              value={persona.id}
                              className="text-[10px] sm:text-xs"
                            >
                              {persona.name} - {persona.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Toggle for custom persona */}
                    <div className="flex items-center justify-between mt-2">
                      <Label htmlFor="custom-persona-toggle" className="text-[10px] sm:text-xs flex items-center gap-1">
                        <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Use Custom Persona
                      </Label>
                      <Switch 
                        id="custom-persona-toggle"
                        checked={useCustomPersona}
                        onCheckedChange={setUseCustomPersona}
                      />
                    </div>
                    
                    {/* Custom persona text area */}
                    {useCustomPersona && (
                      <div className="mt-2">
                        <Label htmlFor="custom-persona-text" className="text-[10px] sm:text-xs mb-1 block">
                          Custom Persona Instructions
                        </Label>
                        <Textarea 
                          id="custom-persona-text"
                          value={customPersonaText}
                          onChange={(e) => setCustomPersonaText(e.target.value)}
                          placeholder="Describe how Ella should behave..."
                          className="text-[10px] sm:text-xs min-h-[100px] resize-none"
                        />
                        <p className="text-[8px] sm:text-[10px] text-muted-foreground mt-1">
                          These instructions will override Ella's default personality.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-[10px] sm:text-sm font-medium mb-1 sm:mb-2">Conversation Tips</h3>
                  <ul className="text-[10px] sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-2">
                    <li>• Ask about YoBot's features</li>
                    <li>• Try scheduling commands</li>
                    <li>• Ask for tier comparisons</li>
                    <li>• Ask about voice capabilities</li>
                    <li>• Test Ella's memory</li>
                  </ul>
                </div>
                
                <Separator />
                
                <div className="text-[8px] sm:text-xs text-muted-foreground">
                  <p>Using OpenAI GPT-4o and ElevenLabs.</p>
                  <p className="mt-1">Conversations are not stored.</p>
                  
                  <div className="md:hidden mt-3">
                    <Link href="/">
                      <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1 text-xs h-7 py-0">
                        <ArrowLeft className="h-3 w-3" />
                        Back to Home
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}