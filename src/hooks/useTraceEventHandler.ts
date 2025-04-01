
import { useRef } from 'react';
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
  
  const handleTraceEvent = (trace: any) => {
    console.log('Trace event received:', trace.type);
    
    // Detect first content-bearing trace and ensure we start streaming immediately
    if (trace.type === 'speak' || trace.type === 'text' || (trace.type === 'completion' && trace.payload?.state === 'content')) {
      receivedFirstTraceRef.current = true;
      
      // Ensure we immediately hide typing indicator for any content-bearing trace
      if (trace.type !== 'completion' || (trace.type === 'completion' && trace.payload?.state === 'content' && trace.payload?.content)) {
        console.log('⚡ First content received, hiding typing indicator');
        setIsTyping(false);
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
