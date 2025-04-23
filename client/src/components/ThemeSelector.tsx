import React from 'react';
import { motion } from 'framer-motion';
import { Check, Palette } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export interface ThemeOption {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundPattern?: string;
  description: string;
  fontStyle?: string;
}

const defaultThemes: ThemeOption[] = [
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
  {
    id: 'berry',
    name: 'Berry Purple',
    primaryColor: '#8b5cf6', // violet-500
    secondaryColor: '#f5f3ff', // violet-50
    accentColor: '#7c3aed', // violet-600
    description: 'Rich purple theme with soft highlights'
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    primaryColor: '#0284c7', // sky-600
    secondaryColor: '#e0f2fe', // sky-50
    accentColor: '#0ea5e9', // sky-500
    description: 'Cool blue theme inspired by ocean depths'
  },
  {
    id: 'professional',
    name: 'Corporate Gray',
    primaryColor: '#4b5563', // gray-600
    secondaryColor: '#f9fafb', // gray-50
    accentColor: '#6b7280', // gray-500
    description: 'Traditional business-focused theme with subtle grays'
  }
];

interface ThemeSelectorProps {
  currentTheme: string;
  onChange: (themeId: string) => void;
  bubbleOpacity: number;
  setBubbleOpacity: (opacity: number) => void;
  usePrimaryColor: boolean;
  setUsePrimaryColor: (value: boolean) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (value: boolean) => void;
  fontScale: number;
  setFontScale: (scale: number) => void;
  className?: string;
}

export function ThemeSelector({
  currentTheme,
  onChange,
  bubbleOpacity,
  setBubbleOpacity,
  usePrimaryColor,
  setUsePrimaryColor,
  animationsEnabled,
  setAnimationsEnabled,
  fontScale,
  setFontScale,
  className
}: ThemeSelectorProps) {
  const selectedTheme = defaultThemes.find(theme => theme.id === currentTheme) || defaultThemes[0];
  
  // Preview of how the chat bubbles will look with current theme
  const renderPreview = () => (
    <div className="h-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-2 mb-3 shadow-sm">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-start">
          <div 
            className={cn(
              "rounded-lg rounded-bl-none px-2 py-1 text-[9px] max-w-[70%]",
              usePrimaryColor ? `bg-opacity-10 dark:bg-opacity-20 border border-opacity-20` : "bg-gray-100 dark:bg-gray-800"
            )}
            style={{
              backgroundColor: usePrimaryColor ? selectedTheme.primaryColor : undefined,
              borderColor: usePrimaryColor ? selectedTheme.primaryColor : undefined,
              opacity: bubbleOpacity
            }}
          >
            Hello! How can I help you today?
          </div>
        </div>
        <div className="flex justify-end">
          <div 
            className="rounded-lg rounded-br-none px-2 py-1 text-[9px] text-white max-w-[70%]"
            style={{ 
              backgroundColor: selectedTheme.primaryColor,
              opacity: bubbleOpacity 
            }}
          >
            I'd like to schedule a meeting
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-xs sm:text-sm font-medium flex items-center gap-1">
          <Palette className="h-3 w-3 sm:h-4 sm:w-4" /> 
          Conversation Theme
        </Label>
      </div>
      
      {renderPreview()}
      
      <div className="space-y-4">
        <div>
          <Label className="text-[10px] sm:text-xs mb-1 block">Select Theme</Label>
          <Select 
            value={currentTheme} 
            onValueChange={onChange}
          >
            <SelectTrigger className="w-full h-8 text-[10px] sm:text-xs">
              <SelectValue placeholder="Select a theme" />
            </SelectTrigger>
            <SelectContent>
              {defaultThemes.map((theme) => (
                <SelectItem 
                  key={theme.id} 
                  value={theme.id} 
                  className="text-[10px] sm:text-xs flex items-center h-8"
                >
                  <div className="flex items-center w-full">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span>{theme.name}</span>
                    {theme.id === currentTheme && (
                      <Check className="h-3 w-3 ml-auto" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1">
            {selectedTheme.description}
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="bubble-opacity" className="text-[10px] sm:text-xs">Bubble Opacity</Label>
              <span className="text-[10px] sm:text-xs text-muted-foreground">{Math.round(bubbleOpacity * 100)}%</span>
            </div>
            <Slider
              id="bubble-opacity"
              min={0.5}
              max={1}
              step={0.05}
              value={[bubbleOpacity]}
              onValueChange={(values) => setBubbleOpacity(values[0])}
              className="h-1.5"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="font-scale" className="text-[10px] sm:text-xs">Font Size</Label>
              <span className="text-[10px] sm:text-xs text-muted-foreground">{Math.round(fontScale * 100)}%</span>
            </div>
            <Slider
              id="font-scale"
              min={0.8}
              max={1.5}
              step={0.05}
              value={[fontScale]}
              onValueChange={(values) => setFontScale(values[0])}
              className="h-1.5"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="color-toggle" className="text-[10px] sm:text-xs">
              Colored Bot Messages
            </Label>
            <Switch 
              id="color-toggle" 
              checked={usePrimaryColor} 
              onCheckedChange={setUsePrimaryColor} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="animation-toggle" className="text-[10px] sm:text-xs">
              Message Animations
            </Label>
            <Switch 
              id="animation-toggle" 
              checked={animationsEnabled} 
              onCheckedChange={setAnimationsEnabled} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}