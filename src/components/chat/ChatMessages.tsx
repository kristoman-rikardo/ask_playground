
import React, { useRef, useEffect } from 'react';
import { parseMarkdown } from '@/lib/voiceflow';
import TypingIndicator from '../TypingIndicator';
import { Message } from '@/hooks/useChatSession';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
}

// Sparkle SVG icon component
const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
    fill="currentColor" className="size-4 inline-block ml-1 text-gray-400 align-text-bottom">
    <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785
            l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238
            1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192
            -.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238
            -1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1
            -.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1
            .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1
            .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1
            -.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184
            .551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1
            0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1
            .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1
            -.633-.632l-.183-.551Z" />
  </svg>
);

// Component for message feedback
const MessageFeedback = ({
  messageId
}: {
  messageId: string;
}) => {
  const [feedback, setFeedback] = React.useState<'positive' | 'negative' | null>(null);

  React.useEffect(() => {
    // Check for existing feedback when component mounts
    const existingFeedback = JSON.parse(localStorage.getItem('messageFeedback') || '{}');
    if (existingFeedback[messageId]) {
      setFeedback(existingFeedback[messageId]);
    }
  }, [messageId]);

  const handleFeedback = (type: 'positive' | 'negative') => {
    // Toggle feedback if already selected
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);

    // Store feedback in localStorage
    const existingFeedback = JSON.parse(localStorage.getItem('messageFeedback') || '{}');
    if (newFeedback === null) {
      delete existingFeedback[messageId];
    } else {
      existingFeedback[messageId] = newFeedback;
    }
    localStorage.setItem('messageFeedback', JSON.stringify(existingFeedback));
    console.log(`Feedback for message ${messageId}: ${newFeedback || 'removed'}`);
  };

  return (
    <div className="flex flex-col gap-2 absolute right-2 top-1/2 -translate-y-1/2">
      <button onClick={() => handleFeedback('positive')} className="p-1 hover:scale-110 transition-all duration-200" aria-label="Thumbs up">
        <ThumbsUp size={18} className={`${feedback === 'positive' ? 'text-green-500' : 'text-gray-300'} hover:text-green-500`} />
      </button>
      <button onClick={() => handleFeedback('negative')} className="p-1 hover:scale-110 transition-all duration-200" aria-label="Thumbs down">
        <ThumbsDown size={18} className={`${feedback === 'negative' ? 'text-red-500' : 'text-gray-300'} hover:text-red-500`} />
      </button>
    </div>
  );
};

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
    messages: messages.map(m => ({ id: m.id, type: m.type, contentLength: m.content?.length || 0, isPartial: m.isPartial }))
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
    <div 
      ref={chatBoxRef} 
      className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]"
    >
      {messages.length > 0 ? (
        messages.map((message, index) => {
          console.log(`Rendering message ${index}:`, message);
          return (
            <div 
              key={message.id} 
              id={`message-${message.id}`} 
              ref={index === messages.length - 1 ? lastMessageRef : null} 
              className={`px-4 py-3 rounded-xl max-w-[85%] relative ${
                message.type === 'user' 
                  ? 'chat-message-user ml-auto bg-gray-100/50 shadow-none border border-transparent' 
                  : 'chat-message-agent mr-auto shadow-none bg-[#F6F6F7]/70 border border-transparent'
              } ${message.isPartial ? 'border-l-4 border-blue-300/50' : ''}`}
            >
              {message.content ? (
                <div 
                  dangerouslySetInnerHTML={{
                    __html: parseMarkdown(message.content)
                  }} 
                  className={message.isPartial ? 'animate-pulse' : ''}
                />
              ) : (
                <div className="h-5 w-20 bg-gray-200/50 rounded animate-pulse">
                  {/* Empty content placeholder */}
                </div>
              )}
              
              {/* Add sparkle icon at the end of agent non-partial messages */}
              {message.type === 'agent' && !message.isPartial && message.content && (
                <span className="inline-block ml-1">
                  <SparkleIcon />
                </span>
              )}
              
              {message.type === 'agent' && !message.isPartial && message.content && (
                <MessageFeedback messageId={message.id} />
              )}
            </div>
          );
        })
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Starting conversation...</p>
        </div>
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
