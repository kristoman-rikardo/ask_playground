
import React, { useRef, useEffect, useState } from 'react';
import { parseMarkdown } from '@/lib/voiceflow';
import TypingIndicator from '../TypingIndicator';
import { Message } from '@/types/chat';
import CarouselMessage from './CarouselMessage';
import { Button } from '@/types/chat';
import { ArrowDown } from "lucide-react";

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  stepsTotal?: number;
  currentStepIndex?: number;
  textStreamingStarted?: boolean;
  carouselData?: any | null;
  onButtonClick?: (button: Button) => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isTyping,
  stepsTotal = 1,
  currentStepIndex = 0,
  textStreamingStarted = false,
  carouselData = null,
  onButtonClick
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  // Check if user is near bottom of chat
  const isNearBottom = () => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return true;
    
    const threshold = 50; // pixels from bottom to consider "near bottom"
    const scrollBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight;
    return scrollBottom <= threshold;
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  
  // Auto-scroll when messages change or typing state changes, but only if we should auto-scroll
  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, isTyping, shouldAutoScroll]);

  // Detect if user has manually scrolled
  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;

    const handleScroll = () => {
      if (chatBox) {
        // Check if user is not at the bottom
        const nearBottom = isNearBottom();
        setShowScrollButton(!nearBottom);
        
        // If user scrolls to bottom, re-enable auto-scroll
        if (nearBottom && !shouldAutoScroll) {
          setShouldAutoScroll(true);
        } 
        // If user scrolls up, disable auto-scroll
        else if (!nearBottom && shouldAutoScroll) {
          setShouldAutoScroll(false);
        }
      }
    };

    chatBox.addEventListener('scroll', handleScroll);
    return () => chatBox.removeEventListener('scroll', handleScroll);
  }, [shouldAutoScroll]);

  // Reset scroll behavior for new conversation
  useEffect(() => {
    if (messages.length === 0) {
      setShouldAutoScroll(true);
      setShowScrollButton(false);
    }
  }, [messages.length]);

  // Check if any message is currently streaming (partial)
  const hasPartialMessages = messages.some(m => m.isPartial);
  
  // Get only the most recent messages for display
  const visibleMessages = messages;

  // Process content to ensure we handle HTML content properly
  const processContent = (content: string, isPartial: boolean | undefined, messageType: 'user' | 'agent') => {
    if (!content) return <div className="h-5 w-20 bg-gray-200/50 rounded animate-pulse"></div>;
    
    // Display content directly for both user and agent messages
    return <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />;
  };

  return (
    <div 
      ref={chatBoxRef} 
      className="flex-1 overflow-y-auto p-4 space-y-4 relative" 
      style={{ minHeight: messages.length > 0 ? '0' : '0' }}
    >
      {visibleMessages.length > 0 ? visibleMessages.map((message, index) => {
        const isLast = index === visibleMessages.length - 1;
        
        return (
          <div 
            key={message.id} 
            id={`message-${message.id}`} 
            ref={isLast ? lastMessageRef : null} 
            className={`px-4 py-3 rounded-xl relative ${
              message.type === 'user' 
                ? 'chat-message-user ml-auto bg-gray-200 shadow-sm border border-transparent inline-block max-w-[85%] w-auto' 
                : 'chat-message-agent mr-auto shadow-sm bg-gray-50 border border-transparent max-w-[85%]'
            } ${message.isPartial ? 'border-l-2 border-gray-300' : ''}`}
          >
            {processContent(message.content, message.isPartial, message.type)}
          </div>
        );
      }) : null}
      
      {/* Show carousel data if available */}
      {carouselData && onButtonClick && (
        <div className="w-full my-4">
          <CarouselMessage 
            cards={carouselData.cards} 
            onButtonClick={onButtonClick} 
          />
        </div>
      )}
      
      {/* Only show typing indicator when isTyping is true and no messages are currently streaming */}
      {isTyping && !hasPartialMessages && (
        <div className="px-4 py-3 rounded-xl max-w-[85%] mr-auto">
          <TypingIndicator 
            isTyping={isTyping} 
            textStreamingStarted={textStreamingStarted}
          />
        </div>
      )}
      
      {/* Scroll to bottom button - centered */}
      {showScrollButton && (
        <button 
          onClick={() => {
            scrollToBottom();
            setShouldAutoScroll(true);
          }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow-md transition-all duration-200 z-10"
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={20} className="text-gray-600" />
        </button>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatMessages;
