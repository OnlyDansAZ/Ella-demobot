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
  buttonClasses?: string;
  calendlyUrl?: string;
  popupTitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  prefill?: {
    name?: string;
    email?: string;
    customAnswers?: {
      [key: string]: string;
    };
  };
}

/**
 * A component that opens a Calendly scheduling dialog
 */
export function ScheduleMeeting({
  buttonText = 'Schedule a Meeting',
  buttonVariant = 'default',
  buttonClasses,
  calendlyUrl = 'https://calendly.com/yourbusiness/30min',
  popupTitle = 'Schedule a Meeting',
  size = 'lg',
  prefill
}: ScheduleMeetingProps) {
  const [open, setOpen] = useState(false);

  // Calculate the size classes based on the size prop
  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {buttonClasses ? (
          <button className={buttonClasses}>
            <Calendar className="h-3.5 w-3.5 mr-1 inline-block" />
            {buttonText}
          </button>
        ) : (
          <Button variant={buttonVariant} size="sm" className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={`${sizeClasses[size] || 'max-w-lg'} p-0 overflow-hidden h-[90vh] max-h-[700px]`}>
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
            prefill={prefill}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}