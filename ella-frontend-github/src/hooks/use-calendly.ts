import { useState, useEffect } from 'react';

interface UseCalendlyResult {
  calendlyUrl: string;
  isLoading: boolean;
  error: string | null;
  meetingTypes: MeetingType[];
}

interface MeetingType {
  id: string;
  name: string;
  description: string;
  url: string;
}

/**
 * Custom hook to get Calendly meeting data from the API
 */
export function useCalendly(): UseCalendlyResult {
  const [calendlyUrl, setCalendlyUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);

  useEffect(() => {
    const fetchCalendlyData = async () => {
      try {
        // Get the default Calendly URL
        const urlResponse = await fetch('/api/calendly/url');
        if (!urlResponse.ok) {
          throw new Error('Failed to fetch Calendly URL');
        }
        const urlData = await urlResponse.json();
        
        if (urlData.success && urlData.url) {
          setCalendlyUrl(urlData.url);
        } else {
          throw new Error('Invalid response format for Calendly URL');
        }

        // Get meeting types
        const typesResponse = await fetch('/api/calendly/meeting-types');
        if (!typesResponse.ok) {
          throw new Error('Failed to fetch meeting types');
        }
        const typesData = await typesResponse.json();
        
        if (typesData.success && Array.isArray(typesData.meetingTypes)) {
          setMeetingTypes(typesData.meetingTypes);
        } else {
          throw new Error('Invalid response format for meeting types');
        }
      } catch (err) {
        console.error('Error fetching Calendly data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendlyData();
  }, []);

  return {
    calendlyUrl,
    isLoading,
    error,
    meetingTypes
  };
}