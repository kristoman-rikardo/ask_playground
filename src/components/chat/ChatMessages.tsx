
import React, { useRef, useEffect } from 'react';
import { parseMarkdown } from '@/lib/voiceflow';
import TypingIndicator from '../TypingIndicator';
import { Message } from '@/hooks/useChatSession';

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isTyping }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div 
      ref={chatBoxRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {messages.map((message, index) => (
        <div
          key={message.id}
          id={`message-${message.id}`}
          ref={index === messages.length - 1 ? lastMessageRef : null}
          className={`px-4 py-3 rounded-xl max-w-[85%] ${
            message.type === 'user' 
              ? 'chat-message-user ml-auto bg-gray-200' 
              : 'chat-message-agent mr-auto bg-gray-200'
          }`}
          dangerouslySetInnerHTML={{ 
            __html: parseMarkdown(message.content || '') 
          }}
        />
      ))}
      
      {isTyping && <TypingIndicator />}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
