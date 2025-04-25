import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from '../lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';

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

// For simulating opposite memory mode in the demo
interface MemoryModeOverride {
  personaId: string;
  overrideMode: 'persistent' | 'stateless';
}

export default function MemoryDemo() {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [sessionId, setSessionId] = useState('');
  const [memoryOverride, setMemoryOverride] = useState<MemoryModeOverride | null>(null);

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
      
      // Reset any memory mode override when changing persona
      setMemoryOverride(null);
      
      // Set the session persona
      const response = await apiRequest('POST', `/api/session/${sessionId}/persona`, {
        personaId
      });
      
      if (!response.ok) {
        throw new Error(`Failed to change persona: ${response.status}`);
      }
      
      setSelectedPersona(personaId);
      
      // Clear messages to start fresh
      setMessages([]);
      
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
      // If we have a memory mode override, include it in the request
      const queryParams = memoryOverride && memoryOverride.personaId === selectedPersona
        ? `?memoryModeOverride=${memoryOverride.overrideMode}`
        : '';
      
      const response = await apiRequest('GET', `/api/session/${sessionId}/messages${queryParams}`);
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
      
      // Prepare request payload
      const requestPayload: any = {
        content: userMessage.content,
      };
      
      // If we have a memory mode override for the current persona, add it to the request
      if (memoryOverride && memoryOverride.personaId === selectedPersona) {
        requestPayload.memoryModeOverride = memoryOverride.overrideMode;
      }
      
      // Send the message to the API with optional memory mode override
      const response = await apiRequest('POST', `/api/session/${sessionId}/messages`, requestPayload);
      
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
  
  // Toggle memory mode for demo purposes
  const toggleMemoryMode = () => {
    if (!selectedPersona) return;
    
    const currentPersona = personas.find(p => p.id === selectedPersona);
    if (!currentPersona) return;
    
    // If we already have an override, remove it
    if (memoryOverride && memoryOverride.personaId === selectedPersona) {
      setMemoryOverride(null);
      // Clear messages when toggling to demonstrate the effect
      setMessages([]);
      
      toast({
        title: "Memory Mode Reset",
        description: `Reverted to original ${currentPersona.memoryMode} memory mode.`,
      });
      return;
    }
    
    // Create an override with the opposite memory mode
    const oppositeMode = currentPersona.memoryMode === 'persistent' ? 'stateless' : 'persistent';
    setMemoryOverride({
      personaId: selectedPersona,
      overrideMode: oppositeMode
    });
    
    // Clear messages when switching to demonstrate the effect
    setMessages([]);
    
    toast({
      title: "Memory Mode Changed",
      description: `Switched from ${currentPersona.memoryMode} to ${oppositeMode} memory mode for demo purposes.`,
    });
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
                  {personas.map((persona, index) => (
                    <motion.div 
                      key={persona.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors
                        ${selectedPersona === persona.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
                      onClick={() => handlePersonaChange(persona.id)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: index * 0.05, 
                        duration: 0.3,
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                      }}
                      whileHover={{ 
                        scale: 1.02, 
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)" 
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="font-medium">{persona.name}</div>
                      <div className="text-sm text-muted-foreground">{persona.description}</div>
                      <div className="mt-1">
                        {/* Memory mode badge */}
                        <motion.span 
                          className={`text-xs px-2 py-1 rounded-full inline-block ${
                            // Show override memory mode if applicable
                            (memoryOverride && memoryOverride.personaId === persona.id)
                              ? (memoryOverride.overrideMode === 'stateless' 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : 'bg-green-100 text-green-800')
                              : (persona.memoryMode === 'stateless' 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : 'bg-green-100 text-green-800')
                          }`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.05 + 0.2, duration: 0.2 }}
                        >
                          {/* Show override memory mode if applicable */}
                          {memoryOverride && memoryOverride.personaId === persona.id 
                            ? `${memoryOverride.overrideMode.toUpperCase()} MEMORY (DEMO)`
                            : `${persona.memoryMode.toUpperCase()} MEMORY`
                          }
                        </motion.span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={handleResetMemory} 
                  variant="outline" 
                  className="w-full group relative overflow-hidden"
                  disabled={loading}
                >
                  <motion.span 
                    className="absolute inset-0 bg-red-100/40"
                    initial={{ y: "100%" }}
                    whileHover={{ y: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.span className="relative z-10 flex items-center justify-center">
                    <motion.span 
                      className="mr-2"
                      whileHover={{ rotate: -180 }}
                      transition={{ duration: 0.3 }}
                    >
                      🗑️
                    </motion.span>
                    Reset Memory
                  </motion.span>
                </Button>
              </motion.div>
              
              {/* Toggle Memory Mode Button - For Demo Purposes */}
              {selectedPersona && (
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    onClick={toggleMemoryMode}
                    variant={memoryOverride && memoryOverride.personaId === selectedPersona ? "default" : "secondary"}
                    className="w-full relative overflow-hidden"
                    disabled={loading}
                    size="sm"
                  >
                    <motion.span 
                      className="mr-2 inline-block"
                      animate={{ rotate: memoryOverride && memoryOverride.personaId === selectedPersona ? 360 : 0 }}
                      transition={{ duration: 0.5, type: "spring" }}
                    >
                      🔄
                    </motion.span>
                    {memoryOverride && memoryOverride.personaId === selectedPersona
                      ? "Revert Memory Mode"
                      : "Toggle Memory Mode (Demo)"
                    }
                    <motion.span 
                      className="absolute bottom-0 left-0 h-0.5 bg-primary" 
                      initial={{ width: "0%" }}
                      animate={{ width: memoryOverride && memoryOverride.personaId === selectedPersona ? "100%" : "0%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </Button>
                </motion.div>
              )}
              {selectedPersona && (
                <motion.div 
                  className="text-xs text-center text-muted-foreground mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p>Demo feature: Switch between memory modes with the same persona</p>
                </motion.div>
              )}
            </CardFooter>
          </Card>
        </div>
        
        {/* Chat Interface */}
        <div className="md:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedPersona || 'empty'}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardTitle className="flex items-center">
                    {selectedPersona && personas.find(p => p.id === selectedPersona)?.name || 'Chat'}
                    {selectedPersona && (
                      <motion.span 
                        className={`ml-2 text-sm font-normal px-2 py-1 rounded-full ${
                          // Color the memory mode tag appropriately
                          memoryOverride && memoryOverride.personaId === selectedPersona
                            ? (memoryOverride.overrideMode === 'stateless' 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-green-100 text-green-800')
                            : (personas.find(p => p.id === selectedPersona)?.memoryMode === 'stateless'
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-green-100 text-green-800')
                        }`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.2 }}
                      >
                        {memoryOverride && memoryOverride.personaId === selectedPersona
                          ? `${memoryOverride.overrideMode.toUpperCase()} MEMORY (DEMO)` 
                          : `${personas.find(p => p.id === selectedPersona)?.memoryMode.toUpperCase()} MEMORY`
                        }
                      </motion.span>
                    )}
                  </CardTitle>
                </motion.div>
              </AnimatePresence>
              <CardDescription>Session ID: {sessionId}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto">
              <div className="space-y-4 mb-4 min-h-[300px]">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center py-8">
                    <div className="text-muted-foreground mb-6">
                      No messages yet. Start a conversation!
                    </div>
                    
                    <motion.div 
                      className="text-sm text-muted-foreground mb-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Try these conversation starters:
                    </motion.div>
                    <div className="flex flex-wrap gap-2 justify-center max-w-md">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                      >
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setMessage("Hello! What's your name?");
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                          className="relative overflow-hidden group"
                        >
                          <span className="relative z-10">What's your name?</span>
                          <motion.span 
                            className="absolute inset-0 bg-primary/10 rounded" 
                            initial={{ x: '-100%' }}
                            whileHover={{ x: 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        </Button>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                      >
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setMessage("Can you remember what we talked about earlier?");
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                          className="relative overflow-hidden group"
                        >
                          <span className="relative z-10">Remember our conversation?</span>
                          <motion.span 
                            className="absolute inset-0 bg-primary/10 rounded" 
                            initial={{ x: '-100%' }}
                            whileHover={{ x: 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        </Button>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.3 }}
                      >
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setMessage("Schedule a demo for me next week");
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                          className="relative overflow-hidden group"
                        >
                          <span className="relative z-10">Schedule a demo</span>
                          <motion.span 
                            className="absolute inset-0 bg-primary/10 rounded" 
                            initial={{ x: '-100%' }}
                            whileHover={{ x: 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <motion.div 
                      key={msg.id} 
                      className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: index * 0.1,
                        duration: 0.3, 
                        type: "spring",
                        stiffness: 500,
                        damping: 25
                      }}
                    >
                      <motion.div 
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.isUser 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-sm">{msg.content}</div>
                        <div className="text-xs mt-1 opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </motion.div>
                    </motion.div>
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
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!message.trim() || loading}
                    className="relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center">
                      Send
                      <motion.span 
                        className="ml-1 inline-block"
                        initial={{ x: -5, opacity: 0 }}
                        animate={{ 
                          x: message.trim() ? 0 : -5, 
                          opacity: message.trim() ? 1 : 0 
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        →
                      </motion.span>
                    </span>
                    <motion.span 
                      className="absolute bottom-0 left-0 h-1 bg-primary/20" 
                      initial={{ width: "0%" }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.2 }}
                    />
                  </Button>
                </motion.div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}