import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
// Using a simple div with overflow instead of ScrollArea component
// import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';

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

  // Generate suggestions based on conversation
  useEffect(() => {
    if (conversation.length === 0) return;
    
    const lastUserMessage = [...conversation].reverse().find(msg => msg.isUser);
    if (!lastUserMessage) return;
    
    // Simulate AI analysis
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const newSuggestions = generateSuggestions(lastUserMessage.content, currentStage, conversation);
      setSuggestions(newSuggestions);
      setIsAnalyzing(false);
    }, 1000);
  }, [conversation, currentStage]);

  // Generate realistic suggestions based on message content and stage
  const generateSuggestions = (userMessage: string, stage: string, convo: ChatMessage[]): ResponseSuggestion[] => {
    const lowercaseMessage = userMessage.toLowerCase();
    
    // Detection patterns with corresponding suggestions based on conversation stage
    const patterns: Record<string, any> = {
      introduction: {
        pricing: {
          keywords: ['price', 'cost', 'expensive', 'affordable', 'pricing'],
          suggestions: [
            { 
              text: "I'd be happy to discuss our pricing options! Before I do, can you tell me a bit about what you're looking for so I can recommend the most suitable package?", 
              reasoning: "Deflect early price objection by gathering needs first",
              confidence: 0.92
            },
            { 
              text: "Our plans start at $5,000 for our Starter package, which many of our clients find to be an excellent value. Would you like me to walk you through what's included?",
              reasoning: "Address price question directly but focus on value",
              confidence: 0.86
            }
          ]
        },
        greeting: {
          keywords: ['hi', 'hello', 'hey', 'morning', 'afternoon'],
          suggestions: [
            { 
              text: "Hello! It's great to connect with you today. I'm Ella, an AI sales assistant. What brings you to explore YoBot's services?", 
              reasoning: "Warm greeting with open-ended question",
              confidence: 0.95
            },
            { 
              text: "Hi there! Thanks for reaching out. I'd love to learn more about your business and how we might be able to help. Could you tell me a bit about your company?",
              reasoning: "Friendly introduction with business focus",
              confidence: 0.92
            }
          ]
        }
      },
      discovery: {
        problems: {
          keywords: ['struggle', 'challenge', 'difficult', 'issue', 'problem'],
          suggestions: [
            { 
              text: "That sounds challenging. Can you tell me more about how this issue is affecting your business operations or sales results?", 
              reasoning: "Explore impact of pain point",
              confidence: 0.94
            },
            { 
              text: "I understand that challenge. Many of our clients faced similar issues before implementing our solution. How long has this been a problem for your team?",
              reasoning: "Empathize and establish timeline",
              confidence: 0.91
            }
          ]
        },
        goals: {
          keywords: ['want', 'looking for', 'goal', 'achieve', 'improve'],
          suggestions: [
            { 
              text: "That's a great goal. If you were to achieve this, what would the impact be on your business in terms of revenue or efficiency?", 
              reasoning: "Quantify potential value",
              confidence: 0.93
            },
            { 
              text: "I appreciate you sharing that goal. On a scale of 1-10, how important is solving this particular challenge compared to other priorities?",
              reasoning: "Assess priority level",
              confidence: 0.88
            }
          ]
        }
      },
      presentation: {
        features: {
          keywords: ['feature', 'capability', 'can it', 'does it', 'how does'],
          suggestions: [
            { 
              text: "Yes, YoBot includes that capability! Let me explain how it works and the specific benefits you'll experience based on what you've shared about your needs.", 
              reasoning: "Confirm feature with personalized benefits",
              confidence: 0.96
            },
            { 
              text: "That's a great question about our features. YoBot's technology handles that through our AI-powered conversation engine, which means you'll be able to [specific benefit tied to their needs].",
              reasoning: "Technical explanation with benefit bridge",
              confidence: 0.90
            }
          ]
        },
        comparison: {
          keywords: ['compare', 'other', 'competitor', 'different', 'versus'],
          suggestions: [
            { 
              text: "Unlike other solutions that [limitation], YoBot is specifically designed to [advantage]. Based on what you've shared, this would be particularly valuable for your situation because [personalized reason].", 
              reasoning: "Differentiate with personalized relevance",
              confidence: 0.92
            },
            { 
              text: "That's a great question. While other options in the market focus on [competitor approach], we've taken a different approach by [unique approach]. Our clients particularly value this because [specific outcome].",
              reasoning: "Highlight unique approach and outcomes",
              confidence: 0.89
            }
          ]
        }
      },
      objection: {
        time: {
          keywords: ['not ready', 'too soon', 'later', 'not now', 'timing'],
          suggestions: [
            { 
              text: "I understand timing is important. Many of our clients felt the same way initially, but found that implementing sooner actually [benefit]. What specific concerns do you have about the timing?", 
              reasoning: "Acknowledge, counter with benefit, explore deeper",
              confidence: 0.94
            },
            { 
              text: "I appreciate your perspective on timing. Would it be helpful if I shared how other companies in similar situations managed the implementation process to minimize disruption?",
              reasoning: "Respect objection and offer social proof",
              confidence: 0.91
            }
          ]
        },
        budget: {
          keywords: ['expensive', 'cost', 'budget', 'afford', 'investment'],
          suggestions: [
            { 
              text: "I understand budget considerations are important. When our clients evaluate the cost, they typically find that the ROI becomes positive within [timeframe] through [specific savings or revenue]. How does that align with your expectations?", 
              reasoning: "Reframe as investment with ROI timeline",
              confidence: 0.95
            },
            { 
              text: "That's a fair concern. Would it be helpful to explore some of our flexible payment options that have helped other businesses implement our solution within their budget constraints?",
              reasoning: "Acknowledge and offer alternatives",
              confidence: 0.90
            }
          ]
        }
      },
      closing: {
        interest: {
          keywords: ['interested', 'sounds good', 'next steps', 'move forward', 'learn more'],
          suggestions: [
            { 
              text: "I'm glad to hear you're interested! The next step would be a personalized demo with our implementation specialist. I have availability this Thursday or Friday - which would work better for your schedule?", 
              reasoning: "Assume close with specific options",
              confidence: 0.96
            },
            { 
              text: "That's great to hear! Based on what we've discussed, I'd recommend starting with our [appropriate package] plan. Would you like me to prepare a detailed proposal for you to review?",
              reasoning: "Specific recommendation with action step",
              confidence: 0.93
            }
          ]
        },
        hesitation: {
          keywords: ['think about', 'consider', 'not sure', 'maybe', 'possibly'],
          suggestions: [
            { 
              text: "I understand you'd like to consider this further. To help with your decision, what specific information would be most useful for you to have at this point?", 
              reasoning: "Respect decision while identifying specific needs",
              confidence: 0.92
            },
            { 
              text: "That makes sense. Many of our clients wanted time to consider before moving forward. What I've found helpful is to schedule a brief follow-up call next week - would Tuesday or Wednesday work for you?",
              reasoning: "Normalize hesitation while maintaining momentum",
              confidence: 0.89
            }
          ]
        }
      }
    };
    
    // Get the patterns for current stage
    const stagePatterns = patterns[stage] || {};
    let matchedSuggestions: ResponseSuggestion[] = [];
    
    // Find matching patterns in the user message
    Object.entries(stagePatterns).forEach(([category, data]: [string, any]) => {
      const { keywords, suggestions } = data;
      
      // Check if any keywords match
      const matches = keywords.some((keyword: string) => lowercaseMessage.includes(keyword));
      
      if (matches) {
        // Add suggestions from this category
        suggestions.forEach((sugg: { text: string, reasoning: string, confidence: number }) => {
          matchedSuggestions.push({
            id: Math.random().toString(36).substring(2, 9),
            text: sugg.text,
            reasoning: sugg.reasoning,
            keywords: keywords,
            stage: stage,
            confidence: sugg.confidence
          });
        });
      }
    });
    
    // If no matches, provide generic suggestions based on stage
    if (matchedSuggestions.length === 0) {
      const genericSuggestions = {
        introduction: [
          {
            text: "I'd love to learn more about your business and the challenges you're currently facing. Could you tell me a bit about your role and what you're looking to accomplish?",
            reasoning: "Open-ended discovery question",
            keywords: ["business", "challenges", "role"],
            confidence: 0.88
          },
          {
            text: "Thanks for connecting! I'm curious - what prompted you to explore AI sales assistant solutions at this time?",
            reasoning: "Identify trigger event",
            keywords: ["timing", "explore", "solutions"],
            confidence: 0.85
          }
        ],
        discovery: [
          {
            text: "Based on what you've shared, it sounds like [summarize key pain point]. Is that accurate? And how has this affected your team's performance?",
            reasoning: "Confirm understanding and explore impact",
            keywords: ["accurate", "affected", "performance"],
            confidence: 0.87
          },
          {
            text: "That's helpful context. If you could wave a magic wand and solve any aspect of this challenge instantly, which part would you tackle first?",
            reasoning: "Identify highest priority need",
            keywords: ["solve", "challenge", "priority"],
            confidence: 0.83
          }
        ],
        presentation: [
          {
            text: "Given what you've shared about [specific need], I think our [relevant feature] would be particularly valuable for you because [personalized benefit].",
            reasoning: "Personalized feature-benefit connection",
            keywords: ["feature", "valuable", "benefit"],
            confidence: 0.89
          },
          {
            text: "Many companies in your industry have seen [specific result] after implementing YoBot. For example, [brief case study example] achieved [measurable outcome].",
            reasoning: "Industry-specific social proof",
            keywords: ["companies", "implementing", "achieved"],
            confidence: 0.86
          }
        ],
        objection: [
          {
            text: "I understand your concern about [objection topic]. What aspects of this are most important for you to address before moving forward?",
            reasoning: "Acknowledge and explore objection deeply",
            keywords: ["understand", "concern", "important"],
            confidence: 0.84
          },
          {
            text: "That's a valid point. Other clients have raised similar concerns, and here's how we've typically addressed it: [specific solution approach].",
            reasoning: "Validate and share proven solutions",
            keywords: ["valid", "similar", "addressed"],
            confidence: 0.82
          }
        ],
        closing: [
          {
            text: "Based on our conversation, I'd recommend starting with [specific next step]. This would give you [specific benefit] while [addressing key concern].",
            reasoning: "Clear recommendation addressing needs and concerns",
            keywords: ["recommend", "starting", "benefit"],
            confidence: 0.90
          },
          {
            text: "Would it make sense to schedule a more detailed demonstration with one of our specialists to see exactly how YoBot would work in your specific environment?",
            reasoning: "Low-pressure next step with clear value",
            keywords: ["schedule", "demonstration", "specific"],
            confidence: 0.88
          }
        ]
      };
      
      const stageSuggestions = genericSuggestions[stage as keyof typeof genericSuggestions] || [];
      matchedSuggestions = stageSuggestions.map(sugg => ({
        ...sugg,
        id: Math.random().toString(36).substring(2, 9),
        stage: stage
      }));
    }
    
    // Sort by confidence
    return matchedSuggestions.sort((a, b) => b.confidence - a.confidence);
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
        const fallbacks = {
          introduction: "Thanks for sharing that! I'd love to learn more about your specific needs. Could you tell me about the challenges you're facing?",
          discovery: "I appreciate that insight. How has this issue affected your team's productivity or results?",
          presentation: "Based on what you've shared, I think our AI-powered solution would be a great fit because it addresses your specific needs around communication efficiency.",
          objection: "That's a fair concern. Many of our clients initially thought the same, but they found the implementation much smoother than expected.",
          closing: "Given our discussion, would you be interested in seeing a personalized demo of how this would work in your environment?"
        };
        
        aiResponse = fallbacks[currentStage as keyof typeof fallbacks] || "I understand. Can you tell me more about that?";
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
  };

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
                  <motion.div 
                    key={stage.id}
                    className={`p-3 border rounded-lg cursor-pointer ${currentStage === stage.id ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => advanceStage(stage.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${stage.color} mr-2`}></div>
                      <div className="font-medium">{stage.name}</div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{stage.description}</div>
                    {currentStage === stage.id && (
                      <Badge variant="outline" className="mt-2">Current Stage</Badge>
                    )}
                  </motion.div>
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
              <Tabs defaultValue="strategic" onValueChange={(v) => setAnalysisMode(v as any)}>
                <TabsList className="w-full">
                  <TabsTrigger value="strategic" className="flex-1">Strategic</TabsTrigger>
                  <TabsTrigger value="tactical" className="flex-1">Tactical</TabsTrigger>
                </TabsList>
                <TabsContent value="strategic" className="pt-4">
                  <div className="text-sm text-muted-foreground">
                    Focuses on long-term goals and relationship building. Provides suggestions aimed at understanding needs and building trust.
                  </div>
                </TabsContent>
                <TabsContent value="tactical" className="pt-4">
                  <div className="text-sm text-muted-foreground">
                    Emphasizes immediate actions and overcoming objections. Suggestions are more direct and focused on advancing the sale.
                  </div>
                </TabsContent>
              </Tabs>
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
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {conversation.length === 0 ? (
                    <div className="flex flex-col items-center py-8">
                      <div className="text-muted-foreground mb-6">
                        No messages yet. Start a conversation!
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-3">
                        Try these conversation starters:
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center max-w-md">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setMessage("Hello! I'm interested in learning more about your AI sales assistant.");
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                        >
                          Initial Inquiry
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setMessage("We're struggling with scaling our sales outreach. Can your solution help?");
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                        >
                          Problem Statement
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setMessage("What makes your AI different from other solutions on the market?");
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                        >
                          Competitive Question
                        </Button>
                      </div>
                    </div>
                  ) : (
                    conversation.map((msg) => (
                      <motion.div 
                        key={msg.id} 
                        className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-start gap-2 max-w-[80%]">
                          {!msg.isUser && (
                            <Avatar className="h-8 w-8 mt-1">
                              <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center text-xs font-medium">
                                AI
                              </div>
                            </Avatar>
                          )}
                          <motion.div 
                            className={`rounded-lg px-4 py-2 ${
                              msg.isUser 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                            <div className="text-xs mt-1 opacity-70">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                          </motion.div>
                          {msg.isUser && (
                            <Avatar className="h-8 w-8 mt-1">
                              <div className="bg-slate-600 text-white h-full w-full flex items-center justify-center text-xs font-medium">
                                You
                              </div>
                            </Avatar>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
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
              <ScrollArea className="h-[400px] pr-4">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    <div className="mt-4 text-sm text-muted-foreground">Analyzing conversation context...</div>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="space-y-4">
                    {suggestions.map((suggestion) => (
                      <motion.div 
                        key={suggestion.id}
                        className="p-3 border rounded-lg"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className={`
                            ${suggestion.confidence > 0.9 ? 'bg-green-100 text-green-800' : 
                              suggestion.confidence > 0.8 ? 'bg-blue-100 text-blue-800' : 
                              'bg-yellow-100 text-yellow-800'}
                          `}>
                            {Math.round(suggestion.confidence * 100)}% Match
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 text-xs"
                            onClick={() => useSuggestion(suggestion)}
                          >
                            Use
                          </Button>
                        </div>
                        
                        <div className="text-sm font-medium mb-2">{suggestion.text}</div>
                        
                        <div className="text-xs text-slate-600 mb-2">
                          <span className="font-medium">Reasoning:</span> {suggestion.reasoning}
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-1">
                          {suggestion.keywords.map((keyword, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <div className="text-4xl mb-4">🔍</div>
                    <div className="text-lg font-medium mb-2">No conversation detected</div>
                    <div className="text-sm text-muted-foreground">
                      Start chatting in the simulator to see personalized response suggestions based on conversation context
                    </div>
                  </div>
                )}
              </ScrollArea>
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