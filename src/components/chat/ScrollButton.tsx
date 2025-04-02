
import React from 'react';
import { ArrowDown } from "lucide-react";

interface ScrollButtonProps {
  onClick: () => void;
  visible: boolean;
}

const ScrollButton: React.FC<ScrollButtonProps> = ({ onClick, visible }) => {
  if (!visible) return null;
  
  return (
    <button 
      onClick={onClick}
      className="scroll-button-container bg-gray-200 hover:bg-gray-300 rounded-full p-2 shadow-sm transition-all duration-200"
      aria-label="Scroll to bottom"
    >
      <ArrowDown size={20} className="text-gray-600" />
    </button>
  );
};

export default ScrollButton;
