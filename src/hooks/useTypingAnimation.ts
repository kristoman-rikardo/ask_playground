
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
  // Track last progress timestamp for smoother progress
  const lastProgressTime = useRef(Date.now());
  // Track progress speed (adaptive based on time elapsed)
  const progressSpeed = useRef(1);
  // Completion animation in progress
  const completionInProgress = useRef(false);

  // Reset animation when isTyping changes
  useEffect(() => {
    if (isTyping) {
      setCurrentProgress(0);
      setVisibleSteps(Math.max(1, steps));
      animationActive.current = true;
      completionInProgress.current = false;
      lastProgressTime.current = Date.now();
      progressSpeed.current = 1;
    } else {
      animationActive.current = false;
      completionInProgress.current = false;
    }
  }, [isTyping, steps]);

  // Update progress based on currentStep
  useEffect(() => {
    if (currentStep >= 0 && currentStep < steps) {
      // Calculate progress for this step
      const baseProgress = (currentStep / steps) * 100;
      
      // Always ensure progress is ahead of actual position (at least 10% ahead)
      const aheadProgress = Math.min(baseProgress + 10, 95);
      
      setCurrentProgress(aheadProgress);
      
      // Update visible steps if needed
      setVisibleSteps(Math.max(currentStep + 1, visibleSteps));
      
      // Adjust progress speed based on how quickly steps are advancing
      const now = Date.now();
      const elapsed = now - lastProgressTime.current;
      
      if (elapsed < 1000) {
        // Steps are coming in quickly - speed up
        progressSpeed.current = Math.min(3.5, progressSpeed.current + 0.5);
      } else if (elapsed > 5000) {
        // Steps are coming in slowly - slow down
        progressSpeed.current = Math.max(0.8, progressSpeed.current - 0.2);
      }
      
      lastProgressTime.current = now;
    }
  }, [currentStep, steps, visibleSteps]);

  // Auto-advance progress for better user experience
  useEffect(() => {
    if (!isTyping || textStreamingStarted) return;
    
    let animationFrame: number;
    let lastTimestamp: number;
    
    const animate = (timestamp: number) => {
      if (!animationActive.current) return;
      
      if (!lastTimestamp) lastTimestamp = timestamp;
      const elapsed = timestamp - lastTimestamp;
      
      // Only update every 40ms for smoother animation
      if (elapsed > 40) {
        lastTimestamp = timestamp;
        
        // Calculate the target progress for smooth animation
        const stepProgress = ((currentStep + 1) / steps) * 100;
        
        // Always aim a bit ahead of the current step
        const targetProgress = Math.min(98, stepProgress + 15); 
        
        // Accelerate progress as we get closer to completion
        const speedMultiplier = currentProgress > 80 ? 1.5 : 
                               currentProgress > 60 ? 1.2 : 1;
        
        // Increment by small amount each frame for smoother animation
        if (currentProgress < targetProgress && !textStreamingStarted) {
          setCurrentProgress(prev => 
            Math.min(prev + (0.4 * progressSpeed.current * speedMultiplier), targetProgress)
          );
        }
      }
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isTyping, currentProgress, currentStep, steps, textStreamingStarted]);

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
