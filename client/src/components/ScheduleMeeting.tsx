import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendlyEmbed } from './CalendlyEmbed';
import { Calendar } from 'lucide-react';

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
  buttonVariant = 'outline',
  calendlyUrl = 'https://calendly.com/yourbusiness/30min',
  popupTitle = 'Schedule a Meeting',
  size = 'lg'
}: ScheduleMeetingProps) {
  const [open, setOpen] = useState(false);

  // Define dialog width based on size prop
  const getDialogWidth = () => {
    switch (size) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case 'full': return 'max-w-screen-md';
      default: return 'max-w-lg';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className="flex items-center gap-1 text-xs sm:text-sm">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className={`${getDialogWidth()} h-[75vh] sm:h-[80vh] p-0`}>
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>{popupTitle}</DialogTitle>
        </DialogHeader>
        <div className="px-1 sm:px-2 pb-1 sm:pb-2 h-full overflow-hidden">
          <CalendlyEmbed 
            url={calendlyUrl} 
            styles={{ 
              height: '100%', 
              width: '100%', 
              overflow: 'hidden' 
            }} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}