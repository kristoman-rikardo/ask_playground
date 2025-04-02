
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
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Auto-scroll when messages change or typing state changes, but only if user hasn't scrolled
  useEffect(() => {
    if (!userHasScrolled) {
      scrollToBottom();
    }
  }, [messages, isTyping, userHasScrolled]);

  // Detect if user has manually scrolled
  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;

    const handleScroll = () => {
      if (chatBox) {
        // Check if user is not at the bottom
        const isNotAtBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight > 50;
        
        // If user scrolls up by a significant amount, disable autoscroll
        if (isNotAtBottom && !userHasScrolled) {
          setUserHasScrolled(true);
        }
        
        // Show/hide scroll button based on scroll position
        setShowScrollButton(isNotAtBottom);
      }
    };

    chatBox.addEventListener('scroll', handleScroll);
    return () => chatBox.removeEventListener('scroll', handleScroll);
  }, []);

  // Also check for scroll events outside of the chat component
  useEffect(() => {
    const handleWindowScroll = () => {
      if (!userHasScrolled) {
        setUserHasScrolled(true);
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [userHasScrolled]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };

  // Reset scroll behavior for new conversation
  useEffect(() => {
    if (messages.length === 0) {
      setUserHasScrolled(false);
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
      
      {/* Scroll to bottom button - now centered */}
      {showScrollButton && (
        <button 
          onClick={scrollToBottom}
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
