
import { useRef } from 'react';

export function useTextTraceManager() {
  const textStreamingStartedRef = useRef<boolean>(false);
  const messageCompletedRef = useRef<boolean>(false);
  const progressCompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textTraceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTextTracking = () => {
    textStreamingStartedRef.current = false;
    messageCompletedRef.current = false;
    clearTextTraceTimeouts();
  };

  const clearTextTraceTimeouts = () => {
    if (progressCompleteTimeoutRef.current) {
      clearTimeout(progressCompleteTimeoutRef.current);
      progressCompleteTimeoutRef.current = null;
    }
    
    if (textTraceTimeoutRef.current) {
      clearTimeout(textTraceTimeoutRef.current);
      textTraceTimeoutRef.current = null;
    }
  };

  return {
    textStreamingStartedRef,
    messageCompletedRef,
    progressCompleteTimeoutRef,
    textTraceTimeoutRef,
    resetTextTracking,
    clearTextTraceTimeouts
  };
}
