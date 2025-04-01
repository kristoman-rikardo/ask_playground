
import React, { useEffect, useState, useRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type CheckpointStatus = 'pending' | 'loading' | 'completed' | 'full' | 'fade-out';

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
          "w-6 h-6 rounded-full flex items-center justify-center relative transition-all duration-300",
          status === 'pending' && "border border-gray-300",
          (status === 'loading' || status === 'full') && "border-2 border-transparent",
          status === 'completed' && "bg-black text-white",
          status === 'fade-out' && "bg-black text-white opacity-50"
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
        {(status === 'completed' || status === 'fade-out') && <Check className="h-4 w-4" />}
      </div>
    </div>
  );
};

interface TypingIndicatorProps {
  steps?: number;
  currentStep?: number;
  isTyping?: boolean;
  textStreamingStarted?: boolean; // Add the new prop with optional typing
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  steps = 1,
  currentStep = 0,
  isTyping = true,
  textStreamingStarted = false // Add default value
}) => {
  // If not typing, don't show anything
  if (!isTyping) return null;
  
  // Track progress for the current circle (0-100%)
  const [currentProgress, setCurrentProgress] = useState(0);
  // Track which circles are in "full" state (100% but not yet showing checkmark)
  const [fullCircles, setFullCircles] = useState<number[]>([]);
  // Track which circles are completed and showing checkmarks
  const [completedCircles, setCompletedCircles] = useState<number[]>([]);
  // Track which circles should fade out
  const [fadingCircles, setFadingCircles] = useState<number[]>([]);
  // We track the actual number of steps to display (starting with 1)
  const [visibleSteps, setVisibleSteps] = useState(1);

  // Keep track of whether text streaming has started
  const textStreamingStartedRef = useRef(false);
  
  // Reset all states when isTyping changes from false to true (new message)
  useEffect(() => {
    if (isTyping) {
      // Reset states for a new message
      setCurrentProgress(0);
      setFullCircles([]);
      setCompletedCircles([]);
      setFadingCircles([]);
      setVisibleSteps(1);
      textStreamingStartedRef.current = false;
    }
  }, [isTyping]);

  // Function to convert full circles to completed after a short delay
  useEffect(() => {
    if (fullCircles.length === 0) return;
    
    const timeouts = fullCircles.map(circleIndex => 
      setTimeout(() => {
        setFullCircles(prev => prev.filter(idx => idx !== circleIndex));
        setCompletedCircles(prev => [...prev, circleIndex]);

        // When a circle is completed, if not already streaming and this is the last step
        if (circleIndex === visibleSteps - 1 && !textStreamingStartedRef.current) {
          // Add next circle if needed
          setVisibleSteps(prev => Math.max(prev + 1, Math.min(steps + 1, 3)));
        }
      }, 300) // 300ms delay before showing the checkmark
    );
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [fullCircles, visibleSteps, steps]);
  
  // Reset progress and status when currentStep changes
  useEffect(() => {
    if (currentStep >= 0) {
      // Start fresh for this step
      setCurrentProgress(0);
      
      // Clear completed status for new circles when step changes
      if (currentStep > 0 && !completedCircles.includes(currentStep - 1)) {
        setFullCircles(prev => [...prev.filter(c => c !== currentStep - 1), currentStep - 1]);
      }
    }
  }, [currentStep]);
  
  // Reset everything when steps change (for new messages)
  useEffect(() => {
    setCurrentProgress(0);
    setFullCircles([]);
    setCompletedCircles([]);
    setFadingCircles([]);
    setVisibleSteps(Math.min(steps, 3));
    textStreamingStartedRef.current = false;
  }, [steps]);

  // Fade out checkmarks when text starts streaming
  useEffect(() => {
    // When text streaming starts, transition all completed circles to fade-out
    if (textStreamingStartedRef.current) {
      const allToFade = [...completedCircles];
      if (allToFade.length > 0) {
        setFadingCircles(allToFade);
        setCompletedCircles([]);
      }
    }
  }, [textStreamingStartedRef.current, completedCircles]);
  
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
          setVisibleSteps(prev => Math.min(prev + 1, 3));
        }
        // For subsequent circles, add new ones every 1.5 seconds if needed
        else if (currentStep > 0 && currentStep === visibleSteps - 1 && visibleSteps < 3) {
          setVisibleSteps(prev => Math.min(prev + 1, 3));
        }
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isTyping, currentStep, visibleSteps]);

  // Update the text streaming started ref based on the presence of checkmarks
  useEffect(() => {
    const hasCheckmarks = completedCircles.length > 0;
    
    if (hasCheckmarks && isTyping) {
      // Set a timeout to mark text as streaming after the last circle completes
      const timeout = setTimeout(() => {
        textStreamingStartedRef.current = true;
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [completedCircles, isTyping]);
  
  // Use the smaller of the provided steps or our visibleSteps
  const actualVisibleSteps = Math.max(Math.min(steps, visibleSteps), 1);
  
  return (
    <div className="flex items-center space-x-8 p-4 bg-gray-50 rounded-xl my-2">
      {Array.from({ length: actualVisibleSteps }).map((_, i) => (
        <CircularCheckpoint 
          key={i}
          position={i}
          progress={i === currentStep ? currentProgress : 0}
          status={
            fadingCircles.includes(i) ? 'fade-out' :
            completedCircles.includes(i) ? 'completed' : 
            fullCircles.includes(i) ? 'full' :
            i === currentStep ? 'loading' : 'pending'
          }
        />
      ))}
    </div>
  );
};

export default TypingIndicator;
