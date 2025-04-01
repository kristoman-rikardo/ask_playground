
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
      
      // Hide typing indicator immediately when text arrives
      setIsTyping(false);
      console.log('⚡ Text content received, starting streaming immediately');
      
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
      const buttonCount = trace.payload.buttons.length;
      console.log(`🔵 Processing ${buttonCount} buttons`);
      
      // Priority display - always show buttons immediately when they arrive
      setIsButtonsLoading(false);
      
      if (buttonCount > 0) {
        console.log('🟢 BUTTONS LOADED:', trace.payload.buttons.map((b: Button) => b.name).join(', '));
        setButtons(trace.payload.buttons || []);
      } else {
        console.log('⚪ No buttons to display');
        setButtons([]);
      }
    }
  };

  return {
    handleTextOrSpeakEvent,
    handleChoiceEvent,
    typingIndicatorTimeoutRef
  };
}
