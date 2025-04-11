import React, { useRef, useState, useEffect, useCallback, memo, useContext } from 'react';
import { Message, Button } from '@/types/chat';
import MessageItem from './MessageItem';
import CarouselMessage from '../carousel/CarouselMessage';
import AgentTypingIndicator from '../indicators/AgentTypingIndicator';
import { useInView } from 'react-intersection-observer';
import { ChatContext } from '@/App';

interface ChatMessagesContainerProps {
  messages: Message[];
  isTyping: boolean;
  textStreamingStarted?: boolean;
  carouselData?: any | null;
  onButtonClick?: (button: Button) => void;
  isMinimized?: boolean;
}

const ChatMessagesContainer: React.FC<ChatMessagesContainerProps> = memo(({
  messages,
  isTyping,
  textStreamingStarted = false,
  carouselData = null,
  onButtonClick,
  isMinimized = false
}) => {
  const { isEmbedded, disableGlobalAutoScroll } = useContext(ChatContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showTopIndicator, setShowTopIndicator] = useState(false);
  const wasMinimizedRef = useRef(isMinimized);
  
  // Use IntersectionObserver to detect when bottom is visible
  const { ref: bottomRef, inView: isBottomVisible } = useInView({
    threshold: 0.1,
  });
  
  // Memoized helper functions
  const isNearBottom = useCallback(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return true;
    
    const threshold = 40;
    const scrollBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight;
    return scrollBottom <= threshold;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      if (isEmbedded && disableGlobalAutoScroll) {
        if (chatBoxRef.current) {
          chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
      } else {
        messagesEndRef.current.scrollIntoView({
          behavior,
          block: 'end'
        });
      }
      setShowTopIndicator(false);
      setShouldAutoScroll(true);
    }
  }, [isEmbedded, disableGlobalAutoScroll]);

  // Handle chat opening/closing
  useEffect(() => {
    if (wasMinimizedRef.current && !isMinimized) {
      requestAnimationFrame(() => {
        scrollToBottom('auto');
      });
    }
    wasMinimizedRef.current = isMinimized;
  }, [isMinimized, scrollToBottom]);

  // Handle scroll events
  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;

    const handleScroll = () => {
      const nearBottom = isNearBottom();
      
      setShowTopIndicator(!nearBottom);
      
      if (nearBottom && !shouldAutoScroll) {
        setShouldAutoScroll(true);
      } else if (!nearBottom && shouldAutoScroll) {
        setShouldAutoScroll(false);
      }
    };

    chatBox.addEventListener('scroll', handleScroll);
    return () => chatBox.removeEventListener('scroll', handleScroll);
  }, [shouldAutoScroll, isNearBottom]);

  // Handle auto-scroll
  useEffect(() => {
    const hasNewMessage = messages.length > 0;
    const isStreaming = messages.some(m => m.isPartial);
    
    if (shouldAutoScroll || hasNewMessage || isStreaming) {
      requestAnimationFrame(() => {
        scrollToBottom(hasNewMessage ? 'smooth' : 'auto');
      });
    }
  }, [messages, isTyping, shouldAutoScroll, scrollToBottom]);

  // Reset auto-scroll when messages are reset
  useEffect(() => {
    if (messages.length === 0) {
      setShouldAutoScroll(true);
      setShowTopIndicator(false);
    }
  }, [messages.length]);

  // Top scroll indicator component
  const TopScrollIndicator = memo(() => (
    <div 
      className={`w-full flex items-center justify-center transition-all duration-300 ${showTopIndicator ? 'opacity-100' : 'opacity-0'}`}
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        pointerEvents: 'none',
        zIndex: 999,
        backgroundColor: 'white',
        height: '2px',
        marginBottom: '2px'
      }}
    >
      <div className="w-[90%] h-[2px] bg-gray-300" style={{ borderRadius: '10px' }}></div>
    </div>
  ));

  TopScrollIndicator.displayName = 'TopScrollIndicator';

  // Determine if the carousel is attached to a message in the current message list
  const carouselAttachedToMessage = carouselData && messages.some(msg => msg.id === carouselData.messageId);

  return (
    <div 
      ref={chatBoxRef} 
      className="flex-1 overflow-y-auto relative scroll-smooth custom-scrollbar" 
      style={{ 
        overflowY: 'auto', 
        minHeight: '0',
        fontFamily: "'Inter', system-ui, sans-serif",
        scrollBehavior: 'smooth'
      }}
    >
      <div className="flex flex-col space-y-2 w-full px-4 pt-2 pb-0 font-sans">
        <TopScrollIndicator />
        
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          const isUser = message.type === 'user';
          
          // Check if this is the message that should display the carousel
          const shouldShowCarousel = carouselData && carouselData.messageId === message.id;
          
          if (shouldShowCarousel) {
            // This message should show a carousel instead of regular content
            return (
              <div 
                key={message.id} 
                id={`message-${message.id}`}
                ref={isLast ? lastMessageRef : null}
                className="flex justify-start w-full relative group"
              >
                <div
                  className="max-w-[100%] self-start px-2 cursor-pointer"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                >
                  <CarouselMessage 
                    cards={carouselData.cards} 
                    onButtonClick={onButtonClick} 
                  />
                </div>
              </div>
            );
          }
          
          // Otherwise, render as a normal message
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
        })}
        
        <AgentTypingIndicator 
          isTyping={isTyping} 
          hasPartialMessages={messages.some(m => m.isPartial)}
          textStreamingStarted={textStreamingStarted}
        />
        
        <div ref={bottomRef} />
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});

ChatMessagesContainer.displayName = 'ChatMessagesContainer';

export default ChatMessagesContainer; 