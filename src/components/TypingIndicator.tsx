
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type CheckpointStatus = 'pending' | 'loading' | 'completed';

interface CircularCheckpointProps {
  status: CheckpointStatus;
  position: number;
}

const CircularCheckpoint: React.FC<CircularCheckpointProps> = ({ status, position }) => {
  return (
    <div className="relative flex flex-col items-center">
      {/* Connecting line between checkpoints */}
      {position > 0 && (
        <div className="absolute top-1/2 -left-8 w-6 h-0.5 bg-gray-300 -translate-y-1/2" />
      )}
      
      {/* Circle with different states */}
      <div 
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center",
          status === 'pending' && "border border-gray-300",
          status === 'loading' && "border-2 border-transparent",
          status === 'completed' && "bg-black text-white"
        )}
      >
        {status === 'loading' && (
          <div className="absolute inset-0">
            <svg className="w-full h-full animate-spin">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                className="text-gray-300"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="62.83" // 2πr where r=10
                strokeDashoffset="31.42" // Start from the top (62.83/2)
                fill="transparent"
                className="text-black"
              />
            </svg>
          </div>
        )}
        {status === 'completed' && <Check className="h-4 w-4" />}
      </div>
    </div>
  );
};

interface TypingIndicatorProps {
  steps?: number;
  currentStep?: number;
  isTyping?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  steps = 1,
  currentStep = 0,
  isTyping = true 
}) => {
  // If not typing, don't show anything
  if (!isTyping) return null;
  
  return (
    <div className="flex items-center space-x-8 p-4 bg-gray-50 rounded-xl my-2">
      {Array.from({ length: steps }).map((_, i) => (
        <CircularCheckpoint 
          key={i}
          position={i}
          status={
            i < currentStep ? 'completed' : 
            i === currentStep ? 'loading' : 'pending'
          }
        />
      ))}
    </div>
  );
};

export default TypingIndicator;
