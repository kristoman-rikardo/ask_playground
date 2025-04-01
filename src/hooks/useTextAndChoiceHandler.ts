
import { useRef } from 'react';
import { Button } from '@/types/chat';
import { MessageStreamingHook } from '@/hooks/useMessageStreaming';

export function useTextAndChoiceHandler(
  streaming: MessageStreamingHook,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
  setButtons: React.Dispatch<React.SetStateAction<Button[]>>,
  setIsButtonsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  processStreamCallback: (content: string, msgId: string) => void
) {
  const typingIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    partialMessageIdRef,
    messageSourceTracker,
    addAgentMessage,
  } = streaming;

  const handleTextOrSpeakEvent = (trace: any) => {
    if (trace.payload && trace.payload.message) {
      const messageContent = trace.payload.message;
      const msgId = `text-${Date.now()}`;
      
      messageSourceTracker.current[msgId] = 'text';
      
      console.log('Text/Speak message received:', messageContent.substring(0, 50) + '...');
      
      // Hide typing indicator when starting to stream
      setIsTyping(false);
      
      // Create message container and start streaming
      partialMessageIdRef.current = msgId;
      addAgentMessage('', true, msgId);
      
      // Process the text message character by character at 5ms intervals
      processStreamCallback(messageContent, msgId);
      return true; // Message is complete when delivered
    }
  };

  const handleChoiceEvent = (trace: any) => {
    if (trace.payload && trace.payload.buttons) {
      console.log('Choices received:', trace.payload.buttons);
      // Display buttons immediately when they arrive, regardless of message streaming status
      setButtons(trace.payload.buttons || []);
      setIsButtonsLoading(false);
    }
  };

  return {
    handleTextOrSpeakEvent,
    handleChoiceEvent,
    typingIndicatorTimeoutRef
  };
}
