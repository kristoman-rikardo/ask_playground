
import { useRef, useEffect } from 'react';

export function useStepProgressManager(
  setStepsTotal: React.Dispatch<React.SetStateAction<number>>,
  setCurrentStepIndex: React.Dispatch<React.SetStateAction<number>>
) {
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const receivedFirstTextRef = useRef<boolean>(false);
  const isResettingRef = useRef<boolean>(false);
  
  // Reset progress circles for new message interactions
  const resetProgressCircles = () => {
    if (isResettingRef.current) return;
    
    isResettingRef.current = true;
    receivedFirstTextRef.current = false;
    
    // Cancel any existing timeouts
    clearProgressTimeouts();
    
    // Reset to initial state when a new message starts
    setStepsTotal(1);
    setCurrentStepIndex(0);
    
    // Set a small delay to prevent race conditions
    setTimeout(() => {
      isResettingRef.current = false;
    }, 50);
  };

  const handleSpecialBlockId = (blockId: string) => {
    if (isResettingRef.current) return false;
    
    // Check for the specific block ID that should trigger another circle
    if (blockId === '67d742f919dcd04caec92381') {
      console.log('🔵 Detected special block ID, adding another circle');
      setStepsTotal(prev => Math.max(prev + 1, 3));
      setCurrentStepIndex(prev => prev + 1);
      return true;
    }
    return false;
  };

  const handleStepsFromPayload = (payload: any): boolean => {
    if (isResettingRef.current) return false;
    
    if (payload?.steps) {
      setStepsTotal(payload.steps.total || 1);
      setCurrentStepIndex(payload.steps.current || 0);
      return true;
    }
    return false;
  };

  const setupProgressTimeouts = () => {
    if (isResettingRef.current) return;
    
    if (responseTimeoutRef.current === null && !receivedFirstTextRef.current) {
      responseTimeoutRef.current = setTimeout(() => {
        if (!receivedFirstTextRef.current && !isResettingRef.current) {
          setStepsTotal((current) => Math.max(current, 2));
          setCurrentStepIndex(1);
          
          stepTimeoutRef.current = setTimeout(() => {
            if (!receivedFirstTextRef.current && !isResettingRef.current) {
              setStepsTotal((current) => Math.max(current, 3));
              setCurrentStepIndex(2);
            }
          }, 1500);
        }
      }, 4000);
    }
  };

  // Cleanup function to manage timeouts
  useEffect(() => {
    return () => {
      clearProgressTimeouts();
    };
  }, []);

  const clearProgressTimeouts = () => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = null;
    }
  };

  return {
    receivedFirstTextRef,
    responseTimeoutRef,
    stepTimeoutRef,
    resetProgressCircles,
    handleSpecialBlockId,
    handleStepsFromPayload,
    setupProgressTimeouts,
    clearProgressTimeouts,
    isResettingRef
  };
}
