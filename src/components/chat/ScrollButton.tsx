
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
      className="scroll-button-container bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 border border-gray-200"
      style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        zIndex: 50,
        display: visible ? "flex" : "none"
      }}
      aria-label="Scroll to bottom"
    >
      <span className="text-xs text-gray-700 font-medium hidden sm:inline">New messages</span>
      <ArrowDown size={16} className="text-gray-700" />
    </button>
  );
};

export default ScrollButton;
