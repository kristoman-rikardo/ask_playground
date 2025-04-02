
import { useRef } from 'react';

export function useTextTraceManager() {
  const progressCompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textStreamingStartedRef = useRef<boolean>(false);
  const messageCompletedRef = useRef<boolean>(false);
  
  const clearTextTraceTimeouts = () => {
    if (progressCompleteTimeoutRef.current) {
      clearTimeout(progressCompleteTimeoutRef.current);
      progressCompleteTimeoutRef.current = null;
    }
  };

  const resetTextTracking = () => {
    textStreamingStartedRef.current = false;
    messageCompletedRef.current = false;
    clearTextTraceTimeouts();
  };

  return {
    progressCompleteTimeoutRef,
    textStreamingStartedRef,
    messageCompletedRef,
    clearTextTraceTimeouts,
    resetTextTracking
  };
}
