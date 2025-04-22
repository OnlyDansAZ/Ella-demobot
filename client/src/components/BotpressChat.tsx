import React, { useEffect, useState, useRef } from "react";

interface BotpressChatProps {
  enabled?: boolean; // Optional prop to control whether the chat is displayed
}

const BotpressChat: React.FC<BotpressChatProps> = ({ enabled = false }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    // If disabled, don't load Botpress
    if (!enabled) return;
    
    // Use shareable link from Botpress
    const shareableLink = "https://cdn.botpress.cloud/webchat/v2.3/shareable.html?configUrl=https://files.bpcontent.cloud/2025/04/17/12/20250417122849-GAAFK7D8.json";
    
    // Create iframe element
    const iframe = document.createElement("iframe");
    iframe.src = shareableLink;
    
    // Set iframe styles
    iframe.style.border = "none";
    iframe.style.position = "fixed";
    iframe.style.bottom = "20px";
    iframe.style.right = "20px";
    iframe.style.width = "400px";
    iframe.style.height = "600px";
    iframe.style.maxHeight = "80vh";
    iframe.style.maxWidth = "90vw";
    iframe.style.zIndex = "9999";
    iframe.style.borderRadius = "10px";
    iframe.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.3)";
    
    // Add loading and error handlers
    iframe.onload = () => {
      setIsLoaded(true);
      console.log("Botpress chat iframe loaded successfully");
    };
    
    iframe.onerror = () => {
      setLoadError("Failed to load Botpress chat iframe");
      console.error("Failed to load Botpress chat iframe");
    };
    
    // Add iframe to document
    document.body.appendChild(iframe);
    
    // Save reference to iframe
    iframeRef.current = iframe;
    
    // Cleanup function
    return () => {
      if (iframe && document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };
  }, [enabled]);

  // If disabled or no error, render nothing
  if (!enabled || !loadError) return null;
  
  // Show error message if loading fails and enabled
  return (
    <div className="p-4 text-sm text-red-500 fixed bottom-4 right-4 bg-white rounded shadow-lg z-50">
      <p>Chatbot temporarily unavailable. Please try again later.</p>
      {/* Only show detailed error in development */}
      {import.meta.env.DEV && <p className="text-xs mt-1">{loadError}</p>}
    </div>
  );
};

export default BotpressChat;
