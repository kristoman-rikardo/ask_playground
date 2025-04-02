
import React, { useRef, useEffect, useState } from 'react';
import { parseMarkdown } from '@/lib/voiceflow';
import TypingIndicator from '../TypingIndicator';
import { Message } from '@/types/chat';
import CarouselMessage from './CarouselMessage';
import { Button } from '@/types/chat';
import { ArrowDown } from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';

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
  
  const isNearBottom = () => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return true;
    
    const threshold = 80;
    const scrollBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight;
    return scrollBottom <= threshold;
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = chatBoxRef.current;
      
      if (container) {
        messagesEndRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  };
  
  useEffect(() => {
    if (shouldAutoScroll) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [messages, isTyping, carouselData, shouldAutoScroll]);

  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;

    const handleScroll = () => {
      if (chatBox) {
        const nearBottom = isNearBottom();
        setShowScrollButton(!nearBottom);
        
        if (nearBottom) {
          setShouldAutoScroll(true);
        } 
        else if (!nearBottom && shouldAutoScroll) {
          setShouldAutoScroll(false);
        }
      }
    };

    chatBox.addEventListener('scroll', handleScroll);
    return () => chatBox.removeEventListener('scroll', handleScroll);
  }, [shouldAutoScroll]);

  // Check for carousel data specifically and update scroll button visibility
  useEffect(() => {
    if (carouselData && chatBoxRef.current) {
      const nearBottom = isNearBottom();
      setShowScrollButton(!nearBottom);
      
      // If we're getting new carousel data and we're set to auto scroll
      if (shouldAutoScroll) {
        const timer = setTimeout(() => {
          scrollToBottom();
        }, 100); // slightly longer delay for carousels to render
        return () => clearTimeout(timer);
      }
    }
  }, [carouselData, shouldAutoScroll]);

  useEffect(() => {
    if (messages.length === 0) {
      setShouldAutoScroll(true);
      setShowScrollButton(false);
    }
  }, [messages.length]);

  useEffect(() => {
    if (messages.length > 0 && shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages.length]);

  const hasPartialMessages = messages.some(m => m.isPartial);
  
  const visibleMessages = messages;

  const processContent = (content: string, isPartial: boolean | undefined, messageType: 'user' | 'agent') => {
    if (!content) return <div className="h-5 w-20 bg-gray-200/50 rounded animate-pulse"></div>;
    
    return <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />;
  };

  return (
    <div 
      ref={chatBoxRef} 
      className="flex-1 overflow-y-auto p-4 pb-1 space-y-2 relative" 
      style={{ minHeight: messages.length > 0 ? '0' : '0', maxHeight: '100%' }}
    >
      <div className="flex flex-col space-y-2 w-full">
        {visibleMessages.length > 0 ? visibleMessages.map((message, index) => {
          const isLast = index === visibleMessages.length - 1;
          const isUser = message.type === 'user';
          
          return (
            <div 
              key={message.id} 
              id={`message-${message.id}`}
              ref={isLast ? lastMessageRef : null}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}
            >
              <div
                className={`px-4 py-3 rounded-xl ${
                  isUser 
                    ? 'chat-message-user max-w-[85%] self-end'
                    : 'chat-message-agent max-w-[85%] self-start'
                }`}
              >
                {processContent(message.content, message.isPartial, message.type)}
              </div>
            </div>
          );
        }) : null}
      </div>
      
      {carouselData && onButtonClick && (
        <div className="w-full mb-1">
          <CarouselMessage 
            cards={carouselData.cards} 
            onButtonClick={onButtonClick} 
          />
        </div>
      )}
      
      {isTyping && !hasPartialMessages && (
        <div className="px-4 py-3 rounded-xl max-w-[85%] mr-auto mb-1">
          <TypingIndicator 
            isTyping={isTyping} 
            textStreamingStarted={textStreamingStarted}
          />
        </div>
      )}
      
      {showScrollButton && (
        <button 
          onClick={() => {
            scrollToBottom();
            setShouldAutoScroll(true);
          }}
          className="fixed z-10 bg-gray-200 hover:bg-gray-300 rounded-full p-2 shadow-sm transition-all duration-200"
          style={{
            bottom: '70px', // Position above the button panel/input area
            left: '50%',
            transform: 'translateX(-50%)'
          }}
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
