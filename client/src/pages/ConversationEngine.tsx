import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { ConversationTooltip } from '@/components/ConversationTooltip';

// Recommendation engine types
interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

interface ConversationStage {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface ResponseSuggestion {
  id: string;
  text: string;
  reasoning: string;
  keywords: string[];
  stage: string;
  confidence: number;
}

// Sample data
const conversationStages: ConversationStage[] = [
  { 
    id: 'introduction', 
    name: 'Introduction', 
    description: 'Building rapport and establishing connection',
    color: 'bg-blue-500' 
  },
  { 
    id: 'discovery', 
    name: 'Discovery', 
    description: 'Understanding needs and pain points',
    color: 'bg-purple-500' 
  },
  { 
    id: 'presentation', 
    name: 'Presentation', 
    description: 'Presenting solutions and benefits',
    color: 'bg-green-500' 
  },
  { 
    id: 'objection', 
    name: 'Objection Handling', 
    description: 'Addressing concerns and objections',
    color: 'bg-orange-500' 
  },
  { 
    id: 'closing', 
    name: 'Closing', 
    description: 'Moving toward commitment or next steps',
    color: 'bg-red-500' 
  }
];

export default function ConversationEngine() {
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [currentStage, setCurrentStage] = useState<string>('introduction');
  const [suggestions, setSuggestions] = useState<ResponseSuggestion[]>([]);
  const [analysisMode, setAnalysisMode] = useState<'strategic' | 'tactical'>('strategic');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Generate suggestions based on conversation
  useEffect(() => {
    if (conversation.length === 0) return;
    
    const lastUserMessage = [...conversation].reverse().find(msg => msg.isUser);
    if (!lastUserMessage) return;
    
    // Simulate AI analysis
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const newSuggestions = generateSuggestions(lastUserMessage.content, currentStage);
      setSuggestions(newSuggestions);
      setIsAnalyzing(false);
    }, 1000);
  }, [conversation, currentStage]);

  // Generate realistic suggestions based on message content and stage
  const generateSuggestions = (userMessage: string, stage: string): ResponseSuggestion[] => {
    const lowercaseMessage = userMessage.toLowerCase();
    
    // Example suggestions based on stage
    const stageSuggestions: Record<string, ResponseSuggestion[]> = {
      'introduction': [
        {
          id: '1',
          text: "Hello! Thank you for your interest in our AI sales assistant. Could you tell me a bit about your business needs?",
          reasoning: "Open with a friendly greeting and ask about needs",
          keywords: ["hello", "interest", "sales", "assistant"],
          stage: "introduction",
          confidence: 0.95
        },
        {
          id: '2',
          text: "I'd be happy to provide more information about our product. What aspects are you most interested in learning about?",
          reasoning: "Focus on providing information based on specific interests",
          keywords: ["information", "product", "interested"],
          stage: "introduction",
          confidence: 0.88
        }
      ],
      'discovery': [
        {
          id: '3',
          text: "It sounds like you're facing challenges with scaling your sales outreach. How has this impacted your business growth?",
          reasoning: "Explore the impact of their challenge",
          keywords: ["challenges", "scaling", "outreach", "impact"],
          stage: "discovery",
          confidence: 0.92
        },
        {
          id: '4',
          text: "I'm curious to know more about your current process. What tools are you currently using for sales outreach?",
          reasoning: "Understand current solutions to position our product",
          keywords: ["process", "tools", "current", "using"],
          stage: "discovery",
          confidence: 0.87
        }
      ],
      'presentation': [
        {
          id: '5',
          text: "Our AI sales assistant is designed to handle the entire sales process, from initial contact to closing. For businesses like yours, this typically results in a 40% increase in qualified leads.",
          reasoning: "Present key value proposition with specific results",
          keywords: ["designed", "entire", "process", "increase"],
          stage: "presentation",
          confidence: 0.93
        },
        {
          id: '6',
          text: "What sets our solution apart is the natural, human-like conversations it can conduct. Would you like to hear a sample of how it sounds?",
          reasoning: "Highlight key differentiator with offer to demonstrate",
          keywords: ["sets apart", "natural", "human-like", "sample"],
          stage: "presentation",
          confidence: 0.91
        }
      ],
      'objection': [
        {
          id: '7',
          text: "That's a valid concern about pricing. Many of our clients initially felt the same way, but found that the ROI becomes positive within the first 3 months. Would it help to see a breakdown of the expected return?",
          reasoning: "Acknowledge pricing concern and reframe as investment with ROI",
          keywords: ["concern", "pricing", "ROI", "return"],
          stage: "objection",
          confidence: 0.94
        },
        {
          id: '8',
          text: "I understand your hesitation about implementation. We've designed our onboarding process to be as smooth as possible, typically taking less than a week. Would you like to hear how we supported a similar company through this process?",
          reasoning: "Address implementation concerns with social proof",
          keywords: ["hesitation", "implementation", "onboarding", "process"],
          stage: "objection",
          confidence: 0.89
        }
      ],
      'closing': [
        {
          id: '9',
          text: "Based on what you've shared, I think our Pro package would be the best fit. Would you like to schedule a personalized demo to see exactly how it would work for your team?",
          reasoning: "Recommend specific solution and suggest next step",
          keywords: ["based on", "best fit", "demo", "schedule"],
          stage: "closing",
          confidence: 0.96
        },
        {
          id: '10',
          text: "It sounds like you're interested in moving forward. What would be the best way to introduce this to the rest of your decision-making team?",
          reasoning: "Assume interest and explore decision-making process",
          keywords: ["interested", "moving forward", "decision-making", "team"],
          stage: "closing",
          confidence: 0.92
        }
      ]
    };
    
    // Return suggestions for the current stage
    // In a real implementation, we would match based on message content
    return stageSuggestions[stage] || [];
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date().toISOString()
    };
    
    // Add user message
    setConversation([...conversation, newUserMessage]);
    setMessage('');
    
    // Simulate AI response after delay
    setTimeout(() => {
      let aiResponse = "";
      
      // If there's a suggestion, use the top one
      if (suggestions.length > 0) {
        aiResponse = suggestions[0].text;
      } else {
        // Fallback responses based on stage
        const fallbacks: Record<string, string> = {
          introduction: "Thanks for sharing that! I'd love to learn more about your specific needs. Could you tell me about the challenges you're facing?",
          discovery: "I appreciate that insight. How has this issue affected your team's productivity or results?",
          presentation: "Based on what you've shared, I think our AI-powered solution would be a great fit because it addresses your specific needs around communication efficiency.",
          objection: "That's a fair concern. Many of our clients initially thought the same, but they found the implementation much smoother than expected.",
          closing: "Given our discussion, would you be interested in seeing a personalized demo of how this would work in your environment?"
        };
        
        aiResponse = fallbacks[currentStage] || "I understand. Can you tell me more about that?";
      }
      
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date().toISOString()
      };
      
      setConversation(prev => [...prev, aiMessage]);
    }, 1500);
  };

  const advanceStage = (newStage: string) => {
    setCurrentStage(newStage);
    // Show guidance tooltip when stage changes
    setShowTooltip(true);
    
    // Auto-hide tooltip after 8 seconds
    setTimeout(() => {
      setShowTooltip(false);
    }, 8000);
  };
  
  // Auto-scroll to the bottom of the conversation
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);
  
  // Show tooltip when changing analysis mode
  useEffect(() => {
    // Show guidance tooltip when analysis mode changes
    setShowTooltip(true);
    
    // Auto-hide tooltip after 8 seconds
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 8000);
    
    return () => clearTimeout(timer);
  }, [analysisMode]);

  // Use a suggestion as response
  const useSuggestion = (suggestion: ResponseSuggestion) => {
    const aiMessage: ChatMessage = {
      id: Date.now().toString(),
      content: suggestion.text,
      isUser: false,
      timestamp: new Date().toISOString()
    };
    
    setConversation(prev => [...prev, aiMessage]);
  };

  return (
    <div className="container py-8">
      <Card className="mb-4">
        <CardHeader className="bg-slate-800 text-white">
          <CardTitle className="text-2xl flex items-center">
            <span className="mr-2">🧠</span>
            Smart Conversation Recommendation Engine
          </CardTitle>
          <CardDescription className="text-slate-300">
            Analyze conversations and generate intelligent response suggestions
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Conversation Stages */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Flow</CardTitle>
              <CardDescription>Track the sales conversation journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {conversationStages.map((stage) => (
                  <div
                    key={stage.id}
                    className={`p-3 border rounded-lg cursor-pointer hover:shadow-sm transition-all ${
                      currentStage === stage.id 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => advanceStage(stage.id)}
                  >
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full ${stage.color} mr-2 flex items-center justify-center`}>
                        {currentStage === stage.id && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="font-medium">{stage.name}</div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{stage.description}</div>
                    {currentStage === stage.id && (
                      <Badge variant="outline" className="mt-2 bg-primary/10">Current Stage</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Analysis Mode</CardTitle>
              <CardDescription>Choose analysis approach</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-b pb-2">
                <div className="flex space-x-1 p-1 bg-slate-100 rounded-lg">
                  <button 
                    className={`px-3 py-2 text-sm flex-1 rounded-md border transition-all ${
                      analysisMode === 'strategic' 
                        ? 'bg-blue-600 text-white font-medium shadow border-blue-700' 
                        : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                    }`}
                    onClick={() => setAnalysisMode('strategic')}
                  >
                    <div className="flex items-center justify-center">
                      {analysisMode === 'strategic' && (
                        <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      Strategic
                    </div>
                  </button>
                  <button 
                    className={`px-3 py-2 text-sm flex-1 rounded-md border transition-all ${
                      analysisMode === 'tactical' 
                        ? 'bg-blue-600 text-white font-medium shadow border-blue-700' 
                        : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                    }`}
                    onClick={() => setAnalysisMode('tactical')}
                  >
                    <div className="flex items-center justify-center">
                      {analysisMode === 'tactical' && (
                        <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      Tactical
                    </div>
                  </button>
                </div>
              </div>
              <div className="pt-4">
                {analysisMode === 'strategic' ? (
                  <div className="text-sm text-muted-foreground">
                    Focuses on long-term goals and relationship building. Provides suggestions aimed at understanding needs and building trust.
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Emphasizes immediate actions and overcoming objections. Suggestions are more direct and focused on advancing the sale.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Middle Column: Chat Interface */}
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Conversation Simulator</CardTitle>
              <CardDescription>Test different approaches and analyze responses</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto">
              <div className="h-[400px] pr-4 overflow-y-auto">
                <div className="space-y-4">
                  {conversation.length === 0 ? (
                    <div className="flex flex-col items-center py-8">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">💬</span>
                      </div>
                      
                      <div className="text-lg font-medium text-slate-800 mb-2">
                        Start a conversation
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-8 text-center max-w-xs">
                        Type a message or try one of these conversation starters to see how the recommendation engine works
                      </div>
                      
                      <div className="space-y-2 w-full max-w-sm">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full justify-start text-left"
                          onClick={() => {
                            setMessage("Hello! I'm interested in learning more about your AI sales assistant.");
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                        >
                          <span className="mr-2">👋</span> Hello! I'm interested in learning more about your AI sales assistant.
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="w-full justify-start text-left"
                          onClick={() => {
                            setMessage("We're struggling with scaling our sales outreach. Can your solution help?");
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                        >
                          <span className="mr-2">🔍</span> We're struggling with scaling our sales outreach. Can your solution help?
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="w-full justify-start text-left"
                          onClick={() => {
                            setMessage("What makes your AI different from other solutions on the market?");
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                        >
                          <span className="mr-2">🤔</span> What makes your AI different from other solutions on the market?
                        </Button>
                      </div>
                    </div>
                  ) : (
                    conversation.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} mb-4`}
                      >
                        <div className="flex items-start gap-2 max-w-[80%]">
                          {!msg.isUser && (
                            <div className="h-8 w-8 mt-1 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">
                              AI
                            </div>
                          )}
                          <div 
                            className={`rounded-lg px-4 py-2 ${
                              msg.isUser 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}
                          >
                            <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                            <div className="text-xs mt-1 opacity-70">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          {msg.isUser && (
                            <div className="h-8 w-8 mt-1 rounded-full bg-slate-600 text-white flex items-center justify-center text-xs font-medium">
                              You
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                >
                  Send
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Right Column: Recommendation Engine */}
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              <CardTitle>Response Recommendations</CardTitle>
              <CardDescription>AI-generated suggestions based on context</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-grow overflow-auto">
              <div className="h-[400px] pr-4 overflow-y-auto">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    <div className="mt-4 text-sm text-muted-foreground">Analyzing conversation context...</div>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="space-y-4">
                    {suggestions.map((suggestion) => (
                      <div 
                        key={suggestion.id}
                        className="p-4 border rounded-lg hover:shadow-sm transition-all cursor-pointer"
                        onClick={() => useSuggestion(suggestion)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <Badge variant="outline" className={`
                            ${suggestion.confidence > 0.9 ? 'bg-green-100 text-green-800 border-green-200' : 
                              suggestion.confidence > 0.8 ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                              'bg-yellow-100 text-yellow-800 border-yellow-200'}
                          `}>
                            {Math.round(suggestion.confidence * 100)}% Match
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 text-xs hover:bg-primary hover:text-primary-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              useSuggestion(suggestion);
                            }}
                          >
                            Use Response
                          </Button>
                        </div>
                        
                        <div className="text-sm font-medium mb-3 leading-relaxed">{suggestion.text}</div>
                        
                        <div className="text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded-md">
                          <span className="font-medium text-slate-700">Reasoning:</span> {suggestion.reasoning}
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {suggestion.keywords.map((keyword, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl">🔍</span>
                    </div>
                    <div className="text-lg font-medium text-slate-800 mb-2">
                      Waiting for conversation
                    </div>
                    <div className="text-sm text-muted-foreground max-w-xs">
                      Begin a conversation in the simulator to see AI-generated response recommendations appear here
                    </div>
                    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                        <span>High confidence</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                        <span>Medium confidence</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
                        <span>Low confidence</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t">
              {suggestions.length > 0 && (
                <div className="text-xs text-muted-foreground w-full text-center">
                  Recommendations based on {analysisMode} analysis approach for the <span className="font-medium">{
                    conversationStages.find(s => s.id === currentStage)?.name
                  }</span> stage
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}