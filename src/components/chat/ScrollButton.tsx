
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
      style={{
        position: "absolute",
        bottom: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: visible ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center"
      }}
      aria-label="Scroll to bottom"
    >
      <ArrowDown size={20} className="text-gray-600" />
    </button>
  );
};

export default ScrollButton;
