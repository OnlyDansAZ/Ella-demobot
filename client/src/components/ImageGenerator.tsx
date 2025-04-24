import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Image, DownloadCloud, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ImageSize = "1024x1024" | "1792x1024" | "1024x1792";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>("1024x1024");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };
  
  const handleSizeChange = (value: string) => {
    setSize(value as ImageSize);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a description for the image you want to generate",
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, size }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }
      
      if (data.success && data.imageUrl) {
        setImageUrl(data.imageUrl);
        toast({
          title: "Success",
          description: "Image generated successfully!",
        });
      } else {
        throw new Error('No image URL returned');
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to generate image',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const downloadImage = async () => {
    if (!imageUrl) return;
    
    try {
      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `ella-generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading image:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download image",
      });
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Ella Image Generation
          </CardTitle>
          <CardDescription>
            Generate images based on your descriptions using AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="prompt">Image Description</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the image you want to generate..."
                value={prompt}
                onChange={handlePromptChange}
                className="min-h-[100px]"
              />
            </div>
            
            <div>
              <Label htmlFor="size">Image Size</Label>
              <Select value={size} onValueChange={handleSizeChange}>
                <SelectTrigger id="size">
                  <SelectValue placeholder="Select image size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">Square (1024×1024)</SelectItem>
                  <SelectItem value="1792x1024">Landscape (1792×1024)</SelectItem>
                  <SelectItem value="1024x1792">Portrait (1024×1792)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Image
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {imageUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Generated Image
            </CardTitle>
            <CardDescription>
              {prompt}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <img 
                src={imageUrl} 
                alt={prompt} 
                className="w-full h-auto object-contain"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={downloadImage} 
              className="ml-auto"
            >
              <DownloadCloud className="w-4 h-4 mr-2" />
              Download Image
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}