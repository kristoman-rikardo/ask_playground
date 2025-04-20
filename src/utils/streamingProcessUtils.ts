import { StreamingWordTracker } from '@/utils/streamingUtils';

/**
 * Utility for processing content streams
 */
export interface StreamingProcessState {
  isStreaming: boolean;
  waitingForMoreContent: boolean;
  messageCompleted: boolean;
  accumulatedContent: string;
}

export const createStreamingProcessState = (): StreamingProcessState => ({
  isStreaming: false,
  waitingForMoreContent: false,
  messageCompleted: false,
  accumulatedContent: '',
});

/**
 * Process a content stream character by character
 */
export const processContentStream = (
  content: string,
  msgId: string,
  wordTracker: StreamingWordTracker,
  updatePartialMessage: (messageId: string, text: string, isPartial?: boolean) => void,
  streamingState: StreamingProcessState,
  onStreamComplete: () => void
): void => {
  if (!content || content.length === 0) return;
  
  streamingState.isStreaming = true;
  streamingState.waitingForMoreContent = false;
  
  // Stream each character with a 5ms delay
  let index = 0;
  let currentText = wordTracker.getCurrentProcessedText();
  
  const streamNextChar = () => {
    if (index < content.length) {
      const char = content[index];
      currentText += char;
      
      // Update the UI with the new character
      updatePartialMessage(msgId, currentText, true);
      
      // Update our word tracker's processed text
      wordTracker.appendContent(char);
      
      // Move to next character
      index++;
      
      // Schedule next character with 5ms delay (as requested)
      setTimeout(streamNextChar, 5);
    } else {
      // Done streaming this content chunk
      streamingState.isStreaming = false;
      
      // Check if we have more content in the buffer to process
      if (streamingState.accumulatedContent.length > 0) {
        const nextContent = streamingState.accumulatedContent;
        streamingState.accumulatedContent = '';
        processContentStream(nextContent, msgId, wordTracker, updatePartialMessage, streamingState, onStreamComplete);
      } else if (streamingState.messageCompleted) {
        // If the message is completed and we've processed all content
        onStreamComplete();
      } else {
        // Otherwise we're waiting for more content
        streamingState.waitingForMoreContent = true;
      }
    }
  };
  
  // Start streaming
  streamNextChar();
};
