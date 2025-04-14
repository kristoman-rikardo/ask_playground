import React from 'react';
import TypingIndicator from '../TypingIndicator';

interface AgentTypingIndicatorProps {
  isTyping: boolean;
  hasPartialMessages: boolean;
  textStreamingStarted?: boolean;
}

const AgentTypingIndicator: React.FC<AgentTypingIndicatorProps> = ({ 
  isTyping, 
  hasPartialMessages,
  textStreamingStarted 
}) => {
  if (!isTyping || hasPartialMessages) return null;
  
  return (
    <div className="ask-px-4 ask-py-2.5 ask-rounded-xl ask-max-w-[85%] ask-mr-auto ask-mb-1">
      <TypingIndicator 
        isTyping={isTyping} 
        textStreamingStarted={textStreamingStarted}
      />
    </div>
  );
};

export default AgentTypingIndicator;
