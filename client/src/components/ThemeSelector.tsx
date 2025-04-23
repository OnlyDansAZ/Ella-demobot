import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaletteIcon, Sparkles, Check, Power, Type, EyeIcon } from 'lucide-react';

export interface ThemeOption {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  description: string;
}

interface ThemeSettings {
  themeId: string;
  bubbleOpacity: number;
  usePrimaryColor: boolean;
  animationsEnabled: boolean;
  fontScale: number;
}

interface ThemePreviewProps {
  theme: ThemeOption;
  bubbleOpacity: number;
  usePrimaryColor: boolean;
}

interface ThemeSelectorProps {
  currentThemeId: string;
  bubbleOpacity: number;
  usePrimaryColor: boolean;
  animationsEnabled: boolean;
  fontScale: number;
  onThemeChange: (themeId: string) => void;
  onBubbleOpacityChange: (opacity: number) => void;
  onUsePrimaryColorChange: (use: boolean) => void;
  onAnimationsEnabledChange: (enabled: boolean) => void;
  onFontScaleChange: (scale: number) => void;
}

// Theme preview component to show a sample of what the theme will look like
const ThemePreview: React.FC<ThemePreviewProps> = ({ theme, bubbleOpacity, usePrimaryColor }) => {
  const userBubbleStyle = {
    backgroundColor: usePrimaryColor ? theme.primaryColor : '#E5E7EB',
    opacity: bubbleOpacity,
    color: usePrimaryColor ? 'white' : 'black',
  };

  const botBubbleStyle = {
    backgroundColor: theme.secondaryColor,
    opacity: bubbleOpacity,
    borderLeft: `4px solid ${theme.primaryColor}`,
  };

  return (
    <div className="rounded-md p-3 h-36 flex flex-col space-y-2 overflow-hidden">
      <div className="ml-auto max-w-[80%]">
        <div 
          style={userBubbleStyle} 
          className="p-2 rounded-lg text-xs"
        >
          How can you help my business?
        </div>
      </div>
      <div className="mr-auto max-w-[80%]">
        <div 
          style={botBubbleStyle} 
          className="p-2 rounded-lg text-xs"
        >
          I can assist with scheduling, customer inquiries, and help manage your daily tasks efficiently!
        </div>
      </div>
      <div className="flex items-center space-x-1 text-xs font-medium mt-auto mx-auto">
        <span style={{ color: theme.primaryColor }}>●</span>
        <span>Primary: {theme.primaryColor}</span>
        <span className="mx-1">|</span>
        <span style={{ color: theme.accentColor }}>●</span>
        <span>Accent: {theme.accentColor}</span>
      </div>
    </div>
  );
};

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentThemeId,
  bubbleOpacity,
  usePrimaryColor,
  animationsEnabled,
  fontScale,
  onThemeChange,
  onBubbleOpacityChange,
  onUsePrimaryColorChange,
  onAnimationsEnabledChange,
  onFontScaleChange
}) => {
  // Define available themes
  const themes: ThemeOption[] = [
    {
      id: 'default',
      name: 'Default',
      primaryColor: '#3b82f6', // blue-500
      secondaryColor: '#f3f4f6', // gray-100
      accentColor: '#10b981', // emerald-500
      description: 'The standard YoBot theme with a clean, professional look'
    },
    {
      id: 'modern',
      name: 'Modern Blue',
      primaryColor: '#2563eb', // blue-600
      secondaryColor: '#e0f2fe', // sky-100
      accentColor: '#06b6d4', // cyan-500
      description: 'A sleek and modern blue theme with light accents'
    },
    {
      id: 'night',
      name: 'Night Mode',
      primaryColor: '#6366f1', // indigo-500
      secondaryColor: '#1e1e2d', // dark gray
      accentColor: '#8b5cf6', // violet-500
      description: 'Dark theme with vibrant purple accents for low-light environments'
    },
    {
      id: 'nature',
      name: 'Natural Green',
      primaryColor: '#10b981', // emerald-500
      secondaryColor: '#ecfdf5', // emerald-50
      accentColor: '#059669', // emerald-600
      description: 'Calm and natural green theme inspired by nature'
    },
    {
      id: 'sunset',
      name: 'Sunset Orange',
      primaryColor: '#f97316', // orange-500
      secondaryColor: '#fff7ed', // orange-50
      accentColor: '#ea580c', // orange-600
      description: 'Warm and energetic theme with sunset-inspired colors'
    },
  ];

  // Find the current theme object
  const currentTheme = themes.find(theme => theme.id === currentThemeId) || themes[0];

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <PaletteIcon className="w-5 h-5 mr-2" />
          Customize Theme
        </CardTitle>
        <CardDescription>
          Personalize the appearance of your conversation with Ella
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="themes" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="themes" className="flex items-center">
              <PaletteIcon className="w-4 h-4 mr-2" />
              Color Themes
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center">
              <EyeIcon className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="animations" className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              Animations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="themes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map(theme => (
                <motion.div
                  key={theme.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative"
                >
                  <div 
                    className={`border rounded-lg overflow-hidden cursor-pointer p-2 ${
                      theme.id === currentThemeId ? 'ring-2 ring-offset-2 ring-primary' : 'hover:border-primary/50'
                    }`}
                    onClick={() => onThemeChange(theme.id)}
                  >
                    {theme.id === currentThemeId && (
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <h3 className="font-medium mb-1">{theme.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{theme.description}</p>
                    <ThemePreview 
                      theme={theme} 
                      bubbleOpacity={bubbleOpacity}
                      usePrimaryColor={usePrimaryColor}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="bubbleOpacity">Message Bubble Opacity</Label>
                  <span className="text-sm">{Math.round(bubbleOpacity * 100)}%</span>
                </div>
                <Slider
                  id="bubbleOpacity"
                  min={0.3}
                  max={1}
                  step={0.05}
                  value={[bubbleOpacity]}
                  onValueChange={(value) => onBubbleOpacityChange(value[0])}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="usePrimaryColor">Use Primary Color for Your Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Makes your message bubbles use the theme's primary color
                  </p>
                </div>
                <Switch
                  id="usePrimaryColor"
                  checked={usePrimaryColor}
                  onCheckedChange={onUsePrimaryColorChange}
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="fontScale">Text Size</Label>
                  <span className="text-sm">{Math.round(fontScale * 100)}%</span>
                </div>
                <Slider
                  id="fontScale"
                  min={0.8}
                  max={1.4}
                  step={0.05}
                  value={[fontScale]}
                  onValueChange={(value) => onFontScaleChange(value[0])}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="animations" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="animationsEnabled">Enable Animations</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle all animations on or off
                </p>
              </div>
              <Switch
                id="animationsEnabled"
                checked={animationsEnabled}
                onCheckedChange={onAnimationsEnabledChange}
              />
            </div>
            
            <div className="text-muted-foreground text-sm p-4 bg-secondary rounded-md">
              <p className="mb-2 font-medium">Animation effects include:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Message typing indicators</li>
                <li>Voice activation ripples</li>
                <li>Message bubble transitions</li>
                <li>Loading state animations</li>
                <li>Page transitions</li>
              </ul>
              <p className="mt-3">
                <span className="font-medium">Note:</span> Turning off animations may improve performance on older devices.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Current theme: <span className="font-medium">{currentTheme.name}</span>
        </p>
      </CardFooter>
    </Card>
  );
};