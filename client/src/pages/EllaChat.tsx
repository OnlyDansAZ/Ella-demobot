import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Send, Volume2, VolumeX, ArrowLeft, User, Brain, Edit, Calendar, Clock, MapPin, AlertCircle, Briefcase, Trash2, Palette } from 'lucide-react';
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
import { predefinedPersonas, customPersonaTemplate, Persona } from '@/lib/personas';
import { motion } from 'framer-motion';
import { ThemeSelector, ThemeOption } from '@/components/ThemeSelector';
import { applyTheme, applyFontScale, saveThemeSettings, loadThemeSettings } from '@/lib/themeUtils';
import { ScheduleMeeting } from '@/components/ScheduleMeeting';
import { Badge } from '@/components/ui/badge';
import { useCalendly } from '@/hooks/use-calendly';
import { apiRequest } from '@/lib/queryClient';
import { useConversation, ChatMessage } from '@/hooks/use-conversation';
import yobotLogo from "../assets/yobot-logo.png";
import yobotHeadLogo from "../assets/yobot-head-logo.png";
import yobotTransparentLogo from "../assets/yobot-transparent-logo.png";

// Define interfaces needed for the component
interface Appointment {
  id: number;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  reminderSent: boolean;
  timeZone?: string;
  details?: string; // Additional details like items to bring
}

// Reuse the ChatMessage type from our hook for local state
interface Message extends ChatMessage {
  // Additional fields can be added here if needed
}

