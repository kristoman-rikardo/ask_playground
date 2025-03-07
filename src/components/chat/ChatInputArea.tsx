
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { delay } from '@/lib/voiceflow';

interface ChatInputAreaProps {
  onSendMessage: (message: string) => void;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({ onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const [isInputStreaming, setIsInputStreaming] = useState(false);
  const [placeholder, setPlaceholder] = useState('Type your question...');
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = [
    "Spør om produktet egner seg godt løper",
    "Spør om returvilkårene for denne varen"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isInputStreaming && inputValue === '') {
        streamPlaceholder();
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [inputValue, isInputStreaming]);

  const streamPlaceholder = async () => {
    if (isInputStreaming || inputValue !== '') return;
    
    setIsInputStreaming(true);
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    let currentText = '';
    
    // Clear the placeholder first
    setPlaceholder('');
    
    // Stream the characters into the placeholder
    for (let i = 0; i < randomSuggestion.length; i++) {
      currentText += randomSuggestion[i];
      setPlaceholder(currentText);
      await delay(50 + Math.random() * 30);
    }
    
    await delay(2000);
    
    // Stream the characters back out
    for (let i = currentText.length; i >= 0; i--) {
      setPlaceholder(currentText.substring(0, i) || 'Type your question...');
      await delay(20);
    }
    
    setIsInputStreaming(false);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  return (
    <div className="w-full bg-gray-50 border-t border-gray-200 p-4">
      <div className="flex items-center space-x-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => !isInputStreaming && setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
          disabled={isInputStreaming}
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim()}
          className="p-2 bg-gray-800 text-white rounded-xl transition-colors hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-10 w-10"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatInputArea;
