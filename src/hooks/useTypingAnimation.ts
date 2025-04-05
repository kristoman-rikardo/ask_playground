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
  const [currentProgress, setCurrentProgress] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState(1);
  const animationActive = useRef(false);
  const completionInProgress = useRef(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Reset animation when isTyping changes
  useEffect(() => {
    if (isTyping) {
      setCurrentProgress(0);
      setVisibleSteps(Math.max(1, steps));
      animationActive.current = true;
      completionInProgress.current = false;

      // Start continuous progress animation
      progressInterval.current = setInterval(() => {
        setCurrentProgress(prev => {
          if (prev >= 95) return 0;
          return prev + 1;
        });
      }, 50);

    } else {
      animationActive.current = false;
      completionInProgress.current = false;
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isTyping, steps]);

  // Update visible steps based on currentStep
  useEffect(() => {
    if (currentStep >= 0 && currentStep < steps) {
      setVisibleSteps(Math.max(currentStep + 1, visibleSteps));
    }
  }, [currentStep, steps, visibleSteps]);

  // Handle transition to text streaming
  useEffect(() => {
    if (textStreamingStarted && !completionInProgress.current) {
      completionInProgress.current = true;
      
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      
      setCurrentProgress(100);
      
      const timeoutId = setTimeout(() => {
        animationActive.current = false;
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [textStreamingStarted]);

  const getCheckpointStatus = (index: number): CheckpointStatus => {
    if (textStreamingStarted) return 'completed';
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'loading';
    return 'pending';
  };

  return {
    currentProgress,
    visibleSteps: Math.min(visibleSteps, steps),
    getCheckpointStatus
  };
}