export default function EllaChat() {
  // Use our persistence hook for conversation management
  const {
    messages,
    isLoading: isLoadingMessages,
    addMessage,
    clearConversation,
    startNewConversation,
    sessionId
  } = useConversation();

  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(80);
  
  // Scheduling state
  const [showCalendly, setShowCalendly] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const { calendlyUrl, meetingTypes } = useCalendly();
  
  // Persona state
  const [selectedPersona, setSelectedPersona] = useState<string>("default");
  const [useCustomPersona, setUseCustomPersona] = useState(false);
  const [customPersonaText, setCustomPersonaText] = useState(customPersonaTemplate);
  
  // Voice enhancement states
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [voiceConfidence, setVoiceConfidence] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Theme state
  const [currentThemeId, setCurrentThemeId] = useState('default');
  const [bubbleOpacity, setBubbleOpacity] = useState(1);
  const [usePrimaryColor, setUsePrimaryColor] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [fontScale, setFontScale] = useState(1);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Effect to load and apply theme settings
  useEffect(() => {
    // Load saved theme settings from localStorage
    const savedSettings = loadThemeSettings();
    
    // Update component state with loaded settings
    setCurrentThemeId(savedSettings.themeId);
    setBubbleOpacity(savedSettings.bubbleOpacity);
    setUsePrimaryColor(savedSettings.usePrimaryColor);
    setAnimationsEnabled(savedSettings.animationsEnabled);
    setFontScale(savedSettings.fontScale);
    
    // Find the theme object that corresponds to the saved theme ID
    const defaultThemes = [
      {
        id: 'default',
        name: 'Default',
        primaryColor: '#3b82f6',
        secondaryColor: '#f3f4f6',
        accentColor: '#10b981',
        description: 'The standard YoBot theme with a clean, professional look'
      },
      {
        id: 'modern',
        name: 'Modern Blue',
        primaryColor: '#2563eb',
        secondaryColor: '#e0f2fe',
        accentColor: '#06b6d4',
        description: 'A sleek and modern blue theme with light accents'
      },
      {
        id: 'night',
        name: 'Night Mode',
        primaryColor: '#6366f1',
        secondaryColor: '#1e1e2d',
        accentColor: '#8b5cf6',
        description: 'Dark theme with vibrant purple accents for low-light environments'
      },
      {
        id: 'nature',
        name: 'Natural Green',
        primaryColor: '#10b981',
        secondaryColor: '#ecfdf5',
        accentColor: '#059669',
        description: 'Calm and natural green theme inspired by nature'
      },
      {
        id: 'sunset',
        name: 'Sunset Orange',
        primaryColor: '#f97316',
        secondaryColor: '#fff7ed',
        accentColor: '#ea580c',
        description: 'Warm and energetic theme with sunset-inspired colors'
      },
    ];
    
    const theme = defaultThemes.find(t => t.id === savedSettings.themeId) || defaultThemes[0];
    
    // Apply all theme settings
    applyTheme(theme);
    applyFontScale(savedSettings.fontScale);
    setAnimationsEnabled(savedSettings.animationsEnabled);
    setBubbleOpacity(savedSettings.bubbleOpacity);
    
    // Update user bubble colors based on settings
    const root = document.documentElement;
    if (savedSettings.usePrimaryColor) {
      root.style.setProperty('--user-bubble-bg', 'var(--theme-primary)');
      root.style.setProperty('--user-bubble-text', 'white');
    } else {
      root.style.setProperty('--user-bubble-bg', '#E5E7EB');
      root.style.setProperty('--user-bubble-text', '#1a1a1a');
    }
  }, []);
  
  // Fetch upcoming appointments
  const fetchAppointments = async () => {
    setIsLoadingAppointments(true);
    try {
      const response = await fetch('/api/appointments/upcoming?limit=5', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.appointments) {
          setAppointments(data.appointments);
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoadingAppointments(false);
    }
  };
  
  // Theme handling functions
  const handleThemeChange = (themeId: string) => {
    setCurrentThemeId(themeId);
    
    // Find the theme object that corresponds to the selected theme ID
    const defaultThemes = [
      {
        id: 'default',
        name: 'Default',
        primaryColor: '#3b82f6',
        secondaryColor: '#f3f4f6',
        accentColor: '#10b981',
        description: 'The standard YoBot theme with a clean, professional look'
      },
      {
        id: 'modern',
        name: 'Modern Blue',
        primaryColor: '#2563eb',
        secondaryColor: '#e0f2fe',
        accentColor: '#06b6d4',
        description: 'A sleek and modern blue theme with light accents'
      },
      {
        id: 'night',
        name: 'Night Mode',
        primaryColor: '#6366f1',
        secondaryColor: '#1e1e2d',
        accentColor: '#8b5cf6',
        description: 'Dark theme with vibrant purple accents for low-light environments'
      },
      {
        id: 'nature',
        name: 'Natural Green',
        primaryColor: '#10b981',
        secondaryColor: '#ecfdf5',
        accentColor: '#059669',
        description: 'Calm and natural green theme inspired by nature'
      },
      {
        id: 'sunset',
        name: 'Sunset Orange',
        primaryColor: '#f97316',
        secondaryColor: '#fff7ed',
        accentColor: '#ea580c',
        description: 'Warm and energetic theme with sunset-inspired colors'
      },
    ];
    
    const theme = defaultThemes.find(t => t.id === themeId) || defaultThemes[0];
    
    // Apply the theme
    applyTheme(theme);
    
    // Save updated settings
    saveThemeSettings({
      themeId,
      bubbleOpacity,
      usePrimaryColor,
      animationsEnabled,
      fontScale
    });
  };
  
  const handleBubbleOpacityChange = (opacity: number) => {
    setBubbleOpacity(opacity);
    setBubbleOpacity(opacity);
    
    // Save updated settings
    saveThemeSettings({
      themeId: currentThemeId,
      bubbleOpacity: opacity,
      usePrimaryColor,
      animationsEnabled,
      fontScale
    });
  };
  
  const handleUsePrimaryColorChange = (use: boolean) => {
    setUsePrimaryColor(use);
    
    // Update CSS variables directly since we're in the component
    const root = document.documentElement;
    if (use) {
      root.style.setProperty('--user-bubble-bg', 'var(--theme-primary)');
      root.style.setProperty('--user-bubble-text', 'white');
    } else {
      root.style.setProperty('--user-bubble-bg', '#E5E7EB');
      root.style.setProperty('--user-bubble-text', '#1a1a1a');
    }
    
    // Save updated settings
    saveThemeSettings({
      themeId: currentThemeId,
      bubbleOpacity,
      usePrimaryColor: use,
      animationsEnabled,
      fontScale
    });
  };
  
  const handleAnimationsEnabledChange = (enabled: boolean) => {
    setAnimationsEnabled(enabled);
    
    // Apply the animations setting
    const root = document.documentElement;
    if (enabled) {
      root.style.setProperty('--animation-duration', '300ms');
      root.style.setProperty('--transition-duration', '150ms');
      document.body.classList.remove('animations-disabled');
    } else {
      root.style.setProperty('--animation-duration', '0ms');
      root.style.setProperty('--transition-duration', '0ms');
      document.body.classList.add('animations-disabled');
    }
    
    // Save updated settings
    saveThemeSettings({
      themeId: currentThemeId,
      bubbleOpacity,
      usePrimaryColor,
      animationsEnabled: enabled,
      fontScale
    });
  };
  
  const handleFontScaleChange = (scale: number) => {
    setFontScale(scale);
    applyFontScale(scale);
    
    // Save updated settings
    saveThemeSettings({
      themeId: currentThemeId,
      bubbleOpacity,
      usePrimaryColor,
      animationsEnabled,
      fontScale: scale
    });
  };

  // Function to process response actions (shared between text and voice input)
  const processResponseActions = (response: string, userMessage: string) => {
    // Check if the response contains booking-related content
    const lowerCaseResponse = response.toLowerCase();
    const lowerCaseUserMessage = userMessage.toLowerCase();
    
    // Show appointments view if user asked about their appointments
    if (
      (lowerCaseUserMessage.includes('my appointment') || 
       lowerCaseUserMessage.includes('my meeting') || 
       lowerCaseUserMessage.includes('meeting that i have') ||
       lowerCaseUserMessage.includes('do i have any appointment') ||
       lowerCaseUserMessage.includes('upcoming appointment') ||
       lowerCaseUserMessage.includes('check appointment') ||
       lowerCaseUserMessage.includes('view appointment')) && 
      !showAppointments
    ) {
      // Show the appointments interface
      setShowAppointments(true);
    }
    // Show Calendly widget if response suggests booking a meeting
    else if (
      (lowerCaseResponse.includes('calendly') || 
       lowerCaseResponse.includes('schedule a meeting') || 
       lowerCaseResponse.includes('booking link') ||
       lowerCaseResponse.includes('book a time') ||
       (lowerCaseResponse.includes('appointment') && !lowerCaseResponse.includes('existing appointment'))) && 
      !showCalendly
    ) {
      // Show the Calendly interface
      setShowCalendly(true);
    }
  };
  
  // Function to send a message with specific text (for voice input or text input)
  const sendMessageWithText = async (text: string) => {
    if (!text.trim()) return;
    
    // Add the user message using our hook (this handles persistence)
    const userMessage = await addMessage(text, true);
    
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
          customPersonaPrompt: useCustomPersona ? customPersonaText : null,
          sessionId: sessionId, // Include the session ID for tracking
          isVoiceInput: true // Flag to indicate this came from voice input
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add the bot response using our hook (with persistence)
        const botMessage = await addMessage(data.response, false);
        
        processResponseActions(data.response, userMessage.content);
        
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
  
  // Function to send a message from the input field (wrapper for sendMessageWithText)
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    await sendMessageWithText(inputMessage);
  };
  
  // Helper function to restart speech recognition
  const restartListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.start();
        console.log('Speech recognition restarted');
      } catch (error) {
        console.error('Failed to restart speech recognition:', error);
        setIsListening(false);
      }
    }
  };
  
  // Start listening for speech
  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        
        // More informative error messages
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          alert('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else {
          alert('Failed to start speech recognition. Please try again or use text input instead.');
        }
        setIsListening(false);
      }
    } else if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please try using a modern browser like Chrome, Edge, or Safari.');
      setIsVoiceEnabled(false);
    } else {
      alert('Speech recognition failed to initialize. Please refresh the page and try again.');
    }
  };
  
  // Stop listening for speech
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
  
  // Helper function for browser speech synthesis fallback
  const useBrowserFallbackSpeech = (text: string) => {
    if (window.speechSynthesis) {
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = volume / 100;
        
        // Attempt to find a female voice for better match to Ella
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice => 
          voice.name.includes('female') || 
          voice.name.includes('Samantha') || 
          voice.name.includes('Victoria') || 
          voice.name.includes('Karen')
        );
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
        
        // Set state for speaking indicator
        setIsSpeaking(true);
        
        // Handle when speech is done
        utterance.onend = () => {
          setIsSpeaking(false);
        };
        
        // Handle errors
        utterance.onerror = () => {
          console.error('Browser speech synthesis error');
          setIsSpeaking(false);
        };
        
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error('Browser speech synthesis failed:', e);
        setIsSpeaking(false);
      }
    }
  };
  
  // Function to play audio response with enhanced handling
  const playAudio = async (text: string) => {
    try {
      // If currently speaking, stop the current audio first
      if (isSpeaking && currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      
      // Process text on client side to improve voice quality and handle formatting
      // This is a second layer of defense in case server-side processing doesn't catch all
      let processedText = text
        .replace(/•\s*/g, "") // Remove bullet points
        .replace(/\*/g, "") // Remove asterisks completely
        .replace(/-\s+/g, "") // Remove hyphens at the start of lines
        .replace(/^\s*-\s*/gm, "") // Remove hyphens at the start of each line in multiline text
        .replace(/\n+/g, ". ") // Replace multiple newlines with periods for better speech flow
        .replace(/\s{2,}/g, " "); // Replace multiple spaces with a single space
      
      // Add natural pauses for better speech rhythm
      processedText = processedText
        .replace(/\. /g, ". <break time='0.5s'/> ")
        .replace(/\? /g, "? <break time='0.6s'/> ")
        .replace(/! /g, "! <break time='0.5s'/> ")
        .replace(/: /g, ": <break time='0.3s'/> ")
        .replace(/; /g, "; <break time='0.3s'/> ");
      
      console.log("Original text:", text);
      console.log("Processed text for speech:", processedText);
      
      setIsSpeaking(true);
      
      try {
        const response = await fetch('/api/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            text: processedText,
            // Add additional parameters for more expressive speech
            options: {
              stability: 0.5,
              similarityBoost: 0.75,
              style: 0.5 // Add more expressiveness to the voice
            }
          })
        });
        
        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audioElement = new Audio(audioUrl);
          
          // Save reference to the audio element
          currentAudioRef.current = audioElement;
          
          audioElement.volume = volume / 100;
          
          // Properly handle state and cleanup when audio finishes
          audioElement.onended = () => {
            URL.revokeObjectURL(audioUrl);
            setIsSpeaking(false);
            currentAudioRef.current = null;
          };
          
          // Handle errors properly
          audioElement.onerror = (e) => {
            console.error('Audio playback error:', e);
            URL.revokeObjectURL(audioUrl);
            setIsSpeaking(false);
            currentAudioRef.current = null;
            
            // Attempt fallback for seamless experience
            useBrowserFallbackSpeech(text);
          };
          
          // Use a more robust play mechanism with better error handling for mobile
          try {
            await audioElement.play();
          } catch (playError) {
            console.error('Failed to play audio - likely a mobile autoplay restriction:', playError);
            setIsSpeaking(false);
            currentAudioRef.current = null;
            
            // Fallback to browser speech synthesis
            useBrowserFallbackSpeech(text);
          }
        } else {
          console.error('Failed to get speech:', await response.text());
          setIsSpeaking(false);
          
          // Fallback to browser speech synthesis
          useBrowserFallbackSpeech(text);
        }
      } catch (fetchError) {
        console.error('Error fetching speech from server:', fetchError);
        setIsSpeaking(false);
        
        // Fallback to browser speech synthesis
        useBrowserFallbackSpeech(text);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsSpeaking(false);
    }
  };
  
  // Initialize speech recognition
  useEffect(() => {
    // Initialize speech recognition when component mounts
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Allow continuous listening
      recognitionRef.current.interimResults = true; // Get interim results for more responsive UI
      recognitionRef.current.lang = 'en-US';
      
      // Set up event handlers with enhanced error recovery
      recognitionRef.current.onresult = (event: any) => {
        // Get the last result (most recent speech)
        const lastResult = event.results[event.results.length - 1];
        
        // Check if this is a final result
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          const confidence = lastResult[0].confidence;
          setVoiceConfidence(confidence);
          
          console.log(`Speech recognized with ${Math.round(confidence * 100)}% confidence: "${transcript}"`);
          
          // Set the recognized speech as input message
          setInputMessage(transcript);
          
          // If confidence is high enough and we're in listening mode, auto-send the message
          if (confidence > 0.85 && isListening) {
            // Use a timeout to give visual feedback before sending
            setTimeout(() => {
              if (transcript && transcript.length > 0) {
                sendMessageWithText(transcript);
              }
            }, 300);
          }
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Only stop listening on critical errors, try to recover from transient ones
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false);
          alert('Speech recognition permission was denied. Please allow microphone access.');
        } else if (event.error === 'aborted') {
          // User likely aborted manually, just stop
          setIsListening(false);
        } else if (event.error === 'network') {
          console.warn('Network error in speech recognition, trying to restart...');
          // Try to restart after a brief delay
          setTimeout(() => {
            if (isListening) restartListening();
          }, 1000);
        } else {
          // For other errors, we might try to restart recognition if still in listening mode
          setTimeout(() => {
            if (isListening) restartListening();
          }, 1000);
        }
      };
      
      recognitionRef.current.onend = () => {
        // Attempt to restart if still in listening mode
        if (isListening) {
          restartListening();
        }
      };
    }
    
    // Clean up on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, [isListening]);
  
  // Load appointments when needed
  useEffect(() => {
    if (showAppointments) {
      fetchAppointments();
    }
  }, [showAppointments]);

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
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs px-2 py-1 h-7 flex items-center gap-1"
            onClick={() => {
              setShowAppointments(true);
              setShowSettingsOnMobile(false); // Hide settings panel on mobile when viewing appointments
            }}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline ml-1">Appointments</span>
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
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.3, 
                      ease: "easeOut",
                      delay: 0.05 * Math.min(index, 3) // Cap the delay for older messages
                    }}
                  >
                    <motion.div
                      className={`max-w-[90%] sm:max-w-[80%] rounded-lg p-1.5 sm:p-3 ${
                        message.isUser
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none shadow-sm'
                          : 'bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/70 dark:to-blue-900/40 rounded-bl-none border border-blue-100/50 dark:border-blue-800/30 shadow-sm'
                      }`}
                      initial={{ opacity: 0, x: message.isUser ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        duration: 0.3,
                        type: "spring",
                        stiffness: 500,
                        damping: 25,
                        delay: 0.05 * Math.min(index, 3) + 0.1 
                      }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <motion.p 
                        className="whitespace-pre-wrap text-xs sm:text-base"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        {message.content}
                      </motion.p>
                      <motion.div 
                        className={`text-[8px] sm:text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-muted-foreground'}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </motion.div>
                    </motion.div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div 
                    className="flex justify-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div 
                      className="max-w-[90%] sm:max-w-[80%] rounded-lg p-2 sm:p-3 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/70 dark:to-blue-900/40 rounded-bl-none border border-blue-100/50 dark:border-blue-800/30 shadow-sm"
                      animate={{ boxShadow: ["0 0 0 rgba(59, 130, 246, 0)", "0 0 8px rgba(59, 130, 246, 0.3)", "0 0 0 rgba(59, 130, 246, 0)"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1 sm:space-x-1.5">
                          <motion.div 
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"
                            animate={{ scale: [0.5, 1, 0.5], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                          />
                          <motion.div 
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"
                            animate={{ scale: [0.5, 1, 0.5], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.div 
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"
                            animate={{ scale: [0.5, 1, 0.5], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                        <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Ella is thinking...
                        </span>
                      </div>
                    </motion.div>
                  </motion.div>
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
                      Ella has detected you'd like to schedule a meeting. Select a meeting type below, and you'll be able to pick a convenient time slot.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      {meetingTypes && meetingTypes.length > 0 ? (
                        meetingTypes.map(type => (
                          <ScheduleMeeting 
                            key={type.id}
                            buttonText={type.name}
                            buttonClasses="text-xs sm:text-sm py-1 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded transition duration-150 ease-in-out w-full sm:w-auto"
                            calendlyUrl={type.url}
                            prefill={{}}
                          />
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">Loading available meeting types...</p>
                      )}
                    </div>
                  </div>
                )}
                {showAppointments && (
                  <div className="my-4 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs sm:text-sm font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        Your Upcoming Appointments
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        onClick={() => setShowAppointments(false)}
                      >
                        ✕
                      </Button>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">
                      Here are your upcoming appointments. Ella will remind you about these when needed.
                    </p>
                    <div className="space-y-2">
                      {isLoadingAppointments ? (
                        <motion.div 
                          className="flex justify-center py-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex space-x-1.5">
                              <motion.div 
                                className="w-2 h-2 rounded-full bg-blue-500"
                                animate={{ 
                                  scale: [0.5, 1, 0.5],
                                  opacity: [0.5, 1, 0.5]
                                }}
                                transition={{ 
                                  duration: 1.5, 
                                  repeat: Infinity, 
                                  ease: "easeInOut",
                                  times: [0, 0.5, 1],
                                  delay: 0
                                }}
                              />
                              <motion.div 
                                className="w-2 h-2 rounded-full bg-blue-500"
                                animate={{ 
                                  scale: [0.5, 1, 0.5],
                                  opacity: [0.5, 1, 0.5]
                                }}
                                transition={{ 
                                  duration: 1.5, 
                                  repeat: Infinity,
                                  ease: "easeInOut", 
                                  times: [0, 0.5, 1],
                                  delay: 0.2
                                }}
                              />
                              <motion.div 
                                className="w-2 h-2 rounded-full bg-blue-500"
                                animate={{ 
                                  scale: [0.5, 1, 0.5],
                                  opacity: [0.5, 1, 0.5]
                                }}
                                transition={{ 
                                  duration: 1.5, 
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                  times: [0, 0.5, 1],
                                  delay: 0.4
                                }}
                              />
                            </div>
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              Loading appointments...
                            </span>
                          </div>
                        </motion.div>
                      ) : appointments.length > 0 ? (
                        appointments.map(appointment => (
                          <div key={appointment.id} className="border border-blue-200 dark:border-blue-800 rounded-lg p-2 text-[10px] sm:text-xs">
                            <div className="flex items-start gap-1">
                              <div className="bg-blue-100 dark:bg-blue-900 p-1 rounded flex items-center justify-center">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{appointment.title}</div>
                                <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground">
                                  <Calendar className="h-2.5 w-2.5 mr-1" />
                                  <span>
                                    {new Date(appointment.date).toLocaleDateString(undefined, {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground">
                                  <Clock className="h-2.5 w-2.5 mr-1" />
                                  <span>
                                    {appointment.startTime}
                                    {appointment.endTime ? ` - ${appointment.endTime}` : ''}
                                  </span>
                                </div>
                                {appointment.location && (
                                  <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground">
                                    <MapPin className="h-2.5 w-2.5 mr-1" />
                                    <span>{appointment.location}</span>
                                  </div>
                                )}
                                {appointment.details && (
                                  <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground mt-1">
                                    <Briefcase className="h-2.5 w-2.5 mr-1" />
                                    <span>Items to bring: {appointment.details}</span>
                                  </div>
                                )}
                                <div className="mt-1">
                                  <Badge 
                                    variant={
                                      appointment.status === 'confirmed' ? 'default' :
                                      appointment.status === 'pending' ? 'outline' :
                                      appointment.status === 'completed' ? 'secondary' : 'destructive'
                                    }
                                    className="text-[8px] sm:text-[10px] px-1 py-0 h-auto"
                                  >
                                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center p-4 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                          <div>
                            <AlertCircle className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              You don't have any upcoming appointments yet.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            <div className="p-1 sm:p-3 border-t relative">
              {/* Voice activity indicators - microanimations */}
              {isListening && (
                <div className="absolute left-0 top-0 w-full flex items-center justify-center">
                  <div className="bg-blue-500/90 text-white px-3 py-1 rounded-b-lg text-xs shadow-md flex items-center gap-2 transform -translate-y-1">
                    <div className="flex gap-1">
                      <div className="w-1 h-3 bg-white rounded-full animate-sound-wave" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-4 bg-white rounded-full animate-sound-wave" style={{ animationDelay: '250ms' }}></div>
                      <div className="w-1 h-2 bg-white rounded-full animate-sound-wave" style={{ animationDelay: '500ms' }}></div>
                      <div className="w-1 h-5 bg-white rounded-full animate-sound-wave" style={{ animationDelay: '750ms' }}></div>
                      <div className="w-1 h-3 bg-white rounded-full animate-sound-wave" style={{ animationDelay: '1000ms' }}></div>
                    </div>
                    <span className="flex items-center gap-1">
                      <Mic className="h-3 w-3 animate-ping-slow" />
                      Listening... {voiceConfidence > 0 ? (
                        <span className={`
                          ${voiceConfidence > 0.8 ? 'text-green-200' : voiceConfidence > 0.5 ? 'text-yellow-200' : 'text-red-200'}
                          transition-colors duration-300
                        `}>
                          ({Math.round(voiceConfidence * 100)}%)
                        </span>
                      ) : ''}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className={`h-8 w-8 rounded-full ${isMuted ? 'text-red-500 hover:text-red-600' : ''}`}
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant={isListening ? 'destructive' : 'outline'}
                  className="h-8 w-8 rounded-full"
                  onClick={isListening ? stopListening : startListening}
                  disabled={!isVoiceEnabled}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Input
                  className="flex-1 h-8 text-sm"
                  placeholder="Type a message to Ella..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  ref={inputRef}
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600"
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                >
                  <Send className="h-4 w-4 text-white" />
                </Button>
              </div>
              
              {/* Speaking indicator - when Ella is speaking with animation */}
              {isSpeaking && (
                <div className="mt-2 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900 rounded-full px-3 py-1 shadow-sm">
                    <div className="flex gap-1 items-center">
                      <div className="w-1 h-2 bg-blue-500 rounded-full animate-sound-wave" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-3 bg-blue-500 rounded-full animate-sound-wave" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-1.5 bg-blue-500 rounded-full animate-sound-wave" style={{ animationDelay: '300ms' }}></div>
                      <div className="w-1 h-2.5 bg-blue-500 rounded-full animate-sound-wave" style={{ animationDelay: '450ms' }}></div>
                    </div>
                    <span className="text-[10px] text-blue-600 dark:text-blue-300 ml-1 font-medium flex items-center">
                      <Volume2 className="h-3 w-3 mr-1 animate-ping-slow" />
                      Ella is speaking...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* Settings Panel - 1/4 width on desktop, full width on mobile when toggled */}
        <div className={`md:col-span-1 ${!showSettingsOnMobile ? 'hidden md:block' : 'block'}`}>
          <Card className="border rounded-lg shadow-sm p-2 sm:p-4 h-[80vh] sm:h-[70vh] overflow-y-auto">
            <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-4">Settings</h2>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Voice Settings */}
              <div>
                <h3 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 flex items-center gap-1">
                  <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" /> 
                  Voice Settings
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] sm:text-xs">Voice Volume</Label>
                    <div className="w-[60%]">
                      <Slider 
                        defaultValue={[volume]} 
                        max={100} 
                        step={1} 
                        className="h-1.5"
                        onValueChange={(values) => setVolume(values[0])}
                      />
                    </div>
                    <span className="text-[10px] sm:text-xs w-8 text-right">{volume}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mute-toggle" className="text-[10px] sm:text-xs">Mute Voice</Label>
                    <Switch 
                      id="mute-toggle" 
                      checked={isMuted}
                      onCheckedChange={setIsMuted}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Persona Selection */}
              <div>
                <h3 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 flex items-center gap-1">
                  <Brain className="h-3 w-3 sm:h-4 sm:w-4" /> 
                  Ella's Persona
                </h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] sm:text-xs">Predefined Personas</Label>
                      <Select 
                        value={useCustomPersona ? "" : selectedPersona}
                        onValueChange={(value) => {
                          setSelectedPersona(value);
                          setUseCustomPersona(false);
                        }}
                        disabled={useCustomPersona}
                      >
                        <SelectTrigger className="w-full h-7 text-[10px] sm:text-xs">
                          <SelectValue placeholder="Select a persona" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(predefinedPersonas).map((key) => (
                            <SelectItem key={key} value={key} className="text-[10px] sm:text-xs">
                              {predefinedPersonas[key].name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="custom-toggle" className="text-[10px] sm:text-xs">Custom Persona</Label>
                        <Switch 
                          id="custom-toggle" 
                          checked={useCustomPersona}
                          onCheckedChange={setUseCustomPersona}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {useCustomPersona && (
                    <div>
                      <Label className="text-[10px] sm:text-xs mb-1 block">Custom Instructions</Label>
                      <Textarea 
                        placeholder="Enter custom persona instructions..."
                        className="h-24 text-[10px] sm:text-xs"
                        value={customPersonaText}
                        onChange={(e) => setCustomPersonaText(e.target.value)}
                      />
                    </div>
                  )}
                  
                  {!useCustomPersona && selectedPersona && (
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 bg-muted p-1.5 rounded">
                      <div className="font-medium">Description:</div>
                      <p>{predefinedPersonas[selectedPersona].description}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Conversation Controls */}
              <div>
                <h3 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 flex items-center gap-1">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" /> 
                  Conversation
                </h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-[10px] sm:text-xs h-7"
                    onClick={() => clearConversation()}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear Conversation
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-[10px] sm:text-xs h-7"
                    onClick={() => startNewConversation()}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Start New Conversation
                  </Button>
                  <Button 
                    variant={showThemeSettings ? "default" : "outline"}
                    size="sm" 
                    className="w-full text-[10px] sm:text-xs h-7"
                    onClick={() => setShowThemeSettings(!showThemeSettings)}
                  >
                    <Palette className="h-3 w-3 mr-1" />
                    {showThemeSettings ? "Hide Theme Settings" : "Customize Theme"}
                  </Button>
                </div>
                
                {/* Theme Settings Panel */}
                {showThemeSettings && (
                  <div className="mt-4 rounded-lg border p-3 bg-background/50 backdrop-blur-sm">
                    <h4 className="text-xs font-semibold mb-2">Theme Settings</h4>
                    <ThemeSelector
                      currentThemeId={currentThemeId}
                      bubbleOpacity={bubbleOpacity}
                      usePrimaryColor={usePrimaryColor}
                      animationsEnabled={animationsEnabled}
                      fontScale={fontScale}
                      onThemeChange={handleThemeChange}
                      onBubbleOpacityChange={handleBubbleOpacityChange}
                      onUsePrimaryColorChange={handleUsePrimaryColorChange}
                      onAnimationsEnabledChange={handleAnimationsEnabledChange}
                      onFontScaleChange={handleFontScaleChange}
                      compact={true}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}