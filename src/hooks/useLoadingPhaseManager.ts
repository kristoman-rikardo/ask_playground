
import { useRef } from 'react';

// Custom event for loading phase changes
export const createLoadingPhaseEvent = (phase: 'thinking' | 'streaming' | 'products') => {
  const event = new CustomEvent('loadingPhaseChange', {
    detail: { phase }
  });
  window.dispatchEvent(event);
};

export function useLoadingPhaseManager() {
  const currentPhaseRef = useRef<'thinking' | 'streaming' | 'products'>('thinking');
  
  const setLoadingPhase = (phase: 'thinking' | 'streaming' | 'products') => {
    currentPhaseRef.current = phase;
    createLoadingPhaseEvent(phase);
  };
  
  const switchToThinkingPhase = () => {
    setLoadingPhase('thinking');
  };
  
  const switchToStreamingPhase = () => {
    setLoadingPhase('streaming');
  };
  
  const switchToProductsPhase = () => {
    setLoadingPhase('products');
  };
  
  return {
    currentPhaseRef,
    setLoadingPhase,
    switchToThinkingPhase,
    switchToStreamingPhase,
    switchToProductsPhase
  };
}
