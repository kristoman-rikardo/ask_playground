
import React, { useRef, useEffect } from 'react';
import { parseMarkdown } from '@/lib/voiceflow';
import TypingIndicator from '../TypingIndicator';
import { Message } from '@/types/chat';
import CarouselMessage from './CarouselMessage';
import { Button } from '@/types/chat';

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

  // Auto-scroll when messages change or typing state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };

  // Check if any message is currently streaming (partial)
  const hasPartialMessages = messages.some(m => m.isPartial);

  // Process content to ensure we handle HTML content properly
  const processContent = (content: string, isPartial: boolean | undefined, messageType: 'user' | 'agent') => {
    if (!content) return <div className="h-5 w-20 bg-gray-200/50 rounded animate-pulse"></div>;
    
    // Display content directly for both user and agent messages
    return <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />;
  };

  return (
    <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
      {messages.length > 0 ? messages.map((message, index) => {
        const isLast = index === messages.length - 1;
        
        return (
          <div 
            key={message.id} 
            id={`message-${message.id}`} 
            ref={isLast ? lastMessageRef : null} 
            className={`px-4 py-3 rounded-xl max-w-[85%] relative ${
              message.type === 'user' 
                ? 'chat-message-user ml-auto bg-gray-200 shadow-sm border border-transparent' 
                : 'chat-message-agent mr-auto shadow-sm bg-gray-50 border border-transparent'
            } ${message.isPartial ? 'border-l-2 border-gray-300' : ''}`}
          >
            {processContent(message.content, message.isPartial, message.type)}
          </div>
        );
      }) : (
        <div className="flex items-center justify-center h-full">
          {/* Empty state */}
        </div>
      )}
      
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
      
      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatMessages;
