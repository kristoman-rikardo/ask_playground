
import React, { useState, useRef, useEffect } from 'react';

interface ChatInputAreaProps {
  onSendMessage: (message: string) => void;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({ onSendMessage }) => {
  const [inputMessage, setInputMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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

  return (
    <div className="p-3 bg-transparent">
      <div className="flex items-end bg-white chat-input border border-gray-300 rounded-lg overflow-hidden">
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          className="flex-1 p-3 leading-relaxed outline-none resize-none rounded-l-lg h-[40px] max-h-[120px] bg-white"
          placeholder="Type your message..."
          rows={1}
        />
        <button
          onClick={handleSendMessage}
          className={`p-3 flex items-center justify-center w-12 h-[40px] transition-colors ${
            inputMessage.trim() ? 'text-blue-500 hover:text-blue-600' : 'text-gray-400'
          }`}
          disabled={!inputMessage.trim()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatInputArea;
