
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
    <div className="px-4 py-3 rounded-xl max-w-[85%] mr-auto mb-1">
      <TypingIndicator 
        isTyping={isTyping} 
        textStreamingStarted={textStreamingStarted}
      />
    </div>
  );
};

export default AgentTypingIndicator;
