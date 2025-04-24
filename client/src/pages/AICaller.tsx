import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Phone, PhoneOff, Play, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';

// Default call script template
const DEFAULT_SCRIPT = `Hello, this is Ella from YoBot.

I'm calling to follow up about our conversation earlier regarding our AI assistant services. 

I wanted to check if you had any questions about our platform or if you'd like to schedule a demonstration with one of our team members.

Would you be available for a 15-minute call this week to discuss how YoBot can help streamline your business operations?`;

// Form validation schema
const phoneCallSchema = z.object({
  to: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long")
    .regex(/^[0-9+\-\s()]*$/, "Invalid phone number format"),
  script: z.string()
    .min(20, "Script must be at least 20 characters")
    .max(5000, "Script is too long (max 5000 characters)"),
  persona: z.string({
    required_error: "Please select a persona"
  }),
  voice: z.string({
    required_error: "Please select a voice"
  }),
  scheduledTime: z.string().optional(),
});

type PhoneCallFormValues = z.infer<typeof phoneCallSchema>;

// Call history interface
interface CallRecord {
  id: string;
  to: string;
  from: string;
  status: string;
  script: string;
  persona: string;
  voice: string;
  duration?: number;
  recordingUrl?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  scheduledTime?: string | Date;
}

export default function AICaller() {
  const [testAudio, setTestAudio] = useState<HTMLAudioElement | null>(null);
  const queryClient = useQueryClient();
  
  // Fetch call history
  const {
    data: callHistory = [],
    isLoading: isHistoryLoading,
    error: historyError,
  } = useQuery({
    queryKey: ['/api/phone-call/history'],
    retry: 1,
  });
  
  // Fetch personas for the dropdown
  const {
    data: personas = [],
    isLoading: isPersonasLoading,
  } = useQuery({
    queryKey: ['/api/personas'],
    retry: 1,
  });
  
  // Form setup
  const form = useForm<PhoneCallFormValues>({
    resolver: zodResolver(phoneCallSchema),
    defaultValues: {
      to: '',
      script: DEFAULT_SCRIPT,
      persona: 'default',
      voice: 'female',
    },
  });
  
  // Mutation to make a phone call
  const makeCallMutation = useMutation({
    mutationFn: (values: PhoneCallFormValues) => apiRequest('/api/phone-call', 'POST', values),
    onSuccess: () => {
      toast({
        title: "Call initiated",
        description: "Your call is being processed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/phone-call/history'] });
      // Don't reset the form so the user can make multiple calls with the same script
      form.setValue('to', '');
    },
    onError: (error) => {
      toast({
        title: "Call failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Test speech before making the call
  const testSpeechMutation = useMutation({
    mutationFn: async (text: string) => {
      const voice = form.getValues('voice');
      const persona = form.getValues('persona');
      
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          personaId: persona,
          options: {
            stability: 0.5,
            similarityBoost: 0.8,
            style: 0.5,
            useSpeakerBoost: true,
          },
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate speech');
      }
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    onSuccess: (audioUrl) => {
      if (testAudio) {
        testAudio.pause();
        testAudio.src = '';
      }
      
      const audio = new Audio(audioUrl);
      setTestAudio(audio);
      audio.play();
    },
    onError: (error) => {
      toast({
        title: "Speech generation failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (testAudio) {
        testAudio.pause();
        URL.revokeObjectURL(testAudio.src);
      }
    };
  }, [testAudio]);
  
  // Form submission handler
  const onSubmit = (values: PhoneCallFormValues) => {
    makeCallMutation.mutate(values);
  };
  
  // Test the script audio
  const handleTestScript = () => {
    const script = form.getValues('script');
    if (script.trim().length < 20) {
      toast({
        title: "Script too short",
        description: "Please enter a longer script to test",
        variant: "destructive",
      });
      return;
    }
    
    testSpeechMutation.mutate(script);
  };
  
  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> {status}</Badge>;
      case 'failed':
      case 'busy':
      case 'no-answer':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> {status}</Badge>;
      case 'in-progress':
      case 'ringing':
        return <Badge className="bg-blue-600"><Phone className="h-3 w-3 mr-1 animate-pulse" /> {status}</Badge>;
      case 'queued':
      case 'scheduled':
        return <Badge variant="outline" className="border-amber-500 text-amber-500"><Clock className="h-3 w-3 mr-1" /> {status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  // Format time for display
  const formatTimeAgo = (dateStr: string | Date) => {
    try {
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    
    // Keep only digits
    const digits = phone.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length === 10) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
    }
    
    return phone;
  };
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Phone Calls</h1>
          <p className="text-gray-600 max-w-2xl">
            Let Ella make outbound calls to follow up with leads, confirm appointments, or deliver personalized messages.
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="make-call" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="make-call">Make a Call</TabsTrigger>
          <TabsTrigger value="call-history">Call History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="make-call">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>New Outbound Call</CardTitle>
                <CardDescription>
                  Create a script and make an AI-powered phone call
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+1 (555) 123-4567"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the recipient's phone number in international format
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="persona"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Persona</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a persona" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isPersonasLoading ? (
                                  <SelectItem value="loading">Loading personas...</SelectItem>
                                ) : (
                                  personas.map((persona: any) => (
                                    <SelectItem key={persona.id} value={persona.id}>
                                      {persona.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choose which personality Ella will use for the call
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="voice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Voice Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a voice" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="male">Male</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select the voice gender for this call
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="script"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Call Script</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Textarea
                                placeholder="Write your call script here..."
                                className="min-h-[200px] resize-y font-mono text-sm"
                                {...field}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="absolute bottom-2 right-2"
                                onClick={handleTestScript}
                                disabled={testSpeechMutation.isPending}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                {testSpeechMutation.isPending ? "Testing..." : "Test Script"}
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Write what Ella should say during the call. Use natural language and conversation flow.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.reset()}
                      >
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        disabled={makeCallMutation.isPending}
                        className="bg-[#0D82DA] hover:bg-[#0956a3]"
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        {makeCallMutation.isPending ? "Initiating Call..." : "Make Call"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Call Tips</CardTitle>
                <CardDescription>
                  Best practices for effective AI calls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertTitle className="flex items-center text-blue-700">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Keep It Conversational
                  </AlertTitle>
                  <AlertDescription className="text-blue-600">
                    Write scripts that sound natural and conversational, not robotic or sales-y.
                  </AlertDescription>
                </Alert>
                
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertTitle className="flex items-center text-blue-700">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Introduce Yourself Clearly
                  </AlertTitle>
                  <AlertDescription className="text-blue-600">
                    Always begin with a clear introduction of who you are and why you're calling.
                  </AlertDescription>
                </Alert>
                
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertTitle className="flex items-center text-blue-700">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Include Pauses
                  </AlertTitle>
                  <AlertDescription className="text-blue-600">
                    Use commas and periods to create natural pauses in your script.
                  </AlertDescription>
                </Alert>
                
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertTitle className="flex items-center text-blue-700">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Test Before Calling
                  </AlertTitle>
                  <AlertDescription className="text-blue-600">
                    Always use the "Test Script" button to hear how your message will sound.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="call-history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Calls</CardTitle>
              <CardDescription>
                Review your recent outbound AI calls and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isHistoryLoading ? (
                <div className="text-center py-4">Loading call history...</div>
              ) : historyError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load call history. Please try again.
                  </AlertDescription>
                </Alert>
              ) : callHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <PhoneOff className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p>No calls have been made yet.</p>
                  <p>Switch to the "Make a Call" tab to place your first AI call.</p>
                </div>
              ) : (
                <Table>
                  <TableCaption>List of recent outbound calls</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Persona</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callHistory.map((call: CallRecord) => (
                      <TableRow key={call.id}>
                        <TableCell>{formatPhoneNumber(call.to)}</TableCell>
                        <TableCell>{getStatusBadge(call.status)}</TableCell>
                        <TableCell>{call.persona}</TableCell>
                        <TableCell>
                          {call.duration ? `${Math.round(call.duration)}s` : '-'}
                        </TableCell>
                        <TableCell>{formatTimeAgo(call.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}