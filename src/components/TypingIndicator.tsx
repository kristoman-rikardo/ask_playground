
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTypingAnimation } from '@/hooks/useTypingAnimation';
import { Loader, Check } from 'lucide-react';

export interface TypingIndicatorProps {
  steps?: number;
  currentStep?: number;
  isTyping?: boolean;
  textStreamingStarted?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  isTyping = true,
  textStreamingStarted = false,
  steps = 3,
  currentStep = 0
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

  const { currentProgress, visibleSteps, getCheckpointStatus } = useTypingAnimation({ 
    isTyping, 
    steps, 
    currentStep, 
    textStreamingStarted 
  });
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-start space-y-2"
    >
      <div className="relative h-10 w-10">
        <svg className="w-full h-full" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-200"
          />
          <motion.circle
            cx="22"
            cy="22"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={2 * Math.PI * 20} // 2πr where r=20
            strokeDashoffset={(2 * Math.PI * 20) * (1 - (currentProgress * 1.35) / 100)} // Multiply by 1.35 to start with 35% more progress
            fill={textStreamingStarted ? "currentColor" : "transparent"}
            className="text-gray-500"
            transform="rotate(-90, 22, 22)" // Start from the top (12 o'clock)
            strokeLinecap="round"
            initial={{ strokeDashoffset: 2 * Math.PI * 20 }}
            animate={{ 
              strokeDashoffset: textStreamingStarted 
                ? 0 
                : (2 * Math.PI * 20) * (1 - (currentProgress * 1.35) / 100),
              fill: textStreamingStarted ? "currentColor" : "transparent"
            }}
            transition={{ 
              duration: 0.5,
              ease: "easeInOut" 
            }}
          />
          
          {textStreamingStarted && (
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Check
                x="13"
                y="13"
                width="18"
                height="18"
                className="text-white"
              />
            </motion.g>
          )}
        </svg>
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
