
import React from 'react';
import PulsatingLoader from './PulsatingLoader';
import { motion } from 'framer-motion';

export interface TypingIndicatorProps {
  steps?: number;
  currentStep?: number;
  isTyping?: boolean;
  textStreamingStarted?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  isTyping = true,
  textStreamingStarted = false
}) => {
  // If not typing, don't show anything
  if (!isTyping) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="flex items-start justify-start px-4 py-3"
    >
      <PulsatingLoader />
    </motion.div>
  );
};

export default TypingIndicator;
