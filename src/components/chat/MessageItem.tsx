import React from 'react';
import { parseMarkdown } from '@/lib/voiceflow';

interface MessageItemProps {
  content: string;
  isUser: boolean;
  isPartial?: boolean;
  messageId: string;
  isLast: boolean;
  lastMessageRef: React.RefObject<HTMLDivElement> | null;
}

const MessageItem: React.FC<MessageItemProps> = ({ 
  content, 
  isUser, 
  isPartial, 
  messageId, 
  isLast,
  lastMessageRef 
}) => {
  const processContent = (content: string) => {
    if (!content) return <div className="h-5 w-20 bg-gray-200/50 rounded animate-pulse"></div>;
    return <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />;
  };

  return (
    <div 
      id={`message-${messageId}`}
      ref={isLast ? lastMessageRef : null}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}
    >
      <div
        className={`rounded-xl font-sans ${
          isUser 
            ? 'chat-message-user max-w-[85%] self-end px-3 py-2'
            : 'chat-message-agent max-w-[85%] self-start px-4 py-2.5'
        }`}
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {processContent(content)}
      </div>
    </div>
  );
};

export default MessageItem;
