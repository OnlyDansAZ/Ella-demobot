import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

// Voice settings interface (matching server-side definition)
export interface VoiceSettings {
  stability: number;       // Controls stability of voice (0.0 to 1.0)
  similarityBoost: number; // Controls similarity to source voice (0.0 to 1.0)
  style: number;           // Controls style injection (0.0 to 1.0)
  useSpeakerBoost: boolean;// Whether to enhance speaker clarity
  voiceId?: string;        // Optional custom voice ID from ElevenLabs
}

// Behavior modifiers interface (matching server-side definition)
export interface BehaviorModifiers {
  usesEmojis: boolean;    // Whether this persona uses emojis
  verbosity: number;      // Controls response length (0.1=brief, 0.5=balanced, 1.0=detailed)
  formality: number;      // Controls formality (0.1=casual, 0.5=balanced, 1.0=formal)
  creativity: number;     // Controls creativity (0.1=factual, 0.5=balanced, 1.0=creative)
  persuasiveness: number; // Controls persuasiveness (0.1=neutral, 0.5=balanced, 1.0=persuasive)
  usesBulletPoints: boolean; // Whether this persona organizes content with bullet points
  preferredResponseFormat?: string; // Optional preferred response format instruction
}

// Define persona interface (matching server's definition)
export interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  isDefault?: boolean;
  
  // New fields for persona-specific voice and behavior
  voiceSettings?: VoiceSettings;
  behaviorModifiers?: BehaviorModifiers;
}

// Define response types for API
interface PersonasResponse {
  success: boolean;
  personas: Persona[];
}

interface PersonaResponse {
  success: boolean;
  persona: Persona;
  personaId: string;
}

/**
 * Hook for server-side persona management
 */
export const usePersona = (sessionId: string) => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all available personas
  const loadPersonas = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/personas');
      const data = await response.json() as PersonasResponse;
      
      if (data.success && data.personas) {
        setPersonas(data.personas);
      } else {
        setError('Failed to load personas');
      }
    } catch (err) {
      console.error('Error loading personas:', err);
      setError('Failed to load personas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load the current persona for this session
  const loadCurrentPersona = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/personas/session/${sessionId}`);
      const data = await response.json() as PersonaResponse;
      
      if (data.success && data.persona) {
        setCurrentPersona(data.persona);
      } else {
        setError('Failed to load current persona');
      }
    } catch (err) {
      console.error('Error loading current persona:', err);
      setError('Failed to load current persona');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Set the session's persona by ID
  const setPersona = useCallback(async (personaId: string) => {
    if (!sessionId) return false;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/personas/session/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personaId
        })
      });
      
      const data = await response.json() as PersonaResponse;
      
      if (data.success && data.persona) {
        setCurrentPersona(data.persona);
        return true;
      } else {
        setError('Failed to set persona');
        return false;
      }
    } catch (err) {
      console.error('Error setting persona:', err);
      setError('Failed to set persona');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Set a custom persona with custom instructions
  const setCustomPersona = useCallback(async (customPrompt: string) => {
    if (!sessionId) return false;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/personas/session/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customPrompt
        })
      });
      
      const data = await response.json() as PersonaResponse;
      
      if (data.success && data.persona) {
        setCurrentPersona(data.persona);
        return true;
      } else {
        setError('Failed to set custom persona');
        return false;
      }
    } catch (err) {
      console.error('Error setting custom persona:', err);
      setError('Failed to set custom persona');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Reset to default persona
  const resetToDefaultPersona = useCallback(async () => {
    if (!sessionId) return false;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/personas/session/${sessionId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json() as PersonaResponse;
      
      if (data.success && data.persona) {
        setCurrentPersona(data.persona);
        return true;
      } else {
        setError('Failed to reset persona');
        return false;
      }
    } catch (err) {
      console.error('Error resetting persona:', err);
      setError('Failed to reset persona');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Load personas and current persona on mount
  useEffect(() => {
    loadPersonas();
    loadCurrentPersona();
  }, [loadPersonas, loadCurrentPersona]);

  return {
    personas,
    currentPersona,
    isLoading,
    error,
    setPersona,
    setCustomPersona,
    resetToDefaultPersona,
    loadPersonas,
    loadCurrentPersona
  };
};