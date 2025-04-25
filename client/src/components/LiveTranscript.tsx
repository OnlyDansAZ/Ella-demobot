import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Interface for transcript entries
interface TranscriptEntry {
  timestamp: string;
  speaker: 'system' | 'user' | 'unknown';
  text: string;
  confidence?: number;
}

interface LiveTranscriptProps {
  callId: string;
  callStatus: string;
  highlightKeywords?: string[];
}

export default function LiveTranscript({ callId, callStatus, highlightKeywords = ['appointment', 'schedule', 'interested', 'declined', 'price', 'pricing', 'yes', 'no'] }: LiveTranscriptProps) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Helper function to format time from ISO string
  const formatTime = (isoTime: string): string => {
    try {
      const date = new Date(isoTime);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return 'Invalid time';
    }
  };

  // Helper function to color-code confidence scores
  const getConfidenceColor = (confidence?: number): string => {
    if (confidence === undefined) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Helper to format confidence as percentage
  const formatConfidence = (confidence?: number): string => {
    if (confidence === undefined) return 'N/A';
    return `${Math.round(confidence * 100)}%`;
  };

  // Function to highlight keywords in text
  const highlightText = (text: string): JSX.Element => {
    if (!highlightKeywords || highlightKeywords.length === 0) return <>{text}</>;

    // Create regex pattern from keywords
    const pattern = new RegExp(`(${highlightKeywords.join('|')})`, 'gi');
    const parts = text.split(pattern);

    return (
      <>
        {parts.map((part, i) => {
          // Check if this part matches any keyword (case insensitive)
          const isKeyword = highlightKeywords.some(
            keyword => part.toLowerCase() === keyword.toLowerCase()
          );
          
          return isKeyword ? (
            <span key={i} className="bg-yellow-200 font-medium">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
      </>
    );
  };

  // Function to download transcript as text file
  const downloadTranscript = () => {
    if (transcript.length === 0) {
      toast({
        title: "No transcript available",
        description: "There's no transcript data to download.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format transcript entries
      const formattedTranscript = transcript.map(entry => {
        const time = formatTime(entry.timestamp);
        const speaker = entry.speaker === 'system' ? 'Ella' : 
                       entry.speaker === 'user' ? 'Customer' : 'Unknown';
        return `[${time}] ${speaker} (${formatConfidence(entry.confidence)}): ${entry.text}`;
      }).join('\n\n');

      // Create file content with call details
      const fileContent = `YoBot Call Transcript
Call ID: ${callId}
Status: ${callStatus}
Downloaded: ${new Date().toLocaleString()}

${formattedTranscript}`;

      // Create blob and download link
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-transcript-${callId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Transcript downloaded",
        description: "The transcript has been downloaded to your device.",
      });
    } catch (error) {
      console.error('Error downloading transcript:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the transcript.",
        variant: "destructive",
      });
    }
  };

  // Function to reconnect WebSocket
  const reconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setReconnectCount(prev => prev + 1);
    setConnected(false);
    toast({
      title: "Reconnecting...",
      description: "Attempting to reconnect to the transcript feed.",
    });
  };
  
  // Effect to load initial transcript and connect to WebSocket for updates
  useEffect(() => {
    const loadTranscript = async () => {
      if (!callId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Load initial transcript from API
        const response = await fetch(`/api/phone-call/${callId}/transcript`);
        if (!response.ok) {
          throw new Error(`Failed to load transcript: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success && Array.isArray(data.transcript)) {
          setTranscript(data.transcript);
        } else {
          setTranscript([]);
        }
      } catch (err) {
        console.error('Error loading transcript:', err);
        setError(err instanceof Error ? err.message : 'Failed to load transcript');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Load initial transcript
    loadTranscript();
    
    // Set up WebSocket connection for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      
      // Subscribe to updates for this call
      ws.send(JSON.stringify({
        type: 'subscribe',
        callId: callId
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        // Handle different message types
        if (data.type === 'transcript' && data.callId === callId && data.entry) {
          setTranscript(prev => {
            // Check if we already have this entry (avoid duplicates)
            const isDuplicate = prev.some(entry => 
              entry.timestamp === data.entry.timestamp && 
              entry.text === data.entry.text
            );
            
            if (isDuplicate) return prev;
            return [...prev, data.entry];
          });
        } 
        else if (data.type === 'connected') {
          console.log('Connected to WebSocket server', data.message);
        } 
        else if (data.type === 'subscribed') {
          console.log('Subscribed to call updates', data.callId);
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
      setError('Connection to transcript feed failed');
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
    };
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [callId, reconnectCount]);

  // Auto-scroll to bottom when transcript updates
  useEffect(() => {
    if (scrollRef.current && transcript.length > 0) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  // Determine if call is active or completed
  const isCallActive = callStatus && ['in-progress', 'ringing', 'queued', 'initiating'].includes(callStatus.toLowerCase());

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            Live Transcript
            {isCallActive && (
              <span className="ml-2 relative inline-flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            )}
          </CardTitle>
          <div className="flex space-x-2">
            {connected ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Disconnected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div 
          ref={transcriptContainerRef}
          className="bg-gray-50 border border-gray-200 rounded-md p-3 h-[250px] overflow-y-auto space-y-2 text-sm"
        >
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-red-500">
              <p>{error}</p>
            </div>
          ) : transcript.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <p>No transcript data available yet.</p>
              <p className="text-xs mt-1">Transcript will appear here when someone speaks during the call.</p>
            </div>
          ) : (
            transcript.map((entry, index) => (
              <div key={index} className={`px-3 py-2 rounded-lg ${
                entry.speaker === 'system' ? 'bg-blue-50 border-l-4 border-blue-300' : 
                entry.speaker === 'user' ? 'bg-amber-50 border-l-4 border-amber-300' : 
                'bg-gray-100 border-l-4 border-gray-300'
              }`}>
                <div className="flex justify-between items-start">
                  <span className="font-semibold">
                    {entry.speaker === 'system' ? 'Ella' : 
                     entry.speaker === 'user' ? 'Customer' : 'Unknown'}
                  </span>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className={getConfidenceColor(entry.confidence)}>
                      {formatConfidence(entry.confidence)}
                    </span>
                    <span className="text-gray-500">{formatTime(entry.timestamp)}</span>
                  </div>
                </div>
                <p className="mt-1">{highlightText(entry.text)}</p>
              </div>
            ))
          )}
          <div ref={scrollRef}></div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={reconnectWebSocket}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reconnect
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadTranscript}
          disabled={isLoading || transcript.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Transcript
        </Button>
      </CardFooter>
    </Card>
  );
}