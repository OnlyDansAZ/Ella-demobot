import React, { useEffect, useRef } from 'react';

// Add Calendly types to the global Window interface
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
  styles = { height: '630px' },
  prefill,
  utm
}: CalendlyEmbedProps) {
  const calendlyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Calendly script if not already loaded
    if (!document.getElementById('calendly-script')) {
      const script = document.createElement('script');
      script.id = 'calendly-script';
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.head.appendChild(script);
    }

    // Initialize Calendly widget when script is loaded and ref is available
    const initCalendly = () => {
      if (calendlyRef.current && window.Calendly) {
        window.Calendly.initInlineWidget({
          url,
          parentElement: calendlyRef.current,
          prefill,
          utm
        });
      }
    };

    // Check if Calendly is already loaded
    if (window.Calendly) {
      initCalendly();
    } else {
      // Set up event listener for when the script loads
      document.addEventListener('calendly:widget:loaded', initCalendly);
    }

    // Clean up
    return () => {
      document.removeEventListener('calendly:widget:loaded', initCalendly);
    };
  }, [url, prefill, utm]);

  return (
    <div className="calendly-embed-wrapper">
      <div className="calendly-inline-widget" ref={calendlyRef} style={styles} />
    </div>
  );
}