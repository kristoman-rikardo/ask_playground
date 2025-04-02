
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
  // Track progress for the current step (0-100%)
  const [currentProgress, setCurrentProgress] = useState(0);
  // Track which step is currently in progress
  const [visibleSteps, setVisibleSteps] = useState(1);
  // Track animation state
  const animationActive = useRef(false);
  // Completion animation in progress
  const completionInProgress = useRef(false);

  // Reset animation when isTyping changes
  useEffect(() => {
    if (isTyping) {
      setCurrentProgress(0);
      setVisibleSteps(Math.max(1, steps));
      animationActive.current = true;
      completionInProgress.current = false;
    } else {
      animationActive.current = false;
      completionInProgress.current = false;
    }
  }, [isTyping, steps]);

  // Update progress based on currentStep
  useEffect(() => {
    if (currentStep >= 0 && currentStep < steps) {
      // Calculate progress for this step
      const baseProgress = ((currentStep / steps) * 100);
      setCurrentProgress(Math.min(baseProgress + 35, 95));
      
      // Update visible steps if needed
      setVisibleSteps(Math.max(currentStep + 1, visibleSteps));
    }
  }, [currentStep, steps, visibleSteps]);

  // Handle transition to text streaming
  useEffect(() => {
    if (textStreamingStarted && !completionInProgress.current) {
      completionInProgress.current = true;
      
      // First ensure we reach 100% quickly
      setCurrentProgress(100);
      
      // Then stop animation after a small delay
      const timeoutId = setTimeout(() => {
        animationActive.current = false;
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [textStreamingStarted]);

  // Helper function to determine the status of a checkpoint
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
