
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
    wordTrackerRef,
    addAgentMessage,
  } = streaming;

  const handleTextOrSpeakEvent = (trace: any) => {
    if (trace.payload && trace.payload.message) {
      const messageContent = trace.payload.message;
      const msgId = `text-${Date.now()}`;
      
      messageSourceTracker.current[msgId] = 'text';
      
      console.log('Text/Speak message received:', messageContent.substring(0, 50) + '...');
      
      // Clear any existing typing indicator timeout
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
        typingIndicatorTimeoutRef.current = null;
      }
      
      // Show typing indicator for a short natural delay
      setIsTyping(true);
      
      // After a brief delay, replace typing indicator with streaming message
      typingIndicatorTimeoutRef.current = setTimeout(() => {
        partialMessageIdRef.current = msgId;
        setIsTyping(false); // Hide typing indicator when message starts
        
        addAgentMessage('', true, msgId);
        typingIndicatorTimeoutRef.current = null;
        
        // Process the text message in the same way as completion content
        processStreamCallback(messageContent, msgId);
        return true; // Message is complete when delivered
      }, 500); // 500ms delay for natural transition
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
