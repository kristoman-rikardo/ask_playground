
import { useRef, useEffect } from 'react';
import { Button } from '@/types/chat';
import { MessageStreamingHook } from '@/hooks/useMessageStreaming';
import { useCompletionEventHandler } from './useCompletionEventHandler';
import { useTextAndChoiceHandler } from './useTextAndChoiceHandler';
import { processContentStream } from '@/utils/streamingProcessUtils';
import { useStepProgressManager } from './useStepProgressManager';
import { useTextTraceManager } from './useTextTraceManager';
import { logTraceEvent } from '@/utils/traceLogger';

// Custom event for loading phase changes
export const createLoadingPhaseEvent = (phase: 'thinking' | 'streaming' | 'products') => {
  const event = new CustomEvent('loadingPhaseChange', {
    detail: { phase }
  });
  window.dispatchEvent(event);
};

export function useTraceEventHandler(
  streaming: MessageStreamingHook,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
  setButtons: React.Dispatch<React.SetStateAction<Button[]>>,
  setIsButtonsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setStepsTotal: React.Dispatch<React.SetStateAction<number>>,
  setCurrentStepIndex: React.Dispatch<React.SetStateAction<number>>,
  setCarouselData: React.Dispatch<React.SetStateAction<any | null>>
) {
  const receivedFirstTraceRef = useRef<boolean>(false);
  
  // Initialize our specialized managers
  const stepProgressManager = useStepProgressManager(setStepsTotal, setCurrentStepIndex);
  const textTraceManager = useTextTraceManager();
  
  const completionHandler = useCompletionEventHandler(
    streaming,
    setIsTyping
  );
  
  const processStreamCallback = (content: string, msgId: string) => {
    stepProgressManager.receivedFirstTextRef.current = true;
    textTraceManager.textStreamingStartedRef.current = true;
    
    // Clear timeout references when we start processing text
    stepProgressManager.clearProgressTimeouts();
    
    // Signal that we're now in streaming phase
    createLoadingPhaseEvent('streaming');
    
    processContentStream(
      content, 
      msgId, 
      streaming.wordTrackerRef.current, 
      streaming.updatePartialMessage,
      completionHandler.streamingStateRef.current,
      () => {
        if (
          completionHandler.streamingStateRef.current.messageCompleted && 
          !completionHandler.streamingStateRef.current.isStreaming && 
          streaming.partialMessageIdRef.current
        ) {
          const currentMsgId = streaming.partialMessageIdRef.current;
          const finalText = streaming.wordTrackerRef.current.getCurrentProcessedText();
          streaming.updatePartialMessage(currentMsgId, finalText, false);
          streaming.partialMessageIdRef.current = null;
          completionHandler.streamingStateRef.current.isStreaming = false;
          completionHandler.streamingStateRef.current.waitingForMoreContent = false;
          streaming.currentCompletionContentRef.current = '';
        }
      }
    );
  };
  
  const textAndChoiceHandler = useTextAndChoiceHandler(
    streaming,
    setIsTyping,
    setButtons,
    setIsButtonsLoading,
    processStreamCallback,
    setCarouselData
  );
  
  // Cleanup all timeouts
  useEffect(() => {
    return () => {
      stepProgressManager.clearProgressTimeouts();
      textTraceManager.clearTextTraceTimeouts();
    };
  }, []);
  
  const handleTraceEvent = (trace: any) => {
    const traceType = trace.type || 'unknown';
    
    // Log the trace with our utility
    logTraceEvent(traceType, trace.payload);
    
    // For user messages, reset the tracking state
    if (trace.type === 'user') {
      receivedFirstTraceRef.current = false;
      stepProgressManager.resetProgressCircles();
      textTraceManager.resetTextTracking();
      setCarouselData(null);
      
      // Begin in thinking phase
      createLoadingPhaseEvent('thinking');
    }
    
    if (trace.type === 'speak' || 
        trace.type === 'text' || 
        (trace.type === 'completion' && trace.payload?.state === 'start')) {
      receivedFirstTraceRef.current = true;
      
      // Clear timeout when we receive actual trace data
      stepProgressManager.clearProgressTimeouts();
    }
    
    // Check for special block ID - support multiple block IDs
    if (trace.type === 'block' && trace.payload?.blockID) {
      // Mark that we received a block, which indicates a transition
      stepProgressManager.handleSpecialBlockId(trace.payload.blockID);
      
      // Check if it contains "long" in the blockID to switch to products phase
      if (trace.payload.blockID.toString().includes('long')) {
        createLoadingPhaseEvent('products');
      }
    }
    
    // Handle steps data if available
    if (!stepProgressManager.handleStepsFromPayload(trace.payload)) {
      // Set up progress timeouts if no steps data
      stepProgressManager.setupProgressTimeouts();
    }
    
    switch (trace.type) {
      case 'speak':
      case 'text':
        // Complete progress circles before starting text streaming
        textTraceManager.messageCompletedRef.current = true;
        completionHandler.streamingStateRef.current.messageCompleted = true;
        
        // Add a brief delay before showing the text to ensure circles complete
        textTraceManager.clearTextTraceTimeouts();
        
        // First ensure loading bar completes fully
        textTraceManager.progressCompleteTimeoutRef.current = setTimeout(() => {
          // Then after a small delay, start text streaming
          textTraceManager.textTraceTimeoutRef.current = setTimeout(() => {
            textTraceManager.textStreamingStartedRef.current = true;
            textAndChoiceHandler.handleTextOrSpeakEvent(trace);
            stepProgressManager.receivedFirstTextRef.current = true;
            
            // Now in streaming phase
            createLoadingPhaseEvent('streaming');
          }, 500); // Additional 500ms delay for smooth transition after progress completion
        }, 600); // 600ms delay to show completed loading before text starts
        break;
      
      case 'completion':
        // Handle completion events
        if (trace.payload?.state === 'start') {
          // Reset text streaming flag for new messages
          textTraceManager.resetTextTracking();
          // Always reset progress circles for new messages
          stepProgressManager.resetProgressCircles();
          receivedFirstTraceRef.current = true;
          // Start in thinking phase
          createLoadingPhaseEvent('thinking');
        }
        completionHandler.handleCompletionEvent(trace.payload);
        break;
      
      case 'choice':
        console.log('🔴 BUTTON TRACE RECEIVED:', trace.payload?.buttons?.length || 0, 'buttons');
        textAndChoiceHandler.handleChoiceEvent(trace);
        break;
      
      case 'carousel':
        console.log('🟣 CAROUSEL TRACE RECEIVED:', trace.payload?.cards?.length || 0, 'cards');
        textAndChoiceHandler.handleCarouselEvent(trace);
        // Switch to streaming phase when carousel is displayed
        createLoadingPhaseEvent('streaming');
        break;
      
      case 'end':
        console.log('Session ended');
        completionHandler.streamingStateRef.current.messageCompleted = true;
        textTraceManager.messageCompletedRef.current = true;
        
        if (
          completionHandler.streamingStateRef.current.accumulatedContent.length > 0 && 
          !completionHandler.streamingStateRef.current.isStreaming && 
          streaming.partialMessageIdRef.current
        ) {
          processStreamCallback(
            completionHandler.streamingStateRef.current.accumulatedContent,
            streaming.partialMessageIdRef.current
          );
          completionHandler.streamingStateRef.current.accumulatedContent = '';
        }
        
        // Clear all timeouts on session end
        stepProgressManager.clearProgressTimeouts();
        textTraceManager.clearTextTraceTimeouts();
        break;
      
      default:
        break;
    }
  };

  return {
    handleTraceEvent,
    receivedFirstTraceRef,
    textStreamingStartedRef: textTraceManager.textStreamingStartedRef
  };
}
