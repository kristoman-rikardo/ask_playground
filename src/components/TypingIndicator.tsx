
import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-xl max-w-[120px] my-2 animate-fade-in">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot-1"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot-2"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot-3"></div>
    </div>
  );
};

export default TypingIndicator;
