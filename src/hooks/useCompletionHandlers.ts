import { StreamingProcessState, processContentStream } from '@/utils/streamingProcessUtils';
import { MessageStreamingHook } from '@/hooks/useMessageStreaming';

/**
 * Handlers for completion events
 */
export const createCompletionHandlers = (
  streaming: MessageStreamingHook,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
  streamingState: StreamingProcessState,
  typingIndicatorTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
) => {
  const {
    partialMessageIdRef,
    currentCompletionContentRef,
    wordTrackerRef,
    messageSourceTracker,
    updatePartialMessage,
    addAgentMessage,
  } = streaming;

  /**
   * Handle the start of a completion event
   */
  const handleCompletionStart = () => {
    console.log('Completion started');
    const msgId = `completion-${Date.now()}`;
    
    // Check if we already have a text message
    const hasTextMessage = Object.values(messageSourceTracker.current).includes('text');
    streamingState.messageCompleted = false;
    
    wordTrackerRef.current.reset();
    streamingState.accumulatedContent = '';
    
    if (!hasTextMessage) {
      // Clear any existing typing indicator timeout
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
        typingIndicatorTimeoutRef.current = null;
      }
      
      // Keep typing indicator until just before streaming starts
      setIsTyping(true);
      streamingState.waitingForMoreContent = true;
      
      // Immediately start the message without delay
      partialMessageIdRef.current = msgId;
      currentCompletionContentRef.current = '';
      messageSourceTracker.current[msgId] = 'completion';
      setIsTyping(false); // Hide typing indicator when message starts
      streamingState.waitingForMoreContent = false;
      
      addAgentMessage('', true, msgId);
      typingIndicatorTimeoutRef.current = null;
    } else {
      console.log('Skipping completion message as we already have a text message');
    }
    return true;
  };

  /**
   * Handle content from a completion event
   */
  const handleCompletionContent = (content: string | undefined) => {
    if (!content) return;
    
    console.log(`Received content trace: "${content}"`);
    
    // If we haven't started a message yet
    if (!partialMessageIdRef.current && !streamingState.isStreaming) {
      const msgId = `completion-${Date.now()}`;
      
      // Clear any existing typing indicator timeout
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
        typingIndicatorTimeoutRef.current = null;
      }
      
      // Show typing indicator for a short natural delay
      setIsTyping(true);
      
      // Immediately start the message without delay
      partialMessageIdRef.current = msgId;
      currentCompletionContentRef.current = '';
      messageSourceTracker.current[msgId] = 'completion';
      setIsTyping(false); // Hide typing indicator when message starts
      streamingState.isStreaming = false;
      streamingState.waitingForMoreContent = false;
      
      addAgentMessage('', true, msgId);
      typingIndicatorTimeoutRef.current = null;
      
      // Start streaming the first content
      processContentStream(
        content, 
        msgId, 
        wordTrackerRef.current, 
        updatePartialMessage, 
        streamingState, 
        checkAndFinalizeMessage
      );
    } 
    else if (partialMessageIdRef.current) {
      // If we're already streaming a message
      const msgId = partialMessageIdRef.current;
      
      if (streamingState.isStreaming) {
        // If we're currently streaming, add this content to accumulated buffer
        streamingState.accumulatedContent += content;
        console.log(`Added to buffer (now ${streamingState.accumulatedContent.length} chars)`);
      } else {
        // If we're not currently streaming, start streaming this content
        processContentStream(
          content, 
          msgId, 
          wordTrackerRef.current, 
          updatePartialMessage, 
          streamingState, 
          checkAndFinalizeMessage
        );
      }
    }
  };

  /**
   * Handle the end of a completion event
   */
  const handleCompletionEnd = () => {
    console.log('Completion ended');
    streamingState.messageCompleted = true;
    
    // If we have pending content and we're not currently streaming, process it
    if (
      streamingState.accumulatedContent.length > 0 && 
      !streamingState.isStreaming && 
      partialMessageIdRef.current
    ) {
      processContentStream(
        streamingState.accumulatedContent, 
        partialMessageIdRef.current, 
        wordTrackerRef.current, 
        updatePartialMessage, 
        streamingState, 
        checkAndFinalizeMessage
      );
      streamingState.accumulatedContent = '';
    }
    
    // Mark the message as no longer partial once complete and all content is processed
    checkAndFinalizeMessage();
  };
  
  /**
   * Check and finalize the message if it's complete
   */
  const checkAndFinalizeMessage = () => {
    if (
      streamingState.messageCompleted && 
      !streamingState.isStreaming && 
      partialMessageIdRef.current
    ) {
      console.log('Message completed, finalizing');
      const currentMsgId = partialMessageIdRef.current;
      
      // Ensure all content is processed
      const finalText = wordTrackerRef.current.getCurrentProcessedText();
      updatePartialMessage(currentMsgId, finalText, false);
      partialMessageIdRef.current = null;
      streamingState.isStreaming = false;
      streamingState.waitingForMoreContent = false;
      currentCompletionContentRef.current = '';
    }
  };

  return {
    handleCompletionStart,
    handleCompletionContent,
    handleCompletionEnd,
    checkAndFinalizeMessage
  };
};
