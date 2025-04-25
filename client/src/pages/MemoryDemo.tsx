import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from '../lib/queryClient';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  memoryMode: 'persistent' | 'stateless';
}

export default function MemoryDemo() {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [sessionId, setSessionId] = useState('');

  // Generate a unique session ID on component mount
  useEffect(() => {
    setSessionId(`memory_demo_${Date.now()}`);
  }, []);

  // Fetch available personas
  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const response = await apiRequest('GET', '/api/personas');
        const data = await response.json();
        
        if (data.success && data.personas) {
          setPersonas(data.personas);
          // Set default persona if available
          if (data.personas.length > 0) {
            setSelectedPersona(data.personas[0].id);
          }
        } else {
          throw new Error('Failed to get personas');
        }
      } catch (error) {
        console.error("Failed to fetch personas:", error);
        toast({
          title: "Error",
          description: "Failed to load personas. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    fetchPersonas();
  }, [toast]);

  // Handle selecting a new persona
  const handlePersonaChange = async (personaId: string) => {
    try {
      setLoading(true);
      // Set the session persona
      await apiRequest('POST', `/api/session/${sessionId}/persona`, {
        personaId
      });
      
      setSelectedPersona(personaId);
      
      // Get the messages for this session
      await fetchMessages();
      
      // Show success toast
      const persona = personas.find(p => p.id === personaId);
      toast({
        title: "Persona Changed",
        description: `Now chatting with ${persona?.name} (${persona?.memoryMode} memory)`,
      });
    } catch (error) {
      console.error("Failed to change persona:", error);
      toast({
        title: "Error",
        description: "Failed to change persona. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for the current session
  const fetchMessages = async () => {
    try {
      const response = await apiRequest('GET', `/api/session/${sessionId}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  // Send a message
  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;
    
    try {
      setLoading(true);
      
      // Add the user message locally
      const userMessage: ChatMessage = {
        id: `temp_${Date.now()}`,
        content: message,
        isUser: true,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      
      // Send the message to the API
      const response = await apiRequest('POST', `/api/session/${sessionId}/messages`, {
        content: userMessage.content,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }
      
      // Get the AI response
      await fetchMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset memory for the current session
  const handleResetMemory = async () => {
    try {
      setLoading(true);
      
      await apiRequest('DELETE', `/api/session/${sessionId}/messages`);
      
      // Clear messages locally
      setMessages([]);
      
      toast({
        title: "Memory Reset",
        description: "All messages have been cleared.",
      });
    } catch (error) {
      console.error("Failed to reset memory:", error);
      toast({
        title: "Error",
        description: "Failed to reset memory. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Memory Mode Demo</h1>
        <p className="text-muted-foreground mb-4">
          Test different memory modes to see how they affect conversation history.
        </p>
        
        <div className="bg-muted p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-2">How it works:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Stateless Memory</strong>: AI doesn't recall previous messages in this session. Perfect for cold calling.</li>
            <li><strong>Persistent Memory</strong>: AI remembers your entire conversation history. Ideal for ongoing relationships.</li>
          </ul>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Persona Selection */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Personas</CardTitle>
              <CardDescription>Select a persona to chat with</CardDescription>
            </CardHeader>
            <CardContent>
              {personas.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">Loading personas...</div>
              ) : (
                <div className="space-y-4">
                  {personas.map(persona => (
                    <div 
                      key={persona.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors
                        ${selectedPersona === persona.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
                      onClick={() => handlePersonaChange(persona.id)}
                    >
                      <div className="font-medium">{persona.name}</div>
                      <div className="text-sm text-muted-foreground">{persona.description}</div>
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          persona.memoryMode === 'stateless' 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {persona.memoryMode.toUpperCase()} MEMORY
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleResetMemory} 
                variant="outline" 
                className="w-full"
                disabled={loading}
              >
                Reset Memory
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Chat Interface */}
        <div className="md:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>
                {selectedPersona && personas.find(p => p.id === selectedPersona)?.name || 'Chat'}
                {selectedPersona && (
                  <span className="ml-2 text-sm font-normal">
                    ({personas.find(p => p.id === selectedPersona)?.memoryMode} memory)
                  </span>
                )}
              </CardTitle>
              <CardDescription>Session ID: {sessionId}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto">
              <div className="space-y-4 mb-4 min-h-[300px]">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No messages yet. Start a conversation!
                  </div>
                ) : (
                  messages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.isUser 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}
                      >
                        <div className="text-sm">{msg.content}</div>
                        <div className="text-xs mt-1 opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="flex w-full gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={loading}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!message.trim() || loading}
                >
                  Send
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}