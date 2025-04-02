
import React, { useRef, useState, useEffect } from 'react';
import { Message, Button } from '@/types/chat';
import MessageItem from './MessageItem';
import ScrollButton from './ScrollButton';
import CarouselMessage from './CarouselMessage';
import AgentTypingIndicator from './AgentTypingIndicator';

interface ChatMessagesContainerProps {
  messages: Message[];
  isTyping: boolean;
  textStreamingStarted?: boolean;
  carouselData?: any | null;
  onButtonClick?: (button: Button) => void;
}

const ChatMessagesContainer: React.FC<ChatMessagesContainerProps> = ({
  messages,
  isTyping,
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

  return (
    <div 
      ref={chatBoxRef} 
      className="flex-1 overflow-y-auto p-4 pb-1 space-y-2 relative" 
      style={{ minHeight: messages.length > 0 ? '0' : '0', maxHeight: '100%' }}
    >
      <div className="flex flex-col space-y-2 w-full">
        {messages.length > 0 ? messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          const isUser = message.type === 'user';
          
          return (
            <MessageItem
              key={message.id}
              messageId={message.id}
              content={message.content}
              isUser={isUser}
              isPartial={message.isPartial}
              isLast={isLast}
              lastMessageRef={lastMessageRef}
            />
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
      
      <AgentTypingIndicator 
        isTyping={isTyping} 
        hasPartialMessages={hasPartialMessages}
        textStreamingStarted={textStreamingStarted}
      />
      
      <ScrollButton
        visible={showScrollButton}
        onClick={() => {
          scrollToBottom();
          setShouldAutoScroll(true);
        }}
      />
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessagesContainer;
