
import { useRef } from 'react';
import { Button } from '@/types/chat';
import { MessageStreamingHook } from '@/hooks/useMessageStreaming';
import { useCompletionEventHandler } from './useCompletionEventHandler';
import { useTextAndChoiceHandler } from './useTextAndChoiceHandler';

export function useTraceEventHandler(
  streaming: MessageStreamingHook,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
  setButtons: React.Dispatch<React.SetStateAction<Button[]>>,
  setIsButtonsLoading: React.Dispatch<React.SetStateAction<boolean>>
) {
  const receivedFirstTraceRef = useRef<boolean>(false);
  
  // Initialize event handlers
  const completionHandler = useCompletionEventHandler(
    streaming,
    setIsTyping
  );
  
  const textAndChoiceHandler = useTextAndChoiceHandler(
    streaming,
    setIsTyping,
    setButtons,
    setIsButtonsLoading,
    completionHandler.processContentStream
  );
  
  const handleTraceEvent = (trace: any) => {
    console.log('Trace event received:', trace.type);
    
    if (trace.type === 'speak' || trace.type === 'text' || (trace.type === 'completion' && trace.payload?.state === 'content')) {
      receivedFirstTraceRef.current = true;
    }
    
    switch (trace.type) {
      case 'speak':
      case 'text':
        textAndChoiceHandler.handleTextOrSpeakEvent(trace);
        completionHandler.messageCompletedRef.current = true;
        break;
      
      case 'completion':
        completionHandler.handleCompletionEvent(trace.payload);
        break;
      
      case 'choice':
        // Handle choice events immediately, regardless of message streaming status
        textAndChoiceHandler.handleChoiceEvent(trace);
        break;
      
      case 'end':
        console.log('Session ended');
        completionHandler.messageCompletedRef.current = true;
        
        // If we have pending content and we're not currently streaming, process it
        if (
          completionHandler.accumulatedContentRef.current.length > 0 && 
          !completionHandler.isStreamingRef.current && 
          streaming.partialMessageIdRef.current
        ) {
          completionHandler.processContentStream(
            completionHandler.accumulatedContentRef.current, 
            streaming.partialMessageIdRef.current
          );
          completionHandler.accumulatedContentRef.current = '';
        }
        
        // Check and finalize any pending message
        completionHandler.checkAndFinalizeMessage();
        
        setTimeout(() => {
          setIsTyping(false);
          // Don't reset buttons loading here as they may have already been displayed
        }, 50);
        break;
      
      default:
        // Handle other trace types if needed
        break;
    }
  };

  return {
    handleTraceEvent,
    receivedFirstTraceRef
  };
}
