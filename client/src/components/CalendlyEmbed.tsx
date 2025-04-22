import React, { useEffect, useRef } from 'react';

// Define the Calendly global object type
declare global {
  interface Window {
    Calendly?: {
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

/**
 * Component for embedding Calendly scheduling widget within the application
 */
export function CalendlyEmbed({ 
  url, 
  styles = {}, 
  prefill = {}, 
  utm = {} 
}: CalendlyEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Calendly inline script if it's not already loaded
    if (!document.getElementById('calendly-script')) {
      const script = document.createElement('script');
      script.id = 'calendly-script';
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);

      // Clean up script on unmount if we added it
      return () => {
        document.body.removeChild(script);
      };
    }

    // Initialize the Calendly widget once the script is loaded
    const initializeCalendly = () => {
      if (containerRef.current && window.Calendly) {
        window.Calendly.initInlineWidget({
          url,
          parentElement: containerRef.current,
          prefill,
          utm
        });
      }
    };

    // Check if Calendly is already loaded, if not, wait for the script to load
    if (window.Calendly) {
      initializeCalendly();
    } else {
      const calendlyScript = document.getElementById('calendly-script');
      if (calendlyScript) {
        calendlyScript.addEventListener('load', initializeCalendly);
      }
    }

    // Clean up event listener
    return () => {
      const calendlyScript = document.getElementById('calendly-script');
      if (calendlyScript) {
        calendlyScript.removeEventListener('load', initializeCalendly);
      }
    };
  }, [url, prefill, utm]);

  return (
    <div 
      ref={containerRef} 
      className="calendly-inline-widget" 
      style={{ 
        minWidth: '320px', 
        height: '630px', 
        ...styles 
      }} 
    />
  );
}