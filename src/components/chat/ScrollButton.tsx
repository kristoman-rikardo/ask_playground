
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
      className="fixed z-50 bg-primary/80 text-white rounded-full p-2 shadow-lg hover:bg-primary/90 transition-all duration-200 flex items-center justify-center"
      style={{
        bottom: "20px",
        right: "20px",
        width: "40px",
        height: "40px"
      }}
      aria-label="Scroll to bottom"
    >
      <ArrowDown size={20} />
    </button>
  );
};

export default ScrollButton;
