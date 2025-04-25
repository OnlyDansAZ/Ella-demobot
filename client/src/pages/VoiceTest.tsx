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
    setAudioUrl(null); // Clear previous audio
    
    try {
      // Generate a unique cache-busting parameter to prevent browser caching
      const cacheBuster = Date.now();
      
      const response = await apiRequest("POST", "/api/test-voice", {
        text,
        voiceGender,
        stabilityLevel: stability,
        cacheBuster // Add cache-busting parameter
      });
      
      const data = await response.json();
      
      if (data.success && data.audioUrl) {
        // Add cache-busting parameter to the URL
        const audioUrlWithCache = `${data.audioUrl}?t=${cacheBuster}`;
        setAudioUrl(audioUrlWithCache);
        
        // Clear any previous audio element errors
        if (audioRef.current) {
          audioRef.current.onerror = null;
        }
        
        // Wait a moment for the audio to be fully available
        setTimeout(() => {
          if (audioRef.current) {
            // Reset the audio element (important for Safari)
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            
            // Try to play the audio
            audioRef.current.load();
            audioRef.current.play().catch(err => {
              console.error("Failed to auto-play audio:", err);
              toast({
                title: "Auto-play failed",
                description: "Click the play button or use the download option to hear the voice sample",
                variant: "default"
              });
            });
          }
        }, 800); // Longer delay to ensure file is ready
        
        toast({
          title: "Voice generated successfully!",
          description: `${voiceGender === 'female' ? 'Rachel' : 'Josh'} voice sample is ready to play`,
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
                  onError={(e) => {
                    console.error("Audio playback error", e);
                    toast({
                      title: "Audio playback failed",
                      description: "Try clicking the download button below to listen to the audio",
                      variant: "destructive"
                    });
                  }}
                />
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-sm text-gray-700">
                    {loading ? "Generating audio..." : "Audio ready to play"}
                  </p>
                  <div className="flex flex-row gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        // Force a direct download of the audio file
                        const a = document.createElement('a');
                        a.href = audioUrl;
                        a.download = 'voice-sample.mp3';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                    >
                      Download Audio
                    </Button>
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => {
                        // Alternative play method in case the audio element fails
                        if (audioRef.current) {
                          // Reset the audio element
                          audioRef.current.pause();
                          audioRef.current.currentTime = 0;
                          audioRef.current.load();
                          audioRef.current.play().catch(err => {
                            console.error("Retry play failed:", err);
                            toast({
                              title: "Playback still failing",
                              description: "Please try the download option instead",
                              variant: "destructive"
                            });
                          });
                        }
                      }}
                    >
                      Retry Playback
                    </Button>
                  </div>
                </div>
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