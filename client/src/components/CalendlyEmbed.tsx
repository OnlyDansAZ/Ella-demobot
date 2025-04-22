import React, { useEffect, useRef } from 'react';

interface CalendlyEmbedProps {
  url: string;
  styles?: React.CSSProperties;
  prefill?: {
    name?: string;
    email?: string;
    customAnswers?: {
      [key: string]: string;
    };
  };
  utm?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
  };
}

export function CalendlyEmbed({ 
  url, 
  styles = {}, 
  prefill,
  utm
}: CalendlyEmbedProps) {
  const calendlyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Make sure Calendly script is loaded
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    // Clean up
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // Initialize Calendly when the component mounts or URL changes
    if (calendlyRef.current && typeof window !== 'undefined' && window.Calendly) {
      window.Calendly.initInlineWidget({
        url: url,
        parentElement: calendlyRef.current,
        prefill: prefill,
        utm: utm
      });
    }
  }, [url, prefill, utm]);

  return (
    <div 
      className="calendly-inline-widget" 
      ref={calendlyRef}
      style={{ 
        minWidth: '320px', 
        height: '630px',
        ...styles 
      }} 
    />
  );
}

// Add type for Calendly global
declare global {
  interface Window {
    Calendly: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        prefill?: {
          name?: string;
          email?: string;
          customAnswers?: {
            [key: string]: string;
          };
        };
        utm?: {
          utmSource?: string;
          utmMedium?: string;
          utmCampaign?: string;
          utmTerm?: string;
          utmContent?: string;
        };
      }) => void;
    };
  }
}