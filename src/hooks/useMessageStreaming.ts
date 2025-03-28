
import { useRef } from 'react';
import { Message } from '@/types/chat';

// Flag to ensure we schedule only one update per animation frame
let updateScheduled = false;

export interface MessageStreamingHook {
  currentCompletionContentRef: React.MutableRefObject<string>;
  partialMessageIdRef: React.MutableRefObject<string | null>;
  messageSourceTracker: React.MutableRefObject<Record<string, string>>;
  updatePartialMessage: (messageId: string, text: string, isPartial?: boolean) => void;
  addAgentMessage: (text: string, isPartial?: boolean, existingId?: string) => void;
  scheduleUpdate: (msgId: string) => void;
}

export function useMessageStreaming(
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
): MessageStreamingHook {
  const partialMessageIdRef = useRef<string | null>(null);
  const currentCompletionContentRef = useRef<string>('');
  const messageSourceTracker = useRef<Record<string, string>>({});

  // Throttles updates using requestAnimationFrame for smooth UI rendering
  const scheduleUpdate = (msgId: string) => {
    if (!updateScheduled) {
      updateScheduled = true;
      requestAnimationFrame(() => {
        // Update the partial message with the accumulated content buffer
        updatePartialMessage(msgId, currentCompletionContentRef.current, true);
        updateScheduled = false;
      });
    }
  };

  // Character-by-character streaming update with improved randomness
  const updatePartialMessage = (messageId: string, text: string, isPartial = true) => {
    setMessages(prev => {
      const existingMessageIndex = prev.findIndex(msg => msg.id === messageId);
      
      if (existingMessageIndex !== -1) {
        const updatedMessages = [...prev];
        updatedMessages[existingMessageIndex] = {
          ...updatedMessages[existingMessageIndex],
          content: text,
          isPartial
        };
        return updatedMessages;
      }
      
      // If creating a new message
      const newMessage: Message = {
        id: messageId,
        type: 'agent',
        content: text,
        isPartial
      };
      return [...prev, newMessage];
    });
  };

  const addAgentMessage = (text: string, isPartial = false, existingId?: string) => {
    const messageId = existingId || Date.now().toString();
    
    console.log(`${isPartial ? 'Partial' : 'Final'} agent message:`, { 
      messageId, 
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''), 
      isPartial 
    });
    
    updatePartialMessage(messageId, text, isPartial);

    if (!isPartial) {
      partialMessageIdRef.current = null;
    } else {
      partialMessageIdRef.current = messageId;
    }
  };

  return {
    currentCompletionContentRef,
    partialMessageIdRef,
    messageSourceTracker,
    updatePartialMessage,
    addAgentMessage,
    scheduleUpdate
  };
}
