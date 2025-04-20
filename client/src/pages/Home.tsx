import React from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import TierSelection from "@/components/TierSelection";
import LiveDemo from "@/components/LiveDemo";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import BotpressChat from "@/components/BotpressChat";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#111827] text-gray-100">
      <Header />
      <main>
        <Hero />
        <Features />
        <TierSelection />
        <LiveDemo />
        <Contact />
      </main>
      <Footer />
      <BotpressChat />
    </div>
  );
};

export default Home;
