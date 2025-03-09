
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { delay } from '@/lib/voiceflow';

interface ChatInputAreaProps {
  onSendMessage: (message: string) => void;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSendMessage
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isInputStreaming, setIsInputStreaming] = useState(false);
  const [placeholder, setPlaceholder] = useState('Spør meg om...');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const suggestions = [
    "Spør meg om returvilkårene for denne varen...", 
    "Spør meg om materialbruk og teknologier i dette produktet...", 
    "Spør meg om bærekraft i produksjonen av denne varen...", 
    "Spør meg om størrelsesanbefalinger for dette produktet...", 
    "Spør meg om vedlikeholdstips for denne varen...", 
    "Spør meg om garanti og reklamasjonsrettigheter for dette produktet..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isInputStreaming && inputValue === '' && !isFocused) {
        streamPlaceholder();
      }
    }, 4000); // Even more frequent streaming

    return () => clearInterval(interval);
  }, [inputValue, isInputStreaming, isFocused]);

  const streamPlaceholder = async () => {
    if (isInputStreaming || inputValue !== '') return;
    setIsInputStreaming(true);
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    const baseText = 'Spør meg om '; // Base text with space but no ellipsis

    // Set the base text first
    setPlaceholder(baseText + '...');

    // Stream the remaining characters into the placeholder (minus the ellipsis at the end)
    const remainingText = randomSuggestion.substring(baseText.length, randomSuggestion.length - 3);
    let currentText = baseText;
    for (let i = 0; i < remainingText.length; i++) {
      currentText += remainingText[i];
      setPlaceholder(currentText + '...');
      await delay(40 + Math.random() * 20); // Slightly faster streaming
    }

    // Wait when fully written
    await delay(2000);

    // Reset to base text with ellipsis without animation
    setPlaceholder('Spør meg om...');
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
          onChange={e => setInputValue(e.target.value)} 
          onKeyPress={e => e.key === 'Enter' && handleSend()} 
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`flex-1 px-4 py-2 border font-light transition-all duration-300 rounded-2xl bg-gray-50
            ${isFocused 
              ? 'border-gray-500 ring-2 ring-gray-200' 
              : inputValue 
                ? 'border-gray-400' 
                : 'border-gray-300 hover:border-gray-400'
            }`} 
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
