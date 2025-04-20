import { useRef } from 'react';
import { Button } from '@/types/chat';
import { MessageStreamingHook } from '@/hooks/useMessageStreaming';
import { useCompletionEventHandler } from './useCompletionEventHandler';
import { useTextAndChoiceHandler } from './useTextAndChoiceHandler';
import { useStepProgressManager } from './useStepProgressManager';
import { useTextTraceManager } from './useTextTraceManager';
import { useLoadingPhaseManager } from './useLoadingPhaseManager';
import { logTraceEvent } from '@/utils/traceLogger';
import { processContentStream } from '@/utils/streamingProcessUtils';

export function useTraceDataHandler(
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
  const loadingPhaseManager = useLoadingPhaseManager();
  const stepProgressManager = useStepProgressManager(setStepsTotal, setCurrentStepIndex);
  const textTraceManager = useTextTraceManager();
  
  const processStreamCallback = (content: string, msgId: string) => {
    textTraceManager.textStreamingStartedRef.current = true;
    
    // Signal that we're now in streaming phase
    loadingPhaseManager.switchToStreamingPhase();
    
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
  
  const completionHandler = useCompletionEventHandler(
    streaming,
    setIsTyping
  );
  
  const textAndChoiceHandler = useTextAndChoiceHandler(
    streaming,
    setIsTyping,
    setButtons,
    setIsButtonsLoading,
    processStreamCallback,
    setCarouselData
  );
  
  const handleUserMessage = () => {
    receivedFirstTraceRef.current = false;
    textTraceManager.resetTextTracking();
    
    // Begin in thinking phase
    loadingPhaseManager.switchToThinkingPhase();
    
    // Always start with buttons cleared and loading indicator showing after user input
    setButtons([]);
    setIsButtonsLoading(true);
  };
  
  const handleSpecialBlock = (blockId: string) => {
    // Check if it contains "long" in the blockID to switch to products phase
    if (blockId.toString().includes('long')) {
      loadingPhaseManager.switchToProductsPhase();
    }
  };
  
  const handleTextOrSpeechTrace = (trace: any) => {
    // Complete progress circles before starting text streaming
    textTraceManager.messageCompletedRef.current = true;
    completionHandler.streamingStateRef.current.messageCompleted = true;
    
    // Add a brief delay before showing the text
    textTraceManager.clearTextTraceTimeouts();
    
    // Start text streaming right away
    textTraceManager.textStreamingStartedRef.current = true;
    textAndChoiceHandler.handleTextOrSpeakEvent(trace);
    
    // Now in streaming phase
    loadingPhaseManager.switchToStreamingPhase();
  };
  
  const handleCompletionStart = () => {
    // Reset text streaming flag for new messages
    textTraceManager.resetTextTracking();
    receivedFirstTraceRef.current = true;
    
    // Start in thinking phase
    loadingPhaseManager.switchToThinkingPhase();
    
    // Ensure buttons are cleared and loading indicator is shown
    setButtons([]);
    setIsButtonsLoading(true);
  };
  
  const handleSessionEnd = () => {
    // Session ended
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
  };
  
  return {
    receivedFirstTraceRef,
    textStreamingStartedRef: textTraceManager.textStreamingStartedRef,
    handleUserMessage,
    handleSpecialBlock,
    handleTextOrSpeechTrace,
    handleCompletionStart,
    handleSessionEnd,
    completionHandler,
    textAndChoiceHandler,
    stepProgressManager,
    loadingPhaseManager
  };
}
