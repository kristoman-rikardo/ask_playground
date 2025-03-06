
import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1.5 p-3 bg-faq-agent rounded-xl max-w-[90px] my-2 animate-fade-in">
      <div className="w-2.5 h-2.5 bg-faq-dark rounded-full animate-pulse-dot-1"></div>
      <div className="w-2.5 h-2.5 bg-faq-dark rounded-full animate-pulse-dot-2"></div>
      <div className="w-2.5 h-2.5 bg-faq-dark rounded-full animate-pulse-dot-3"></div>
    </div>
  );
};

export default TypingIndicator;
