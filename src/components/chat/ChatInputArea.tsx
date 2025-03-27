
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
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
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Short suggestion variations
  const suggestions = [
    "Spør meg om returvilkår", 
    "Spør meg om materialer", 
    "Spør meg om bærekraft", 
    "Spør meg om størrelser"
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isInputStreaming && inputValue === '' && !isFocused) {
        streamPlaceholder();
      }
    }, 1200); // More frequent streaming

    return () => clearInterval(interval);
  }, [inputValue, isInputStreaming, isFocused]);
  
  // Handle button visibility with animation delay
  useEffect(() => {
    if (inputValue.trim()) {
      setIsButtonVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsButtonVisible(false);
      }, 300); // Match the exit animation duration
      return () => clearTimeout(timer);
    }
  }, [inputValue]);

  const streamPlaceholder = async () => {
    if (isInputStreaming || inputValue !== '') return;
    setIsInputStreaming(true);
    
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    const baseText = 'Spør meg om '; // Base text with space but no ellipsis

    // Set the base text first
    setPlaceholder(baseText + '...');

    // Stream the remaining characters letter by letter
    const remainingText = randomSuggestion.substring(baseText.length);
    let currentText = baseText;
    
    for (let i = 0; i < remainingText.length; i++) {
      currentText += remainingText[i];
      setPlaceholder(currentText + '...');
      await delay(30); // Faster typing (was 40)
    }

    // Wait when fully written
    await delay(1200); // Shorter wait time (was 1500)

    // Erase letter by letter with animation - faster deletion
    const fullText = currentText + '...';
    for (let i = fullText.length; i > baseText.length; i--) {
      setPlaceholder(fullText.substring(0, i));
      await delay(15); // Much faster deletion (was 20)
    }

    // Reset to base text with ellipsis
    setPlaceholder('Spør meg om...');
    setIsInputStreaming(false);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  return (
    <div className="w-full bg-transparent border-t border-transparent p-4">
      <div className="flex items-center space-x-2 relative">
        <input 
          ref={inputRef} 
          type="text" 
          value={inputValue} 
          onChange={e => setInputValue(e.target.value)} 
          onKeyPress={e => e.key === 'Enter' && handleSend()} 
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`flex-1 px-4 py-2 pr-10 font-light font-sans transition-all duration-300 rounded-2xl bg-transparent
            border border-gray-200 ${isFocused 
              ? 'ring-1 ring-gray-200/50' 
              : inputValue 
                ? '' 
                : 'hover:border-gray-300/50'
            }`} 
          style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
        />
        
        {/* Animated circular send button with scale-in/out and ripple effect */}
        <div 
          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300 transform 
            ${isButtonVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
        >
          <button 
            onClick={handleSend}
            className="p-1.5 bg-transparent text-gray-600 rounded-full 
                     transition-all duration-300 transform hover:scale-110 active:scale-95
                     hover:bg-gray-100/50 focus:outline-none"
            aria-label="Send message"
          >
            <ArrowRight size={14} className="transform transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInputArea;
