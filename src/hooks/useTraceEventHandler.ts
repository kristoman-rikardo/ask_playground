
import { useRef, useEffect } from 'react';
import { Button } from '@/types/chat';
import { MessageStreamingHook } from '@/hooks/useMessageStreaming';
import { useCompletionEventHandler } from './useCompletionEventHandler';
import { useTextAndChoiceHandler } from './useTextAndChoiceHandler';
import { processContentStream } from '@/utils/streamingProcessUtils';

export function useTraceEventHandler(
  streaming: MessageStreamingHook,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
  setButtons: React.Dispatch<React.SetStateAction<Button[]>>,
  setIsButtonsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setStepsTotal: React.Dispatch<React.SetStateAction<number>>,
  setCurrentStepIndex: React.Dispatch<React.SetStateAction<number>>
) {
  const receivedFirstTraceRef = useRef<boolean>(false);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize event handlers
  const completionHandler = useCompletionEventHandler(
    streaming,
    setIsTyping
  );
  
  // Create a callback for text processing
  const processStreamCallback = (content: string, msgId: string) => {
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
    processStreamCallback
  );
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
      }
    };
  }, []);
  
  const handleTraceEvent = (trace: any) => {
    console.log('Trace event received:', trace.type);
    
    if (trace.type === 'speak' || trace.type === 'text' || (trace.type === 'completion' && trace.payload?.state === 'content')) {
      receivedFirstTraceRef.current = true;
      
      // Clear any pending response timeout
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
        responseTimeoutRef.current = null;
      }
    }
    
    // Handle step progress from trace payload
    if (trace.payload?.steps) {
      // Update the total number of steps if provided
      setStepsTotal(trace.payload.steps.total || 1);
      // Update the current step index if provided
      setCurrentStepIndex(trace.payload.steps.current || 0);
    } else {
      // If no explicit steps in payload but we're still typing after 3 seconds,
      // increment the step counter automatically
      if (responseTimeoutRef.current === null && trace.type !== 'end') {
        responseTimeoutRef.current = setTimeout(() => {
          setStepsTotal((current) => Math.max(current, 2));
          setCurrentStepIndex(1);
          
          // Set up next step timeout (1.5s for subsequent steps)
          stepTimeoutRef.current = setTimeout(() => {
            setStepsTotal((current) => Math.max(current, 3));
            setCurrentStepIndex(2);
          }, 1500);
          
        }, 3000);
      }
    }
    
    switch (trace.type) {
      case 'speak':
      case 'text':
        textAndChoiceHandler.handleTextOrSpeakEvent(trace);
        completionHandler.streamingStateRef.current.messageCompleted = true;
        break;
      
      case 'completion':
        completionHandler.handleCompletionEvent(trace.payload);
        break;
      
      case 'choice':
        // Handle choice events immediately, regardless of message streaming status
        console.log('🔴 BUTTON TRACE RECEIVED:', trace.payload?.buttons?.length || 0, 'buttons');
        textAndChoiceHandler.handleChoiceEvent(trace);
        break;
      
      case 'end':
        console.log('Session ended');
        completionHandler.streamingStateRef.current.messageCompleted = true;
        
        // If we have pending content and we're not currently streaming, process it
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
        
        // Clear any pending timeouts on session end
        if (responseTimeoutRef.current) {
          clearTimeout(responseTimeoutRef.current);
          responseTimeoutRef.current = null;
        }
        if (stepTimeoutRef.current) {
          clearTimeout(stepTimeoutRef.current);
          stepTimeoutRef.current = null;
        }
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
