
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

  return (
    <div className="flex flex-col items-center">
      <div className="typing-indicator">
        <div className="square sq1"></div>
        <div className="square sq2"></div>
        <div className="square sq3"></div>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        Tenker<span className="dots-animation">...</span>
      </div>
    </div>
  );
};

export default TypingIndicator;
