
import { useRef, useState } from 'react';
import { Button } from '@/types/chat';
import { MessageStreamingHook } from '@/hooks/useMessageStreaming';
import { useCompletionEventHandler } from './useCompletionEventHandler';
import { useTextAndChoiceHandler } from './useTextAndChoiceHandler';
import { processContentStream } from '@/utils/streamingProcessUtils';

export function useTraceEventHandler(
  streaming: MessageStreamingHook,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
  setButtons: React.Dispatch<React.SetStateAction<Button[]>>,
  setIsButtonsLoading: React.Dispatch<React.SetStateAction<boolean>>
) {
  const receivedFirstTraceRef = useRef<boolean>(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(1);
  
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
          
          // Advance the step when a message is completed
          setCurrentStep(prev => {
            const newStep = prev + 1;
            return newStep < totalSteps ? newStep : 0; // Reset if we've reached the end
          });
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
  
  const handleTraceEvent = (trace: any) => {
    console.log('Trace event received:', trace.type);
    
    // Detect if we're starting a multi-step sequence
    if (trace.type === 'flow.start' && trace.payload?.diagramID) {
      // A new flow starting might indicate multiple steps
      setCurrentStep(0);
      // We could potentially get the number of steps from the flow payload
      // For now, let's assume a default of 2 steps for flows
      setTotalSteps(2);
    }
    
    if (trace.type === 'speak' || trace.type === 'text' || (trace.type === 'completion' && trace.payload?.state === 'content')) {
      receivedFirstTraceRef.current = true;
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
        
        // Reset steps at the end of a session
        setTotalSteps(1);
        setCurrentStep(0);
        break;
      
      default:
        // Handle other trace types if needed
        break;
    }
  };

  return {
    handleTraceEvent,
    receivedFirstTraceRef,
    currentStep,
    totalSteps
  };
}
