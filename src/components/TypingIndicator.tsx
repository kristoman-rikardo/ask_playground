
import React from 'react';
import CircularCheckpoint from './typing/CircularCheckpoint';
import { useTypingAnimation } from '@/hooks/useTypingAnimation';

export interface TypingIndicatorProps {
  steps?: number;
  currentStep?: number;
  isTyping?: boolean;
  textStreamingStarted?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  steps = 1,
  currentStep = 0,
  isTyping = true,
  textStreamingStarted = false
}) => {
  // If not typing, don't show anything
  if (!isTyping) return null;
  
  // Use our extracted animation hook
  const { currentProgress, visibleSteps, getCheckpointStatus } = useTypingAnimation({
    isTyping,
    steps,
    currentStep,
    textStreamingStarted
  });
  
  return (
    <div className="flex items-center space-x-8 p-4 bg-gray-50 rounded-xl my-2">
      {Array.from({ length: visibleSteps }).map((_, i) => (
        <CircularCheckpoint 
          key={i}
          position={i}
          progress={i === currentStep ? currentProgress : 0}
          status={getCheckpointStatus(i)}
        />
      ))}
    </div>
  );
};

export default TypingIndicator;
