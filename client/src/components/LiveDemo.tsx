import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { getBotResponse } from "@/lib/botResponses";

interface Message {
  text: string;
  isUser: boolean;
}

const LiveDemo: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm Luna Tuna, your YoBot assistant. I'm here to demonstrate my capabilities. What would you like to know about my features?",
      isUser: false,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage = {
      text: inputValue,
      isUser: true,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    
    // Add bot response after a delay
    setTimeout(() => {
      const botResponse = {
        text: getBotResponse(inputValue),
        isUser: false,
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <section id="demo" className="py-16 px-4 bg-gray-800">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Try Luna Tuna in Action</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Experience our AI assistant with this live demo. Ask questions,
            schedule meetings, or explore other features.
          </p>
        </div>

        <div className="mx-auto max-w-2xl bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
          <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center">
              <img
                src="https://www.yobot.store/images/yobot-logo-blue.png"
                alt="Luna Tuna"
                className="h-8 w-8 bg-white rounded-full p-1 mr-3"
              />
              <h3 className="font-medium">Luna Tuna</h3>
            </div>
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
          </div>
          <div 
            ref={messagesContainerRef}
            className="p-4 h-96 overflow-y-auto space-y-4"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.isUser ? "justify-end" : "items-start"
                }`}
              >
                <div
                  className={`${
                    message.isUser
                      ? "bg-gray-700 text-white rounded-lg rounded-tr-none"
                      : "bg-[#0D82DA] text-white rounded-lg rounded-tl-none"
                  } p-3 max-w-md`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-700">
            <form onSubmit={handleSubmit} className="flex">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-gray-700 text-white placeholder-gray-400 rounded-l-md px-4 py-2 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="bg-[#0D82DA] hover:bg-blue-600 text-white px-4 py-2 rounded-r-md transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveDemo;
