import React, { memo } from 'react';
import TypingIndicator from './TypingIndicator';

interface AgentTypingIndicatorProps {
  isTyping: boolean;
  hasPartialMessages: boolean;
  textStreamingStarted?: boolean;
}

const AgentTypingIndicator: React.FC<AgentTypingIndicatorProps> = memo(({ 
  isTyping, 
  hasPartialMessages,
  textStreamingStarted 
}) => {
  if (!isTyping) return null;
  
  return (
    <div className="px-4 py-2.5 rounded-xl max-w-[85%] mr-auto mb-1">
      <TypingIndicator 
        isTyping={isTyping} 
        textStreamingStarted={textStreamingStarted}
      />
    </div>
  );
});

AgentTypingIndicator.displayName = 'AgentTypingIndicator';

export default AgentTypingIndicator; 