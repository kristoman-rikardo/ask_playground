
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTypingAnimation } from '@/hooks/useTypingAnimation';
import { Loader } from 'lucide-react';

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
  
  // Normal loading messages in Norwegian
  const normalLoadingMessages = [
    "Finner et god svar...", 
    "Resonnerer...", 
    "Tenker..."
  ];
  
  // Product search loading messages in Norwegian
  const productLoadingMessages = [
    "Leter etter produkter...",
    "Presenterer produkter..."
  ];
  
  // Determine which message set to use based on steps
  const isLongLoading = steps > 3;
  const loadingMessages = isLongLoading ? productLoadingMessages : normalLoadingMessages;
  
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
      <div className="flex items-center space-x-2 mb-1">
        <Loader size={16} className="animate-spin text-gray-600" />
        <span className="text-sm text-gray-600 font-medium">
          {loadingMessages[loadingTextIndex]}
        </span>
      </div>
      
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <motion.div 
          className="h-full bg-gray-400 rounded-full"
          initial={{ width: '0%' }}
          animate={{ 
            width: textStreamingStarted ? '100%' : `${currentProgress}%` 
          }}
          transition={{ 
            duration: textStreamingStarted ? 0.3 : 0.5,
            ease: "easeInOut" 
          }}
        />
      </div>
      
      {!textStreamingStarted && visibleSteps > 1 && (
        <div className="text-xs text-gray-500 mt-1">
          {getCheckpointStatus(currentStep) === 'loading' ? 
            `Steg ${currentStep + 1} av ${visibleSteps}` : 
            'Behandler forespørselen...'
          }
        </div>
      )}
    </motion.div>
  );
};

export default TypingIndicator;
