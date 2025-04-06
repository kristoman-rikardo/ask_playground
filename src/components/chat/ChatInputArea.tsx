import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Maximize2 } from 'lucide-react';

interface ChatInputAreaProps {
  onSendMessage: (message: string) => void;
  onInputFocus?: () => void;
  isMinimized?: boolean;
  onMaximize?: () => void;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSendMessage,
  onInputFocus,
  isMinimized = false,
  onMaximize
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const placeholder = isMinimized ? "Click to ask about the product..." : "Ask about the product...";
  
  // Auto-focus on input when component mounts
  useEffect(() => {
    if (inputRef.current && !isMinimized) {
      inputRef.current.focus();
    }
  }, [isMinimized]);
  
  useEffect(() => {
    if (inputValue.trim()) {
      setIsButtonVisible(true);
    } else {
      const timer = setTimeout(() => {
        // Always show button if minimized
        setIsButtonVisible(isMinimized);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [inputValue, isMinimized]);

  // Ensure button is visible when minimized
  useEffect(() => {
    if (isMinimized) {
      setIsButtonVisible(true);
    }
  }, [isMinimized]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    // Send message and clear input
    onSendMessage(inputValue.trim());
    setInputValue('');
    
    // Focus back on input after sending
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (onInputFocus) {
      onInputFocus();
    }
  };

  const handleInputClick = () => {
    if (isMinimized && onMaximize) {
      onMaximize();
    }
  };

  return (
    <div className="w-full bg-transparent p-4 pt-2">
      <div className="flex items-center space-x-2 relative">
        <input 
          ref={inputRef} 
          type="text" 
          value={inputValue} 
          onChange={e => setInputValue(e.target.value)} 
          onKeyPress={e => !isMinimized && e.key === 'Enter' && handleSend()} 
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={() => setIsFocused(false)}
          onClick={handleInputClick}
          readOnly={isMinimized}
          className={`flex-1 px-4 py-2 pr-10 font-light font-sans transition-all duration-300 
            rounded-2xl bg-gray-50/90 
            border border-gray-200 
            shadow-sm hover:shadow-md 
            focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#28483F] 
            active:translate-y-[1px]
            ${isFocused ? 'bg-white' : ''}
            ${isMinimized ? 'cursor-pointer' : ''}`} 
          style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 300 }}
        />
        
        <div 
          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300 transform 
            ${isButtonVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
          {isMinimized ? (
            <button 
              onClick={onMaximize}
              className="p-1.5 text-white rounded-full 
                       transition-all duration-300 transform 
                       hover:bg-opacity-80 active:shadow-sm 
                       focus:outline-none focus:ring-2 focus:ring-green-600"
              aria-label="Expand chat"
              style={{ backgroundColor: "#28483F" }}
            >
              <Maximize2 size={14} className="transform" />
            </button>
          ) : (
            <button 
              onClick={handleSend}
              className={`p-1.5 rounded-full 
                       transition-all duration-300 transform 
                       hover:bg-opacity-80 active:shadow-sm send-button-ripple
                       focus:outline-none focus:ring-2 focus:ring-gray-400
                       ${isFocused ? 'scale-110' : 'scale-100'}`}
              aria-label="Send message"
              style={{ backgroundColor: "#28483F" }}
            >
              <ArrowRight size={14} className="transform transition-transform duration-300 -rotate-45 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInputArea;
