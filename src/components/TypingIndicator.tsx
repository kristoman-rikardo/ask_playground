import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type CheckpointStatus = 'pending' | 'loading' | 'completed' | 'full';

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
          (status === 'loading' || status === 'full') && "border-2 border-transparent",
          status === 'completed' && "bg-black text-white"
        )}
      >
        {(status === 'loading' || status === 'full') && (
          <svg className="w-full h-full" viewBox="0 0 24 24">
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
              strokeDasharray={2 * Math.PI * 10} // 2πr where r=10
              strokeDashoffset={(2 * Math.PI * 10) * (1 - progress / 100)} // Calculate dashoffset based on progress
              fill="transparent"
              className="text-black"
              transform="rotate(-90, 12, 12)" // Start from the top (12 o'clock)
              strokeLinecap="round"
            />
          </svg>
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
  // Track which circles are in "full" state (100% but not yet showing checkmark)
  const [fullCircles, setFullCircles] = useState<number[]>([]);
  // We track the actual number of steps to display (starting with 1)
  const [visibleSteps, setVisibleSteps] = useState(1);
  
  // Function to convert full circles to completed after a short delay
  useEffect(() => {
    if (fullCircles.length === 0) return;
    
    const timeouts = fullCircles.map(circleIndex => 
      setTimeout(() => {
        setFullCircles(prev => prev.filter(idx => idx !== circleIndex));
      }, 300) // 300ms delay before showing the checkmark
    );
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [fullCircles]);
  
  // Reset progress when currentStep changes
  useEffect(() => {
    if (currentStep >= 0) {
      setCurrentProgress(0);
    }
  }, [currentStep]);
  
  // Reset progress when steps change (for new messages)
  useEffect(() => {
    setCurrentProgress(0);
    setFullCircles([]);
  }, [steps]);
  
  // Automatically animate the progress of the current circle with a clear lead
  useEffect(() => {
    if (!isTyping) return;
    
    let animationFrame: number;
    let startTime: number;
    const duration = 3800; // Slightly faster than 4s to stay ahead of real progress
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      // Add 15% lead to progress to keep ahead of real progress
      const progress = Math.min(100, ((elapsed / duration) * 100) + 15);
      
      setCurrentProgress(progress);
      
      if (progress < 100) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // When progress reaches 100%, add this circle to fullCircles array
        // This will trigger a delay before showing the checkmark
        setFullCircles(prev => [...prev, currentStep]);
        
        // If we've filled the first circle (after ~3.8 seconds) and no text has started yet,
        // add another circle
        if (currentStep === 0 && visibleSteps === 1) {
          setVisibleSteps(2);
        }
        // For subsequent circles, add new ones every 1.5 seconds
        else if (currentStep > 0 && currentStep === visibleSteps - 1) {
          setVisibleSteps(prev => prev + 1);
        }
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isTyping, currentStep, visibleSteps]);
  
  // Use the smaller of the provided steps or our visibleSteps
  const actualVisibleSteps = Math.min(steps, visibleSteps);
  
  return (
    <div className="flex items-center space-x-8 p-4 bg-gray-50 rounded-xl my-2">
      {Array.from({ length: actualVisibleSteps }).map((_, i) => (
        <CircularCheckpoint 
          key={i}
          position={i}
          progress={i === currentStep ? currentProgress : 0}
          status={
            i < currentStep ? 'completed' : 
            i === currentStep ? (fullCircles.includes(i) ? 'full' : 'loading') : 'pending'
          }
        />
      ))}
    </div>
  );
};

export default TypingIndicator;
