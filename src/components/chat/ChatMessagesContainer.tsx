
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
    
    const threshold = 100; // Increased threshold to detect "near bottom" state
    const scrollBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight;
    return scrollBottom <= threshold;
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      const container = chatBoxRef.current;
      
      if (container) {
        messagesEndRef.current.scrollIntoView({
          behavior,
          block: 'end'
        });
      }
    }
  };
  
  // Auto-scroll when messages change or when streaming
  useEffect(() => {
    if (shouldAutoScroll) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [messages, isTyping, carouselData, shouldAutoScroll]);

  // Listen for scroll events to show/hide scroll button
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

  // Handle carousel updates specially
  useEffect(() => {
    if (carouselData && chatBoxRef.current) {
      const nearBottom = isNearBottom();
      setShowScrollButton(!nearBottom);
      
      if (shouldAutoScroll) {
        const timer = setTimeout(() => {
          scrollToBottom();
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [carouselData, shouldAutoScroll]);

  // Reset auto-scroll when messages are cleared
  useEffect(() => {
    if (messages.length === 0) {
      setShouldAutoScroll(true);
      setShowScrollButton(false);
    }
  }, [messages.length]);

  // Always scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      if (shouldAutoScroll) {
        scrollToBottom();
      } else {
        setShowScrollButton(true);
      }
    }
  }, [messages.length]);

  // Focus on streaming message
  useEffect(() => {
    const hasPartialMessages = messages.some(m => m.isPartial);
    
    if (hasPartialMessages && shouldAutoScroll) {
      scrollToBottom('auto');
    }
  }, [messages]);

  return (
    <div 
      ref={chatBoxRef} 
      className="flex-1 overflow-y-auto p-4 pb-1 space-y-2 relative scroll-smooth" 
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
        hasPartialMessages={messages.some(m => m.isPartial)}
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
