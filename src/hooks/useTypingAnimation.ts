import { useState, useEffect, useRef } from 'react';
import { CheckpointStatus } from '@/components/typing/CircularCheckpoint';

interface UseTypingAnimationProps {
  isTyping: boolean;
  steps: number;
  currentStep: number;
  textStreamingStarted: boolean;
}

export function useTypingAnimation({ 
  isTyping, 
  steps, 
  currentStep, 
  textStreamingStarted 
}: UseTypingAnimationProps) {
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
    // Update ref based on prop
    textStreamingStartedRef.current = textStreamingStarted;
    
    // When text streaming starts, transition all completed circles to fade-out
    if (textStreamingStarted) {
      const allToFade = [...completedCircles];
      if (allToFade.length > 0) {
        setFadingCircles(allToFade);
        setCompletedCircles([]);
      }
    }
  }, [textStreamingStarted, completedCircles]);
  
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

  // Helper function to determine the status of a checkpoint
  const getCheckpointStatus = (index: number): CheckpointStatus => {
    if (fadingCircles.includes(index)) return 'fade-out';
    if (completedCircles.includes(index)) return 'completed';
    if (fullCircles.includes(index)) return 'full';
    if (index === currentStep) return 'loading';
    return 'pending';
  };

  return {
    currentProgress,
    visibleSteps: Math.max(Math.min(steps, visibleSteps), 1),
    getCheckpointStatus
  };
}
