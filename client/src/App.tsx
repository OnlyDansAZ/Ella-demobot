import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import TestSpeech from "./components/TestSpeech";
import Admin from "@/pages/Admin";
import EllaChat from "@/pages/EllaChat";
import DemoDashboard from "@/pages/DemoDashboard";
import WhiteLabelGenerator from "@/pages/WhiteLabelGenerator";
import LaunchPage from "@/pages/LaunchPage";
import BookDemo from "@/pages/BookDemo";
import AICaller from "@/pages/AICaller";
import VoiceTest from "@/pages/VoiceTest";
import MemoryDemo from "@/pages/MemoryDemo";
import ConversationEngine from "@/pages/ConversationEngine";
import FollowupIntel from "@/pages/FollowupIntel";
import SalesIntelligence from "@/pages/SalesIntelligence";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LaunchPage} />
      <Route path="/home" component={Home} />
      <Route path="/test-speech" component={TestSpeech} />
      <Route path="/admin" component={Admin} />
      <Route path="/chat" component={EllaChat} />
      <Route path="/ella-chat" component={EllaChat} />
      <Route path="/demo-dashboard" component={DemoDashboard} />
      <Route path="/white-label" component={WhiteLabelGenerator} />
      <Route path="/book-demo" component={BookDemo} />
      <Route path="/ai-caller" component={AICaller} />
      <Route path="/voice-test" component={VoiceTest} />
      <Route path="/memory-demo" component={MemoryDemo} />
      <Route path="/conversation-engine" component={ConversationEngine} />
      <Route path="/followup" component={FollowupIntel} />
      <Route path="/followup/:id" component={FollowupIntel} />
      <Route path="/sales-intelligence" component={SalesIntelligence} />
      <Route component={NotFound} />
    </Switch>
  );
}

import { AuthProvider } from "./hooks/useAuth";
import { User } from "@shared/schema";

// Initialize with proper types
const initialAuthState = {
  user: null as User | null,
  isLoading: true,
  error: null,
  login: async () => false,
  logout: async () => false,
  register: async () => false
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </AuthProvider>
      </QueryClientProvider>
  );
}

export default App;
