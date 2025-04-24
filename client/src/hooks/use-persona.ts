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
  error?: string; // Optional error message if success is false
}

/**
 * Hook for server-side persona management
 */
export const usePersona = (sessionId: string) => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all available personas with enhanced error handling
  const loadPersonas = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/personas')
        .catch(fetchError => {
          console.error('Network error when loading personas:', fetchError);
          throw new Error('Failed to connect to server. Please check your connection.');
        });
      
      // Handle non-OK HTTP responses
      if (!response.ok) {
        console.error(`Server error when loading personas: ${response.status} ${response.statusText}`);
        setError(`Server error: ${response.status}. Using default personas as fallback.`);
        
        // Set some default personas if we can't load from server
        setPersonas([{
          id: 'default',
          name: 'Default Assistant',
          description: 'The standard assistant personality',
          systemPrompt: 'You are a helpful assistant.',
          isDefault: true
        }]);
        return;
      }
      
      // Parse response data safely
      let data: PersonasResponse;
      try {
        data = await response.json() as PersonasResponse;
      } catch (jsonError) {
        console.error('Error parsing personas JSON response:', jsonError);
        setError('Invalid response format. Using default personas as fallback.');
        setPersonas([{
          id: 'default',
          name: 'Default Assistant',
          description: 'The standard assistant personality',
          systemPrompt: 'You are a helpful assistant.',
          isDefault: true
        }]);
        return;
      }
      
      if (data.success && data.personas && data.personas.length > 0) {
        setPersonas(data.personas);
        console.log(`Loaded ${data.personas.length} personas successfully`);
        
        // Log the voice settings of each persona
        data.personas.forEach(persona => {
          if (persona.voiceSettings) {
            console.log(`${persona.name} voice settings:`, persona.voiceSettings);
          }
        });
      } else {
        console.warn('No personas received from server or empty personas array');
        setError('Failed to load personas. Using default as fallback.');
        setPersonas([{
          id: 'default',
          name: 'Default Assistant',
          description: 'The standard assistant personality',
          systemPrompt: 'You are a helpful assistant.',
          isDefault: true
        }]);
      }
    } catch (err) {
      console.error('Error loading personas:', err);
      setError('Failed to load personas. Using default as fallback.');
      setPersonas([{
        id: 'default',
        name: 'Default Assistant',
        description: 'The standard assistant personality',
        systemPrompt: 'You are a helpful assistant.',
        isDefault: true
      }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load the current persona for this session with enhanced error handling
  const loadCurrentPersona = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/personas/session/${sessionId}`)
        .catch(fetchError => {
          console.error('Network error when loading current persona:', fetchError);
          throw new Error('Failed to connect to server. Please check your connection.');
        });
      
      // Handle non-OK HTTP responses
      if (!response.ok) {
        console.error(`Server error: ${response.status} ${response.statusText}`);
        setError(`Server error: ${response.status}. Using default persona as fallback.`);
        
        // If we can't load the current persona, set it to null but don't block the application
        setCurrentPersona(null);
        return;
      }
      
      // Parse response data safely
      let data: PersonaResponse;
      try {
        data = await response.json() as PersonaResponse;
      } catch (jsonError) {
        console.error('Error parsing persona JSON response:', jsonError);
        setError('Invalid response format. Using default persona as fallback.');
        setCurrentPersona(null);
        return;
      }
      
      if (data.success && data.persona) {
        setCurrentPersona(data.persona);
        console.log(`Loaded current persona: ${data.persona.name}`);
        
        // Log voice and behavior settings if available
        if (data.persona.voiceSettings) {
          console.log(`Current persona voice settings:`, data.persona.voiceSettings);
        }
        if (data.persona.behaviorModifiers) {
          console.log(`Current persona behavior modifiers:`, data.persona.behaviorModifiers);
        }
      } else {
        console.warn('No persona found for session, using default');
        setError(data.error || 'Failed to load current persona');
        setCurrentPersona(null);
      }
    } catch (err) {
      console.error('Error loading current persona:', err);
      setError('Failed to load current persona. Using default as fallback.');
      setCurrentPersona(null);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Set the session's persona by ID with enhanced error handling
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
      
      // Handle non-OK HTTP responses
      if (!response.ok) {
        console.error(`Server error: ${response.status} ${response.statusText}`);
        setError(`Server error: ${response.status}. Please try again later.`);
        return false;
      }
      
      const data = await response.json() as PersonaResponse;
      
      if (data.success && data.persona) {
        setCurrentPersona(data.persona);
        // Log the newly set persona's voice and behavior settings
        if (data.persona.voiceSettings) {
          console.log(`Applied voice settings for ${data.persona.name}:`, data.persona.voiceSettings);
        }
        if (data.persona.behaviorModifiers) {
          console.log(`Applied behavior modifiers for ${data.persona.name}:`, data.persona.behaviorModifiers);
        }
        return true;
      } else {
        const errorMsg = data.error || 'Failed to set persona';
        console.error('Failed to set persona:', errorMsg);
        setError(errorMsg);
        return false;
      }
    } catch (err) {
      console.error('Error setting persona:', err);
      setError('Failed to set persona. Please check your connection and try again.');
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
      
      // Handle non-OK HTTP responses
      if (!response.ok) {
        console.error(`Server error: ${response.status} ${response.statusText}`);
        setError(`Server error: ${response.status}. Please try again later.`);
        return false;
      }
      
      const data = await response.json() as PersonaResponse;
      
      if (data.success && data.persona) {
        setCurrentPersona(data.persona);
        console.log(`Applied custom persona with prompt: "${customPrompt.substring(0, 50)}..."`);
        return true;
      } else {
        const errorMsg = data.error || 'Failed to set custom persona';
        console.error('Failed to set custom persona:', errorMsg);
        setError(errorMsg);
        return false;
      }
    } catch (err) {
      console.error('Error setting custom persona:', err);
      setError('Failed to set custom persona. Please check your connection and try again.');
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
      
      // Handle non-OK HTTP responses
      if (!response.ok) {
        console.error(`Server error: ${response.status} ${response.statusText}`);
        setError(`Server error: ${response.status}. Please try again later.`);
        return false;
      }
      
      const data = await response.json() as PersonaResponse;
      
      if (data.success && data.persona) {
        setCurrentPersona(data.persona);
        console.log('Reset to default persona:', data.persona.name);
        // Log the default persona's voice and behavior settings if available
        if (data.persona.voiceSettings) {
          console.log(`Default persona voice settings:`, data.persona.voiceSettings);
        }
        if (data.persona.behaviorModifiers) {
          console.log(`Default persona behavior modifiers:`, data.persona.behaviorModifiers);
        }
        return true;
      } else {
        const errorMsg = data.error || 'Failed to reset persona';
        console.error('Failed to reset persona:', errorMsg);
        setError(errorMsg);
        return false;
      }
    } catch (err) {
      console.error('Error resetting persona:', err);
      setError('Failed to reset persona. Please check your connection and try again.');
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