import React, { useState } from 'react';
import { ChevronDown } from "lucide-react";
import { cn } from '@/lib/utils';

interface ScrollDownIndicatorProps {
  onClick: () => void;
  visible: boolean;
}

const ScrollDownIndicator: React.FC<ScrollDownIndicatorProps> = ({ onClick, visible }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={cn(
        "ask-w-full ask-flex ask-items-center ask-justify-center",
        "ask-transition-all ask-duration-300",
        visible ? "ask-opacity-100" : "ask-opacity-0"
      )}
      style={{
        pointerEvents: visible ? 'auto' : 'none',
        zIndex: 200,
        position: 'fixed', 
        bottom: '80px',
        left: 0,
        right: 0
      }}
    >
      <div 
        className={`ask-relative ask-w-[90%] ask-h-[4px] ask-transition-colors ask-duration-200 ${isHovered ? 'ask-bg-gray-500' : 'ask-bg-gray-400'}`} 
        style={{ borderRadius: '10px' }}
      >
        <button 
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "ask-absolute ask-left-1/2 ask-top-0 ask--translate-x-1/2",
            "ask-flex ask-items-center ask-justify-center",
            "ask-transition-all ask-duration-200",
            isHovered ? "ask-bg-gray-500" : "ask-bg-gray-400",
            "ask-px-2"
          )}
          style={{
            pointerEvents: 'auto',
            cursor: 'pointer',
            border: 'none',
            height: '20px',
            width: '36px',
            borderRadius: '0 0 10px 10px',
            marginTop: '0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          aria-label="Scroll to bottom"
        >
          <ChevronDown 
            size={14} 
            className="ask-text-white"
          />
        </button>
      </div>
    </div>
  );
};

export default ScrollDownIndicator; 