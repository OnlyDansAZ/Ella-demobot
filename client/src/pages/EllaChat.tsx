import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Send, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';

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
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Speech recognition setup
  const startListening = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setIsListening(true);
      // In a real implementation, we would initialize the Web Speech API here
      
      // Simulating speech recognition for demo
      setTimeout(() => {
        setIsListening(false);
        setInputMessage('Tell me about the features of YoBot');
      }, 2000);
    } else {
      alert('Speech recognition is not supported in your browser');
    }
  };
  
  const stopListening = () => {
    setIsListening(false);
    // In a real implementation, we would stop the speech recognition here
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
          }))
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
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.volume = volume / 100;
        await audio.play();
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
  
  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 bg-blue-500 text-white mr-3">
            <span className="font-semibold text-lg">E</span>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">Ella</h1>
            <p className="text-sm text-muted-foreground">YoBot AI Assistant</p>
          </div>
        </div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      <div className="grid md:grid-cols-4 gap-6">
        {/* Main Chat Area - 3/4 width on desktop */}
        <div className="md:col-span-3">
          <Card className="border rounded-lg shadow-sm h-[70vh] flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.isUser
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-muted rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <div className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-muted-foreground'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 bg-muted rounded-bl-none">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Button
                  variant={isListening ? 'destructive' : 'outline'}
                  size="icon"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Input
                  ref={inputRef}
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isLoading || isListening}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={isLoading || !inputMessage.trim()}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-1">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Send className="h-4 w-4" />
                      <span>Send</span>
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Settings Panel - 1/4 width on desktop */}
        <div className="md:col-span-1">
          <Card className="border rounded-lg shadow-sm h-[70vh]">
            <CardContent className="p-4">
              <h2 className="font-semibold text-lg mb-4">Settings</h2>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="voice-toggle">Voice Output</Label>
                    <div className="flex items-center gap-2">
                      {isMuted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4" />}
                      <Switch 
                        id="voice-toggle" 
                        checked={!isMuted}
                        onCheckedChange={(checked) => setIsMuted(!checked)}
                      />
                    </div>
                  </div>
                  
                  {!isMuted && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="volume-slider">Volume</Label>
                        <span className="text-sm">{volume}%</span>
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
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Conversation Tips</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Ask about YoBot's features and capabilities</li>
                    <li>• Try scheduling commands like "Set up a meeting"</li>
                    <li>• Ask for tier comparisons</li>
                    <li>• Inquire about voice capabilities</li>
                    <li>• Test Ella's memory with follow-up questions</li>
                  </ul>
                </div>
                
                <Separator />
                
                <div className="text-xs text-muted-foreground">
                  <p>Using OpenAI GPT-4o and ElevenLabs voice synthesis.</p>
                  <p className="mt-1">Conversations are not stored permanently.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}