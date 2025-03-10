
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
  
  // Short and long suggestion variations based on widget width
  const shortSuggestions = [
    "Spør meg om returvilkår...", 
    "Spør meg om materialer...", 
    "Spør meg om bærekraft...", 
    "Spør meg om størrelser...", 
    "Spør meg om vedlikehold...", 
    "Spør meg om garantier..."
  ];
  
  const longSuggestions = [
    "Spør meg om returvilkårene for denne varen...", 
    "Spør meg om materialbruk og teknologier i dette produktet...", 
    "Spør meg om bærekraft i produksjonen av denne varen...", 
    "Spør meg om størrelsesanbefalinger for dette produktet...", 
    "Spør meg om vedlikeholdstips for denne varen...", 
    "Spør meg om garanti og reklamasjonsrettigheter for dette produktet..."
  ];
  
  // Detect widget width to use appropriate suggestion length
  const [useShortSuggestions, setUseShortSuggestions] = useState(false);
  
  useEffect(() => {
    const checkWidth = () => {
      // When container is less than 400px wide, use short suggestions
      const widgetWidth = document.querySelector('.widget-container')?.clientWidth || 0;
      setUseShortSuggestions(widgetWidth < 400);
    };
    
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isInputStreaming && inputValue === '' && !isFocused) {
        streamPlaceholder();
      }
    }, 1800); // More frequent streaming

    return () => clearInterval(interval);
  }, [inputValue, isInputStreaming, isFocused, useShortSuggestions]);

  const streamPlaceholder = async () => {
    if (isInputStreaming || inputValue !== '') return;
    setIsInputStreaming(true);
    
    // Choose suggestion set based on widget width
    const suggestions = useShortSuggestions ? shortSuggestions : longSuggestions;
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
      await delay(80); // Delay between letters
    }

    // Wait when fully written
    await delay(2000);

    // Erase letter by letter with animation
    const fullText = currentText + '...';
    for (let i = fullText.length; i > baseText.length; i--) {
      setPlaceholder(fullText.substring(0, i));
      await delay(40); // Faster deletion animation (smaller delay)
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
    <div className="w-full bg-gray-50 border-t border-gray-200 p-4">
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
          className={`flex-1 px-4 py-2 pr-10 border font-light font-sans transition-all duration-300 rounded-2xl bg-gray-50
            ${isFocused 
              ? 'border-gray-500 ring-2 ring-gray-200' 
              : inputValue 
                ? 'border-gray-400' 
                : 'border-gray-300 hover:border-gray-400'
            }`} 
          style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
        />
        
        {/* Animated circular send button - visible only when input has content */}
        {inputValue.trim() && (
          <button 
            onClick={handleSend}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-gray-800 text-white rounded-full 
                     transition-all duration-300 transform hover:scale-110 active:scale-95
                     hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400
                     animate-scale-in hover:shadow-md"
            aria-label="Send message"
          >
            <Send size={14} className="transform rotate-0 hover:rotate-45 transition-transform duration-300" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInputArea;
