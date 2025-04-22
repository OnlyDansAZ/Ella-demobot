import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from 'lucide-react';
import { CalendlyEmbed } from './CalendlyEmbed';

interface ScheduleMeetingProps {
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  calendlyUrl?: string;
  popupTitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * A component that opens a Calendly scheduling dialog
 */
export function ScheduleMeeting({
  buttonText = 'Schedule a Meeting',
  buttonVariant = 'default',
  calendlyUrl = 'https://calendly.com/yourbusiness/30min',
  popupTitle = 'Schedule a Meeting',
  size = 'lg'
}: ScheduleMeetingProps) {
  const [open, setOpen] = useState(false);

  // Calculate the size classes based on the size prop
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size="sm" className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className={`${sizeClasses[size]} p-0 overflow-hidden h-[90vh] max-h-[700px]`}>
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>{popupTitle}</DialogTitle>
          <DialogDescription>
            Select a date and time that works for you
          </DialogDescription>
        </DialogHeader>
        <div className="h-full">
          <CalendlyEmbed 
            url={calendlyUrl} 
            styles={{ height: 'calc(100% - 30px)', width: '100%', minHeight: '550px' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}