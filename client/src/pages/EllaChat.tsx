import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Send, Volume2, VolumeX, ArrowLeft, User, Brain, Edit, Calendar, Clock, MapPin, AlertCircle, Briefcase, Trash2, Palette, Image, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Link } from 'wouter';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { customPersonaTemplate } from '@/lib/personas';
import { usePersona, Persona } from '@/hooks/use-persona';
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
  
  // Use backend persona management through our hook
  const { 
    personas, 
    currentPersona, 
    isLoading: isLoadingPersona, 
    setPersona, 
    setCustomPersona,
    resetToDefaultPersona
  } = usePersona(sessionId);
  
  // Local state for custom persona text input
  const [customPersonaText, setCustomPersonaText] = useState(customPersonaTemplate);
  const [useCustomPersona, setUseCustomPersona] = useState(false);
  
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
  
  // Image generation state
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<"1024x1024" | "1792x1024" | "1024x1792">("1024x1024");
  
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
  
  // Function to generate image
  const generateImage = async () => {
    if (!imagePrompt.trim()) return;
    
    setIsGeneratingImage(true);
    setImageError(null);
    
    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          prompt: imagePrompt,
          size: imageSize
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        
        // Add the image generation to the conversation
        await addMessage(`Generate an image of: ${imagePrompt}`, true);
        await addMessage(`I've created this image for you: ${data.imageUrl}`, false);
        
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      setImageError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsGeneratingImage(false);
    }
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
          sessionId: sessionId, // Include the session ID for backend persona and tracking
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
  
  // Detect if running on mobile device
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Helper function to restart speech recognition
  const restartListening = () => {
    // Only restart if we're supposed to be in listening mode
    if (isListening) {
      // Longer delay for mobile devices
      const delay = isMobileDevice() ? 500 : 300;
      
      // Small delay to allow previous instance to fully terminate
      setTimeout(() => {
        startRecognition();
      }, delay);
    }
  };
  
  // Check for iOS device
  const isIOS = () => {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  };
  
  // Check for Android device
  const isAndroid = () => {
    return /Android/i.test(navigator.userAgent);
  };
  
  // Special iOS workaround
  const prepareIOSForSpeech = () => {
    if (window.speechSynthesis) {
      // Create short utterance - this helps "warm up" speech systems on iOS
      const utterance = new SpeechSynthesisUtterance(' ');
      utterance.volume = 0; // Silent
      utterance.rate = 10; // Super fast to finish immediately
      window.speechSynthesis.speak(utterance);
      console.log('iOS speech synthesis warmed up');
    }
  };
  
  // Request microphone access explicitly - this helps on many mobile browsers
  const requestMicrophoneAccess = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('MediaDevices API not supported in this browser');
        return false;
      }
      
      // Request audio access with constraints that tend to work better on mobile
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Successfully got permission, now immediately stop all tracks
      // This releases the microphone but keeps the permission
      stream.getTracks().forEach(track => track.stop());
      
      console.log('Explicit microphone permission granted');
      return true;
    } catch (error) {
      console.error('Failed to get microphone permission:', error);
      alert('Microphone access is required for voice input. Please check your browser settings and try again.');
      return false;
    }
  };
  
  // Simplified mobile speech recognition for better reliability
  const startMobileRecognition = async () => {
    console.log('Using simplified mobile speech recognition');
    
    try {
      // 1. Always confirm microphone permission first - crucial for mobile
      const hasPermission = await requestMicrophoneAccess();
      if (!hasPermission) {
        console.error('Could not get microphone permission for mobile');
        setIsListening(false);
        return;
      }
      
      // 2. For iOS devices, prepare speech synthesis (helps initialize audio system)
      if (isIOS()) {
        console.log('iOS device detected, performing special initialization');
        prepareIOSForSpeech();
      }
      
      // 3. Always create a fresh instance for each recognition attempt on mobile
      //    This avoids many common issues with reusing instances
      console.log('Creating fresh speech recognition instance for mobile');
      
      if (recognitionRef.current) {
        try {
          // Clean up any existing instance
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
          recognitionRef.current.stop();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      
      // Create a new instance with very simple settings
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Absolute minimum settings for maximum compatibility
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-US';
      
      // Set up simple handlers directly on this instance
      recognition.onstart = () => {
        console.log('Mobile speech recognition started');
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        try {
          if (event.results && event.results[0]) {
            const transcript = event.results[0][0].transcript.trim();
            const confidence = event.results[0][0].confidence || 0.8; // Default reasonable confidence
            
            console.log(`Mobile speech recognized: "${transcript}" (${Math.round(confidence * 100)}%)`);
            
            // Update input field
            setInputMessage(transcript);
            
            // Auto-submit with delay for feedback
            if (transcript && transcript.length > 0) {
              setTimeout(() => {
                sendMessageWithText(transcript);
              }, 300);
            }
          } else {
            console.warn('Empty speech recognition result');
          }
        } catch (error) {
          console.error('Error processing speech result:', error);
        } finally {
          setIsListening(false);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Mobile speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          alert('Microphone access is needed for voice input. Please enable it in your browser settings.');
        }
      };
      
      recognition.onend = () => {
        console.log('Mobile speech recognition ended');
        setIsListening(false);
      };
      
      // Store the instance
      recognitionRef.current = recognition;
      
      // 4. Start with a small delay (improves success on mobile browsers)
      setTimeout(() => {
        try {
          recognition.start();
        } catch (error) {
          console.error('Failed to start mobile speech recognition:', error);
          setIsListening(false);
          
          if (error instanceof DOMException && isIOS()) {
            alert('Voice recognition is not working on this iOS device. Please try typing your message instead.');
          } else {
            alert('Could not start voice input. Please try again or type your message.');
          }
        }
      }, isIOS() ? 150 : 50);
      
    } catch (error) {
      console.error('Mobile speech recognition setup error:', error);
      setIsListening(false);
    }
  };
  
  // More robust desktop speech recognition with features
  const startDesktopRecognition = () => {
    console.log('Using desktop speech recognition');
    
    try {
      // Always clean up any existing instance first
      if (recognitionRef.current) {
        try {
          // Clean up old handlers
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
          recognitionRef.current.stop();
        } catch (err) {
          // Ignore cleanup errors
        }
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Desktop settings - we can use more advanced features
      recognition.continuous = true;
      recognition.interimResults = true; 
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-US';
      
      let finalTranscript = '';
      let interimTranscript = '';
      
      recognition.onstart = () => {
        setIsListening(true);
        console.log('Desktop speech recognition started');
        // Reset transcripts
        finalTranscript = '';
        interimTranscript = '';
      };
      
      recognition.onresult = (event: any) => {
        let updatedFinal = finalTranscript;
        interimTranscript = '';
        
        // Process all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          setVoiceConfidence(confidence);
          
          if (event.results[i].isFinal) {
            updatedFinal += ' ' + transcript;
            console.log(`Desktop speech recognized (final): "${transcript}" (${Math.round(confidence * 100)}%)`);
          } else {
            interimTranscript += transcript;
            console.log(`Desktop speech recognized (interim): "${transcript}" (${Math.round(confidence * 100)}%)`);
          }
        }
        
        finalTranscript = updatedFinal;
        
        // Update UI with current transcript (either final or interim)
        setInputMessage(finalTranscript || interimTranscript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Desktop speech recognition error:', event.error);
        
        if (event.error === 'not-allowed') {
          alert('Microphone access is needed for voice input. Please enable it in your browser settings.');
        }
        
        setIsListening(false);
      };
      
      recognition.onend = () => {
        console.log('Desktop speech recognition ended');
        
        // If we have a finalTranscript and it's not empty, send the message
        if (finalTranscript.trim()) {
          // Small delay to allow UI to update
          setTimeout(() => {
            sendMessageWithText(finalTranscript.trim());
          }, 100);
        }
        
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
      
      recognition.start();
    } catch (error) {
      console.error('Desktop speech recognition setup error:', error);
      setIsListening(false);
      
      alert('Could not start voice input. Please try again or type your message.');
    }
  };
  
  // Wrapper function to start the appropriate recognition based on device
  const startRecognition = () => {
    // Get appropriate speech recognition based on device detection
    if (isMobileDevice()) {
      startMobileRecognition();
    } else {
      startDesktopRecognition();
    }
  };
  
  // Toggle speech recognition on/off
  const toggleListening = () => {
    if (isListening) {
      try {
        // Already listening, stop it
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
      
      setIsListening(false);
    } else {
      // Not listening, start it with the appropriate method
      startRecognition();
    }
  };
  
  // Function to play text response audio using ElevenLabs with persona-specific voice
  const playAudio = async (text: string) => {
    if (!text || text.trim() === '') return;
    
    try {
      // If there's currently audio playing, stop it
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      
      setIsSpeaking(true);
      
      // Get the current persona information
      const activePersona = currentPersona?.id || 'default';
      console.log(`Using persona for speech: ${activePersona}`);
      
      // Call the server to generate and return audio with session and persona info
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text,
          // Include the session ID so the server can use persona-specific voice settings
          sessionId: sessionId,
          // Fallback options in case no persona voice settings are found
          options: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.5,
            useSpeakerBoost: true
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }
      
      // Create audio blob from the response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Play the audio
      const audio = new Audio(audioUrl);
      audio.volume = volume / 100;
      
      // Set handlers
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      
      audio.onerror = (err) => {
        console.error('Audio playback error:', err);
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      
      currentAudioRef.current = audio;
      audio.play();
      
    } catch (error) {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
    }
  };
  
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
                    transition={{ duration: animationsEnabled ? 0.3 : 0, delay: animationsEnabled ? index * 0.05 : 0 }}
                  >
                    <motion.div 
                      className={`rounded-2xl px-3 py-2 max-w-[85%] sm:max-w-[75%] shadow-sm
                        ${message.isUser 
                          ? 'bg-[var(--user-bubble-bg)] text-[var(--user-bubble-text)]' 
                          : 'bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-foreground'
                        }`}
                      style={{
                        opacity: message.isUser ? bubbleOpacity : 1
                      }}
                    >
                      {/* Header for assistant messages */}
                      {!message.isUser && (
                        <div className="flex items-center gap-1 mb-1">
                          <Avatar className="h-4 w-4 rounded-full overflow-hidden">
                            <img src={yobotHeadLogo} alt="Ella" className="h-full w-full object-contain" />
                          </Avatar>
                          <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">Ella</span>
                        </div>
                      )}
                      
                      <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                      <div className="text-[8px] opacity-60 text-right mt-1">
                        {new Date(message.timestamp).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
                
                {/* Loader for when a message is being generated */}
                {isLoading && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div 
                      className="rounded-2xl px-3 py-2 max-w-[85%] sm:max-w-[75%] shadow-sm
                        bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-foreground"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Avatar className="h-4 w-4 rounded-full overflow-hidden">
                          <img src={yobotHeadLogo} alt="Ella" className="h-full w-full object-contain" />
                        </Avatar>
                        <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">Ella</span>
                      </div>
                      <div className="flex items-center gap-3 py-2">
                        <div className="flex space-x-1.5">
                          <motion.div 
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          <motion.div 
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.div 
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
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
                    <div className="space-y-2">
                      {isLoadingAppointments ? (
                        <div className="flex items-center justify-center p-4">
                          <div className="flex flex-col items-center">
                            <div className="flex space-x-1.5 mb-2">
                              <motion.div 
                                className="w-2 h-2 rounded-full bg-blue-500"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              />
                              <motion.div 
                                className="w-2 h-2 rounded-full bg-blue-500"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                              />
                              <motion.div 
                                className="w-2 h-2 rounded-full bg-blue-500"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">Loading your appointments...</span>
                          </div>
                        </div>
                      ) : appointments.length > 0 ? (
                        appointments.map(appointment => (
                          <div key={appointment.id} className="p-2 rounded-md border bg-white dark:bg-gray-900">
                            <div className="flex flex-col sm:flex-row gap-2">
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
                            <p className="text-sm text-muted-foreground">You don't have any upcoming appointments.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            
            <div className="p-2 sm:p-4 border-t">
              <div className="flex items-center space-x-2">
                <Button
                  size="icon"
                  className={`h-8 w-8 ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'}`}
                  onClick={toggleListening}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? (
                    <MicOff className="h-5 w-5 sm:h-4 sm:w-4 text-white" />
                  ) : (
                    <Mic className="h-5 w-5 sm:h-4 sm:w-4" />
                  )}
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
                  className="h-8 w-8 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600"
                  onClick={() => setShowImageDialog(true)}
                  disabled={isLoading}
                  title="Generate an image"
                >
                  <Image className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 ml-1"
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
                        value={useCustomPersona ? "" : (currentPersona?.id || "")}
                        onValueChange={(value) => {
                          setPersona(value);
                          setUseCustomPersona(false);
                        }}
                        disabled={useCustomPersona || isLoadingPersona}
                      >
                        <SelectTrigger className="w-full h-7 text-[10px] sm:text-xs">
                          <SelectValue placeholder="Select a persona" />
                        </SelectTrigger>
                        <SelectContent>
                          {personas.map((persona) => (
                            <SelectItem key={persona.id} value={persona.id} className="text-[10px] sm:text-xs">
                              {persona.name}
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
                          onCheckedChange={(checked) => {
                            setUseCustomPersona(checked);
                            if (!checked) {
                              // Reset to default when unchecking custom persona
                              resetToDefaultPersona();
                            }
                          }}
                          disabled={isLoadingPersona}
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 w-full text-[10px] sm:text-xs"
                        onClick={() => setCustomPersona(customPersonaText)}
                        disabled={isLoadingPersona || !customPersonaText.trim()}
                      >
                        Apply Custom Persona
                      </Button>
                    </div>
                  )}
                  
                  {!useCustomPersona && currentPersona && (
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 bg-muted p-1.5 rounded">
                      <div className="font-medium">Description:</div>
                      <p>{currentPersona.description || 'Helpful AI assistant'}</p>
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
      
      {/* Image Generation Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-blue-500" />
              Generate Image with Ella
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="image-prompt">Image Description</Label>
              <Textarea
                id="image-prompt"
                placeholder="Describe the image you want to generate..."
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image-size">Image Size</Label>
              <Select value={imageSize} onValueChange={(value) => setImageSize(value as any)}>
                <SelectTrigger id="image-size">
                  <SelectValue placeholder="Select image size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">Square (1024×1024)</SelectItem>
                  <SelectItem value="1792x1024">Landscape (1792×1024)</SelectItem>
                  <SelectItem value="1024x1792">Portrait (1024×1792)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {imageError && (
              <div className="bg-red-50 text-red-600 p-2 rounded-md border border-red-200 text-sm flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{imageError}</span>
              </div>
            )}
            
            {generatedImageUrl && (
              <div className="border rounded-md overflow-hidden">
                <img
                  src={generatedImageUrl}
                  alt={imagePrompt}
                  className="w-full h-auto object-contain"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImageDialog(false);
                setImagePrompt('');
                setGeneratedImageUrl(null);
                setImageError(null);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={generateImage} 
              disabled={isGeneratingImage || !imagePrompt.trim()}
              className="gap-2"
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Image className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}