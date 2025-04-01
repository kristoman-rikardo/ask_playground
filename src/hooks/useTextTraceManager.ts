
import { useRef } from 'react';

export function useTextTraceManager() {
  const progressCompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textStreamingStartedRef = useRef<boolean>(false);
  
  const clearTextTraceTimeouts = () => {
    if (progressCompleteTimeoutRef.current) {
      clearTimeout(progressCompleteTimeoutRef.current);
      progressCompleteTimeoutRef.current = null;
    }
  };

  return {
    progressCompleteTimeoutRef,
    textStreamingStartedRef,
    clearTextTraceTimeouts
  };
}
