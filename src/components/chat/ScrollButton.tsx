
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
      className="scroll-button-container bg-gray-200 hover:bg-gray-300 rounded-full p-2 shadow-md transition-all duration-200 flex items-center justify-center space-x-1"
      style={{
        position: "absolute",
        bottom: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: visible ? "flex" : "none"
      }}
      aria-label="Scroll to bottom"
    >
      <span className="text-xs text-gray-600 font-medium hidden sm:inline">New messages</span>
      <ArrowDown size={16} className="text-gray-600" />
    </button>
  );
};

export default ScrollButton;
