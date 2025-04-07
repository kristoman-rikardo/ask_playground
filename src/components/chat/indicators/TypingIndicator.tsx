import React, { memo } from 'react';

interface TypingIndicatorProps {
  isTyping: boolean;
  textStreamingStarted?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = memo(({ 
  isTyping, 
  textStreamingStarted = false 
}) => {
  if (!isTyping) return null;

  // Viser en enkel lasteindikator uten prikker
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="simple-loader" aria-label="Loading" role="status"></div>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

export default TypingIndicator; 