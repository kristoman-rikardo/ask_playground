import { useRef } from 'react';
import { Button } from '@/types/chat';
import { MessageStreamingHook } from '@/hooks/useMessageStreaming';
import { streamWords } from '@/utils/streamingUtils';

export function useTextAndChoiceHandler(
  streaming: MessageStreamingHook,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
  setButtons: React.Dispatch<React.SetStateAction<Button[]>>,
  setIsButtonsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  processStreamCallback: (content: string, msgId: string) => void,
  setCarouselData?: React.Dispatch<React.SetStateAction<any | null>>
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
      
      console.log('🟡 Text/Speak message received:', messageContent.substring(0, 50) + '...');
      
      // Hide typing indicator when starting to stream
      setIsTyping(false);
      
      // Create empty message container first
      partialMessageIdRef.current = msgId;
      addAgentMessage('', true, msgId);
      
      console.log('🟢 Beginning text stream with character-by-character rendering');
      
      // Stream the message character by character using streamWords
      streamWords(
        messageContent,
        (updatedText) => {
          streaming.updatePartialMessage(msgId, updatedText, true);
        },
        () => {
          // Mark as complete when done
          streaming.updatePartialMessage(msgId, messageContent, false);
          partialMessageIdRef.current = null;
        },
        5 // 5ms delay between characters
      );
      
      return true;
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

  const handleCarouselEvent = (trace: any) => {
    if (trace.payload && trace.payload.cards && setCarouselData) {
      console.log('🔵 Processing carousel with', trace.payload.cards.length, 'cards');
      setIsTyping(false);
      
      // Create a special message ID for this carousel
      const carouselMsgId = `carousel-${Date.now()}`;
      messageSourceTracker.current[carouselMsgId] = 'carousel';
      
      // Important: Add an actual message to the chat for the carousel
      // This ensures it appears in the normal message flow
      // We use empty content because the carousel UI will replace it
      addAgentMessage('', false, carouselMsgId);
      
      // Set carousel data with a reference to the message we just created
      // This links the carousel to its message in the chat flow
      setCarouselData({
        layout: trace.payload.layout,
        cards: trace.payload.cards,
        messageId: carouselMsgId,
        timestamp: Date.now()
      });
      
      console.log('✅ Added carousel message to chat with ID:', carouselMsgId);
    }
  };

  return {
    handleTextOrSpeakEvent,
    handleChoiceEvent,
    handleCarouselEvent,
    typingIndicatorTimeoutRef
  };
}
