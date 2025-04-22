import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { CalendlyEmbed } from './CalendlyEmbed';

interface ScheduleMeetingProps {
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  calendlyUrl?: string;
  popupTitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function ScheduleMeeting({
  buttonText = 'Schedule a Meeting',
  buttonVariant = 'default',
  calendlyUrl = 'https://calendly.com/yourbusiness/30min',
  popupTitle = 'Schedule a Meeting with Us',
  size = 'lg'
}: ScheduleMeetingProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Map size to width class
  const sizeClasses = {
    'sm': 'max-w-md',
    'md': 'max-w-2xl',
    'lg': 'max-w-4xl',
    'xl': 'max-w-6xl',
    'full': 'max-w-full'
  };

  const widthClass = sizeClasses[size];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant}>{buttonText}</Button>
      </DialogTrigger>
      <DialogContent className={`${widthClass} h-[80vh]`}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">{popupTitle}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 h-full">
          <CalendlyEmbed 
            url={calendlyUrl} 
            styles={{ 
              height: 'calc(100% - 20px)',
              minHeight: '500px',
              width: '100%'
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}