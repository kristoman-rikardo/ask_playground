
import React, { useRef, useEffect, useState } from 'react';
import { parseMarkdown } from '@/lib/voiceflow';
import TypingIndicator from '../TypingIndicator';
import { Message } from '@/hooks/useChatSession';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
}

// Component for message feedback
const MessageFeedback = ({ messageId }: { messageId: string }) => {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  
  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
    // Here you could send the feedback to your backend
    console.log(`Feedback for message ${messageId}: ${type}`);
  };
  
  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
      <ThumbsUp 
        className={`feedback-icon feedback-icon-positive ${feedback === 'positive' ? 'text-green-500' : ''}`} 
        onClick={() => handleFeedback('positive')}
      />
      <ThumbsDown 
        className={`feedback-icon feedback-icon-negative ${feedback === 'negative' ? 'text-red-500' : ''}`} 
        onClick={() => handleFeedback('negative')}
      />
    </div>
  );
};

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
        >
          <div
            dangerouslySetInnerHTML={{ 
              __html: parseMarkdown(message.content || '') 
            }}
          />
          {message.type === 'agent' && <MessageFeedback messageId={message.id} />}
        </div>
      ))}
      
      {isTyping && <TypingIndicator />}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
