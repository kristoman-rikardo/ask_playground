
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

  // Reset animation when isTyping changes
  useEffect(() => {
    if (isTyping) {
      setCurrentProgress(0);
      setVisibleSteps(Math.max(1, steps));
      animationActive.current = true;
      lastProgressTime.current = Date.now();
      progressSpeed.current = 1;
    } else {
      animationActive.current = false;
    }
  }, [isTyping, steps]);

  // Update progress based on currentStep
  useEffect(() => {
    if (currentStep >= 0 && currentStep < steps) {
      // Calculate progress for this step
      const baseProgress = (currentStep / steps) * 100;
      setCurrentProgress(baseProgress);
      
      // Update visible steps if needed
      setVisibleSteps(Math.max(currentStep + 1, visibleSteps));
      
      // Adjust progress speed based on how quickly steps are advancing
      const now = Date.now();
      const elapsed = now - lastProgressTime.current;
      
      if (elapsed < 1000) {
        // Steps are coming in quickly - speed up
        progressSpeed.current = Math.min(3, progressSpeed.current + 0.5);
      } else if (elapsed > 5000) {
        // Steps are coming in slowly - slow down
        progressSpeed.current = Math.max(0.5, progressSpeed.current - 0.2);
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
      
      // Only update every 50ms for performance
      if (elapsed > 50) {
        lastTimestamp = timestamp;
        
        // Calculate the target progress for smooth animation
        const stepProgress = ((currentStep + 1) / steps) * 100;
        const nextTarget = Math.min(stepProgress - 5, currentProgress + 0.5 * progressSpeed.current);
        
        // Only increase progress if we're not at or beyond the target
        if (currentProgress < nextTarget && !textStreamingStarted) {
          setCurrentProgress(prev => Math.min(prev + 0.5 * progressSpeed.current, nextTarget));
        }
      }
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isTyping, currentProgress, currentStep, steps, textStreamingStarted]);

  // Set to 100% when text streaming starts
  useEffect(() => {
    if (textStreamingStarted) {
      setCurrentProgress(100);
      animationActive.current = false;
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
