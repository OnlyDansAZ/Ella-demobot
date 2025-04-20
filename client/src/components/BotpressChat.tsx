import React, { useEffect, useState } from "react";

declare global {
  interface Window {
    botpressWebChat?: {
      init: (config: any) => void;
    };
  }
}

const BotpressChat: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Check if script is already loaded
    if (document.querySelector('script[src="https://cdn.botpress.cloud/webchat/v2/inject.js"]')) {
      setIsLoaded(true);
      return;
    }

    // Add Botpress script to the document
    const script = document.createElement("script");
    script.src = "https://cdn.botpress.cloud/webchat/v2/inject.js";
    script.async = true;
    
    // Handle loading errors
    script.onerror = () => {
      setLoadError("Failed to load Botpress chat script");
      console.error("Failed to load Botpress chat script");
    };
    
    script.onload = () => {
      setIsLoaded(true);
      console.log("Botpress script loaded successfully");
      
      // Give time for the script to initialize
      setTimeout(() => {
        try {
          if (window.botpressWebChat) {
            window.botpressWebChat.init({
              "botId": "0bd9d0e4-a167-4bfb-97ae-7422bc7f98c3", // Your provided Bot ID
              "hostUrl": "https://cdn.botpress.cloud/webchat/v2",
              "messagingUrl": "https://messaging.botpress.cloud",
              "clientId": "01JS1FVRPGCP54ZKENQJ8WZCMP", // Your provided Client ID
              "botName": "YoBot Assistant",
              "avatarUrl": "https://img.icons8.com/color/96/000000/bot.png", 
              "stylesheet": "https://cdn.botpress.cloud/webchat/v2/themes/default.css",
              "enableConversationDeletion": true,
              "showPoweredBy": false,
              "useSessionStorage": true,
              "containerWidth": "100%",
              "layoutWidth": "100%",
              "theme": "dark"
            });
            console.log("Botpress webchat initialized");
          } else {
            console.error("Botpress webchat is not available after script load");
            setLoadError("Botpress chat integration is not available");
          }
        } catch (err) {
          console.error("Error initializing Botpress chat:", err);
          setLoadError(`Error initializing chat: ${err instanceof Error ? err.message : String(err)}`);
        }
      }, 1000); // Wait 1 second for script to fully initialize
    };
    
    document.body.appendChild(script);

    // Cleanup
    return () => {
      // Only remove if it exists and was added by this component
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // This component doesn't render anything directly, but we could add error messaging if needed
  return loadError ? (
    <div className="p-4 text-sm text-red-500">
      <p>Chatbot temporarily unavailable. Please try again later.</p>
      {/* Only show detailed error in development */}
      {import.meta.env.DEV && <p className="text-xs mt-1">{loadError}</p>}
    </div>
  ) : null;
};

export default BotpressChat;
