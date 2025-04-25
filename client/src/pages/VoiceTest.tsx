import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function VoiceTest() {
  const [text, setText] = useState("Hello, I'm Ella from YoBot. I'm designed to sound as human and natural as possible. How can I help you today?");
  const [loading, setLoading] = useState(false);
  const [voiceGender, setVoiceGender] = useState("female");
  const [stability, setStability] = useState(0.3);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text) {
      toast({
        title: "Text is required",
        description: "Please enter text to generate speech",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/test-voice", {
        text,
        voiceGender,
        stabilityLevel: stability
      });
      
      const data = await response.json();
      
      if (data.success && data.audioUrl) {
        setAudioUrl(data.audioUrl);
        
        // Auto-play the audio when it's ready
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(err => {
              console.error("Failed to auto-play audio:", err);
              toast({
                title: "Auto-play failed",
                description: "Click the play button to hear the voice sample",
                variant: "default"
              });
            });
          }
        }, 500);
        
        toast({
          title: "Voice generated successfully!",
          description: "Listen to the premium voice sample",
          variant: "default"
        });
      } else {
        throw new Error(data.error || "Failed to generate voice");
      }
    } catch (error: any) {
      console.error("Voice generation error:", error);
      toast({
        title: "Voice generation failed",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">YoBot Voice Testing Portal</CardTitle>
          <CardDescription>
            Test our ultra-realistic voice technology with different settings
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="text">Text to speak</Label>
              <textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-32 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Enter text to convert to speech"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="voice-gender">Voice Gender</Label>
                <Select
                  value={voiceGender}
                  onValueChange={setVoiceGender}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female (Rachel - Natural American)</SelectItem>
                    <SelectItem value="male">Male (Josh - Professional American)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stability">
                  Expression Level: {stability.toFixed(2)}
                  <span className="text-gray-500 text-sm ml-2">
                    (Lower = more expressive)
                  </span>
                </Label>
                <Slider
                  value={[stability]}
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  onValueChange={(values) => setStability(values[0])}
                />
              </div>
            </div>
            
            {audioUrl && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">Voice Sample:</p>
                <audio 
                  ref={audioRef}
                  controls 
                  className="w-full" 
                  src={audioUrl}
                  preload="auto"
                />
              </div>
            )}
          </form>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={loading || !text}
            className="w-full"
          >
            {loading ? "Generating..." : "Generate Voice"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}