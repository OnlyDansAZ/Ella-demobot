import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Mic, Calendar, Clock, Brain, Heart, Lightbulb, Check, X } from 'lucide-react';

export type AnimationType = 
  | 'thinking' 
  | 'listening' 
  | 'speaking' 
  | 'scheduling' 
  | 'idea'
  | 'success'
  | 'error'
  | 'custom';

interface MicroAnimationProps {
  /** The type of animation to show */
  type: AnimationType;
  /** Whether the animation is currently active */
  active: boolean;
  /** Text to display alongside the animation */
  text?: string;
  /** Custom icon to use (for 'custom' type) */
  customIcon?: React.ReactNode;
  /** Color theme for the animation */
  theme?: 'blue' | 'green' | 'red' | 'purple' | 'gray';
  /** Optional position styling for the animation container */
  position?: 'top' | 'bottom' | 'inline';
  /** Optional class name for the animation container */
  className?: string;
  /** Optional transition duration in seconds */
  duration?: number;
}

/**
 * Component for displaying contextual micro animations throughout the application
 */
export function MicroAnimation({
  type,
  active,
  text,
  customIcon,
  theme = 'blue',
  position = 'inline',
  className = '',
  duration = 0.3
}: MicroAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Handle visibility based on active state with a slight delay for exit animations
  useEffect(() => {
    if (active) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  // Theme-based styling
  const themeStyles = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800'
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800'
    },
    gray: {
      bg: 'bg-gray-100 dark:bg-gray-800/30',
      text: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-700'
    }
  };

  // Position-based styling
  const positionStyles = {
    top: 'absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full',
    bottom: 'absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full',
    inline: 'inline-flex'
  };

  // Get the appropriate icon based on animation type
  const getIcon = () => {
    switch (type) {
      case 'thinking':
        return <Brain className="animate-pulse" />;
      case 'listening':
        return <ListeningAnimation />;
      case 'speaking':
        return <SpeakingAnimation />;
      case 'scheduling':
        return <SchedulingAnimation />;
      case 'idea':
        return <Lightbulb className="animate-pulse" />;
      case 'success':
        return <Check className="animate-bounce" />;
      case 'error':
        return <X className="animate-shake" />;
      case 'custom':
        return customIcon || <div className="animate-pulse w-4 h-4 rounded-full bg-current" />;
      default:
        return null;
    }
  };

  // Animation variants for framer-motion
  const containerVariants = {
    hidden: { 
      opacity: 0, 
      y: position === 'top' ? -10 : position === 'bottom' ? 10 : 0,
      x: position === 'inline' ? -10 : 0,
      scale: 0.9 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      x: 0,
      scale: 1,
      transition: { 
        duration: duration,
        ease: "easeOut" 
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: { 
        duration: duration / 2,
        ease: "easeIn" 
      } 
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-full 
            ${themeStyles[theme].bg} ${themeStyles[theme].text} 
            border ${themeStyles[theme].border} shadow-sm
            ${positionStyles[position]} ${className}`}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
        >
          <div className="flex-shrink-0 w-4 h-4">
            {getIcon()}
          </div>
          {text && (
            <span className="text-xs whitespace-nowrap font-medium">{text}</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Specialized animation for listening state
function ListeningAnimation() {
  return (
    <div className="relative w-4 h-4 flex items-center justify-center">
      <Mic className="absolute inset-0 z-10" />
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 animate-ping-slow rounded-full bg-current opacity-30" />
      </div>
    </div>
  );
}

// Specialized animation for speaking state
function SpeakingAnimation() {
  return (
    <div className="relative w-4 h-4 flex items-center justify-center">
      <Volume2 className="absolute inset-0" />
      <div className="flex h-4 space-x-0.5 items-end overflow-hidden">
        <div className="w-0.5 h-1.5 bg-current rounded-full animate-sound-wave" style={{ animationDelay: '0ms' }} />
        <div className="w-0.5 h-2 bg-current rounded-full animate-sound-wave" style={{ animationDelay: '200ms' }} />
        <div className="w-0.5 h-1 bg-current rounded-full animate-sound-wave" style={{ animationDelay: '400ms' }} />
        <div className="w-0.5 h-2.5 bg-current rounded-full animate-sound-wave" style={{ animationDelay: '600ms' }} />
      </div>
    </div>
  );
}

// Specialized animation for scheduling
function SchedulingAnimation() {
  return (
    <div className="relative w-4 h-4 flex items-center justify-center">
      <Calendar className="absolute inset-0 z-10" />
      <div className="absolute top-0 right-0 z-20">
        <Clock className="w-2 h-2 animate-spin-slow" />
      </div>
    </div>
  );
}

// Specialized animation for demonstrating emotions like happiness or appreciation
export function EmotionAnimation({ type = 'happy' }: { type: 'happy' | 'love' | 'surprise' }) {
  const icons = {
    happy: '😊',
    love: <Heart className="text-red-500 animate-heartbeat" />,
    surprise: '😲'
  };
  
  return (
    <motion.div 
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        duration: 0.7
      }}
      className="inline-flex"
    >
      {typeof icons[type] === 'string' ? 
        <span className="animate-bounce-subtle">{icons[type]}</span> : 
        icons[type]
      }
    </motion.div>
  );
}