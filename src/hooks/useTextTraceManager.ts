
import { useRef } from 'react';

export function useTextTraceManager() {
  const progressCompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textStreamingStartedRef = useRef<boolean>(false);
  const messageCompletedRef = useRef<boolean>(false);
  const isResettingRef = useRef<boolean>(false);
  
  const clearTextTraceTimeouts = () => {
    if (progressCompleteTimeoutRef.current) {
      clearTimeout(progressCompleteTimeoutRef.current);
      progressCompleteTimeoutRef.current = null;
    }
  };

  const resetTextTracking = () => {
    if (isResettingRef.current) return;
    
    isResettingRef.current = true;
    textStreamingStartedRef.current = false;
    messageCompletedRef.current = false;
    clearTextTraceTimeouts();
    
    // Brief delay to prevent race conditions
    setTimeout(() => {
      isResettingRef.current = false;
    }, 50);
  };

  return {
    progressCompleteTimeoutRef,
    textStreamingStartedRef,
    messageCompletedRef,
    clearTextTraceTimeouts,
    resetTextTracking,
    isResettingRef
  };
}
