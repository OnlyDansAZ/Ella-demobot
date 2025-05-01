import React from "react";
import { Link } from "wouter";

const Hero: React.FC = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-[#111827] to-gray-900">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-12 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Meet Your{" "}
              <span className="text-[#0D82DA]">AI-Powered</span> Assistant
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Custom personalities. Real conversations. Total control.
              Experience the future of automated assistance with YoBot's Ella.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/chat"
                className="bg-[#0D82DA] hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-md text-center transition-colors"
              >
                Chat with Ella
              </Link>
              <Link
                href="/admin"
                className="border border-gray-500 hover:border-white text-white font-medium px-6 py-3 rounded-md text-center transition-colors"
              >
                Admin Panel
              </Link>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              <span className="opacity-80">✓ Client-facing chat</span>
              <span className="mx-2">|</span>
              <span className="opacity-80">✓ Admin backend for knowledge uploads</span>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="bg-[#1F2937] p-6 rounded-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#0D82DA]/20 to-transparent rounded-bl-full"></div>

              {/* Chat Preview */}
              <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                <div className="p-3 bg-gray-900 border-b border-gray-700 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <div className="ml-2 text-sm font-medium">Ella</div>
                </div>
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                  <div className="flex items-start">
                    <div className="bg-[#0D82DA] text-white p-3 rounded-lg rounded-tl-none max-w-xs">
                      Hey there! I'm Ella, your AI assistant. How can I help
                      you today?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-gray-700 text-white p-3 rounded-lg rounded-tr-none max-w-xs">
                      Can you schedule a meeting with my team for tomorrow?
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-[#0D82DA] text-white p-3 rounded-lg rounded-tl-none max-w-xs">
                      I'd be happy to! What time works best, and would you like
                      me to send calendar invites to everyone?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-gray-700 text-white p-3 rounded-lg rounded-tr-none max-w-xs">
                      Yes please, 2pm tomorrow. Send to the marketing team.
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-[#0D82DA] text-white p-3 rounded-lg rounded-tl-none max-w-xs">
                      Great! I've scheduled a meeting for 2:00 PM tomorrow with
                      the marketing team. Calendar invites have been sent. Would
                      you like me to prepare an agenda as well?
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-gray-700 flex">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-700 text-white placeholder-gray-400 rounded-l-md px-4 py-2 focus:outline-none"
                  />
                  <button className="bg-[#0D82DA] hover:bg-blue-600 text-white px-4 py-2 rounded-r-md transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;