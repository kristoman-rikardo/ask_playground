
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputAreaProps {
  onSendMessage: (message: string) => void;
  isCollapsed?: boolean;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({ 
  onSendMessage,
  isCollapsed = false
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-focus input on component mount
  useEffect(() => {
    if (inputRef.current && !isCollapsed) {
      inputRef.current.focus();
    }
  }, [isCollapsed]);

  // Handle text input changes with auto-resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    setInputMessage(target.value);
    
    // Reset height to auto to correctly calculate the new height
    target.style.height = 'auto';
    
    // Set new height based on scrollHeight, with a max of 120px
    const newHeight = Math.min(target.scrollHeight, 120);
    target.style.height = `${newHeight}px`;
  };

  // Handle sending messages
  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
      
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  // Handle key press events (Enter to send, Shift+Enter for new line)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="p-3 bg-transparent transition-all duration-300 ease-in-out">
      <div className="flex items-end bg-white chat-input border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          className="flex-1 p-3 leading-relaxed outline-none resize-none rounded-l-lg h-[40px] max-h-[120px] bg-white"
          placeholder="Spør om produktet..."
          rows={1}
        />
        <button
          onClick={handleSendMessage}
          className={`p-3 flex items-center justify-center w-12 h-[40px] transition-colors ${
            inputMessage.trim() ? 'text-gray-700 hover:text-gray-900' : 'text-gray-400'
          }`}
          disabled={!inputMessage.trim()}
        >
          <Send size={20} strokeWidth={2} className="transform -rotate-45" />
        </button>
      </div>
    </div>
  );
};

export default ChatInputArea;
