
import React, { useRef, useEffect } from 'react';
import { parseMarkdown } from '@/lib/voiceflow';
import TypingIndicator from '../TypingIndicator';
import { Message } from '@/hooks/useChatSession';

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isTyping
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // Log what we're rendering
  console.log('Rendering ChatMessages:', {
    messageCount: messages.length,
    isTyping,
    messages: messages.map(m => ({
      id: m.id,
      type: m.type,
      contentLength: m.content?.length || 0,
      isPartial: m.isPartial
    }))
  });

  // Auto-scroll when messages change or typing state changes
  useEffect(() => {
    console.log('Messages or typing state changed, scrolling to bottom');
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };

  return (
    <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
      {messages.length > 0 ? messages.map((message, index) => {
        console.log(`Rendering message ${index}:`, message);
        return (
          <div 
            key={message.id} 
            id={`message-${message.id}`} 
            ref={index === messages.length - 1 ? lastMessageRef : null} 
            className={`px-4 py-3 rounded-xl max-w-[85%] relative ${
              message.type === 'user' 
                ? 'chat-message-user ml-auto bg-gray-200 shadow-sm border border-transparent' 
                : 'chat-message-agent mr-auto shadow-sm bg-gray-50 border border-transparent'
            } ${message.isPartial ? 'border-l-4 border-gray-200' : ''}`}
          >
            {message.content ? (
              <div 
                dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }} 
                className={message.isPartial ? 'streaming-content' : ''}
              />
            ) : (
              <div className="h-5 w-20 bg-gray-200/50 rounded animate-pulse">
                {/* Empty content placeholder */}
              </div>
            )}
          </div>
        );
      }) : (
        <div className="flex items-center justify-center h-full"></div>
      )}
      
      {isTyping && (
        <div className="mt-2">
          <TypingIndicator />
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
