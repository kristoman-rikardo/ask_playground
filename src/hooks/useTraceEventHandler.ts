
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
  const receivedFirstTextRef = useRef<boolean>(false);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressCompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const completionHandler = useCompletionEventHandler(
    streaming,
    setIsTyping
  );
  
  const processStreamCallback = (content: string, msgId: string) => {
    receivedFirstTextRef.current = true;
    
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
    
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = null;
    }
    
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
  
  // Reset progress circles for new message interactions
  const resetProgressCircles = () => {
    receivedFirstTextRef.current = false;
    // Reset to initial state when a new message starts
    setStepsTotal(1);
    setCurrentStepIndex(0);
  };
  
  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
      }
      if (progressCompleteTimeoutRef.current) {
        clearTimeout(progressCompleteTimeoutRef.current);
      }
    };
  }, []);
  
  const handleTraceEvent = (trace: any) => {
    const traceType = trace.type || 'unknown';
    
    let logPrefix = '📋';
    
    switch (traceType) {
      case 'speak':
        logPrefix = '🗣️';
        break;
      case 'text':
        logPrefix = '📝';
        break;
      case 'choice':
        logPrefix = '🔘';
        break;
      case 'completion':
        logPrefix = '✍️';
        break;
      case 'end':
        logPrefix = '🏁';
        break;
      case 'flow':
        logPrefix = '🌊';
        break;
      case 'block':
        logPrefix = '🧱';
        break;
      case 'debug':
        logPrefix = '🔍';
        break;
      default:
        break;
    }
    
    if (trace.payload) {
      const shortPayload = JSON.stringify(trace.payload).substring(0, 100);
      console.log(`${logPrefix} Trace [${traceType}]: ${shortPayload}${shortPayload.length >= 100 ? '...' : ''}`);
    } else {
      console.log(`${logPrefix} Trace received: ${traceType}`);
    }
    
    if (trace.type === 'speak' || 
        trace.type === 'text' || 
        (trace.type === 'completion' && trace.payload?.state === 'start')) {
      receivedFirstTraceRef.current = true;
      
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
        responseTimeoutRef.current = null;
      }
      
      // Reset progress for every new message, not just the first one
      if (trace.type === 'completion' && trace.payload?.state === 'start') {
        resetProgressCircles();
      }
    }
    
    // Check for the specific block ID that should trigger another circle
    if (trace.type === 'block' && trace.payload?.blockID === '67d742f919dcd04caec92381') {
      console.log('🔵 Detected special block ID, adding another circle');
      setStepsTotal(prev => Math.max(prev + 1, 3));
      setCurrentStepIndex(prev => prev + 1);
    }
    
    if (trace.payload?.steps) {
      setStepsTotal(trace.payload.steps.total || 1);
      setCurrentStepIndex(trace.payload.steps.current || 0);
    } else {
      if (responseTimeoutRef.current === null && trace.type !== 'end' && !receivedFirstTextRef.current) {
        responseTimeoutRef.current = setTimeout(() => {
          if (!receivedFirstTextRef.current) {
            setStepsTotal((current) => Math.max(current, 2));
            setCurrentStepIndex(1);
            
            stepTimeoutRef.current = setTimeout(() => {
              if (!receivedFirstTextRef.current) {
                setStepsTotal((current) => Math.max(current, 3));
                setCurrentStepIndex(2);
              }
            }, 1500);
          }
        }, 4000);
      }
    }
    
    switch (trace.type) {
      case 'speak':
      case 'text':
        // Complete progress circles before starting text streaming
        completionHandler.streamingStateRef.current.messageCompleted = true;
        
        // Add a brief delay before showing the text to ensure circles complete
        if (progressCompleteTimeoutRef.current) {
          clearTimeout(progressCompleteTimeoutRef.current);
        }
        
        progressCompleteTimeoutRef.current = setTimeout(() => {
          textAndChoiceHandler.handleTextOrSpeakEvent(trace);
          receivedFirstTextRef.current = true;
        }, 500); // 500ms delay to show completed circles before text starts
        break;
      
      case 'completion':
        // Handle completion events
        if (trace.payload?.state === 'start') {
          // Always reset progress circles for new messages
          resetProgressCircles();
        }
        completionHandler.handleCompletionEvent(trace.payload);
        break;
      
      case 'choice':
        console.log('🔴 BUTTON TRACE RECEIVED:', trace.payload?.buttons?.length || 0, 'buttons');
        textAndChoiceHandler.handleChoiceEvent(trace);
        break;
      
      case 'end':
        console.log('Session ended');
        completionHandler.streamingStateRef.current.messageCompleted = true;
        
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
        
        if (responseTimeoutRef.current) {
          clearTimeout(responseTimeoutRef.current);
          responseTimeoutRef.current = null;
        }
        if (stepTimeoutRef.current) {
          clearTimeout(stepTimeoutRef.current);
          stepTimeoutRef.current = null;
        }
        if (progressCompleteTimeoutRef.current) {
          clearTimeout(progressCompleteTimeoutRef.current);
          progressCompleteTimeoutRef.current = null;
        }
        break;
      
      default:
        break;
    }
  };

  return {
    handleTraceEvent,
    receivedFirstTraceRef
  };
}
