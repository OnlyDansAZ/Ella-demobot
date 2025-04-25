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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
