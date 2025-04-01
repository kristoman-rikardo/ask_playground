
import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

type CheckpointStatus = 'pending' | 'loading' | 'completed';

interface CircularCheckpointProps {
  status: CheckpointStatus;
  position: number;
  progress: number; // 0-100 for progress percentage
}

const CircularCheckpoint: React.FC<CircularCheckpointProps> = ({ status, position, progress }) => {
  return (
    <div className="relative flex flex-col items-center">
      {/* Connecting line between checkpoints */}
      {position > 0 && (
        <div className="absolute top-1/2 -left-8 w-6 h-0.5 bg-gray-300 -translate-y-1/2" />
      )}
      
      {/* Circle with different states */}
      <div 
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center relative",
          status === 'pending' && "border border-gray-300",
          status === 'loading' && "border-2 border-transparent",
          status === 'completed' && "bg-black text-white"
        )}
      >
        {status === 'loading' && (
          <div className="absolute inset-0">
            <svg className="w-full h-full">
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
                strokeDashoffset={62.83 - (62.83 * progress / 100)} // Calculate dashoffset based on progress
                fill="transparent"
                className="text-black"
                transform="rotate(-90, 12, 12)" // Start from the top (12 o'clock)
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
  
  // Track progress for the current circle (0-100%)
  const [currentProgress, setCurrentProgress] = useState(0);
  
  // Automatically animate the progress of the current circle
  useEffect(() => {
    if (!isTyping) return;
    
    let animationFrame: number;
    let startTime: number;
    const duration = 3000; // 3 seconds for a full circle
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      
      setCurrentProgress(progress);
      
      if (progress < 100) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isTyping, currentStep]);
  
  return (
    <div className="flex items-center space-x-8 p-4 bg-gray-50 rounded-xl my-2">
      {Array.from({ length: steps }).map((_, i) => (
        <CircularCheckpoint 
          key={i}
          position={i}
          progress={i === currentStep ? currentProgress : 0}
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
