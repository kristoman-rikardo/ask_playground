
import React from 'react';

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
  if (!isTyping || textStreamingStarted) {
    return null;
  }

  // Return empty div since we're moving the indicator elsewhere
  return null;
};

export default TypingIndicator;
