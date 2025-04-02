
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTypingAnimation } from '@/hooks/useTypingAnimation';
import { Check } from 'lucide-react';

export interface TypingIndicatorProps {
  steps?: number;
  currentStep?: number;
  isTyping?: boolean;
  textStreamingStarted?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  isTyping = true,
  textStreamingStarted = false,
}) => {
  // If not typing, don't show anything
  if (!isTyping) return null;
  
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  
  // Updated loading messages in Norwegian
  const loadingMessages = [
    "Tenker...",
    "Resonnerer...",
    "Grubler...",
    "Henter informasjon...",
    "Samler kunnskap...",
    "Drøfter..."
  ];
  
  // Rotate through loading messages
  useEffect(() => {
    if (!textStreamingStarted) {
      const interval = setInterval(() => {
        setLoadingTextIndex(prev => (prev + 1) % loadingMessages.length);
      }, 2500);
      
      return () => clearInterval(interval);
    }
  }, [loadingMessages, textStreamingStarted]);
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-start space-y-2"
    >
      <div className="flex space-x-2 px-1">
        <div className="w-3 h-3 rounded-full bg-gray-500 animate-typing-dot-1"></div>
        <div className="w-3 h-3 rounded-full bg-gray-500 animate-typing-dot-2"></div>
        <div className="w-3 h-3 rounded-full bg-gray-500 animate-typing-dot-3"></div>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.span 
          key={loadingTextIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
          className="text-sm text-gray-600 font-medium ml-2 mt-1"
        >
          {loadingMessages[loadingTextIndex]}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
};

export default TypingIndicator;
