import React, { useState, memo } from 'react';
import { ChevronDown } from "lucide-react";
import { cn } from '@/lib/utils';

interface ScrollDownIndicatorProps {
  onClick: () => void;
  visible: boolean;
}

const ScrollDownIndicator: React.FC<ScrollDownIndicatorProps> = memo(({ onClick, visible }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={cn(
        "w-full flex items-center justify-center",
        "transition-all duration-300",
        visible ? "opacity-100" : "opacity-0"
      )}
      style={{
        pointerEvents: 'none',
        zIndex: 50,
        position: 'relative', 
        bottom: '0px'
      }}
    >
      <div 
        className={`relative w-[90%] h-[2px] transition-colors duration-200 ${isHovered ? 'bg-gray-400' : 'bg-gray-300'}`} 
        style={{ borderRadius: '10px' }}
      >
        <button 
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "absolute left-1/2 top-0 -translate-x-1/2",
            "flex items-center justify-center",
            "transition-all duration-200",
            isHovered ? "bg-gray-400" : "bg-gray-300",
            "px-2"
          )}
          style={{
            pointerEvents: 'auto',
            cursor: 'pointer',
            border: 'none',
            height: '12px',
            borderRadius: '0 0 6px 6px',
            marginTop: '0'
          }}
          aria-label="Scroll to bottom"
        >
          <ChevronDown 
            size={12} 
            className="text-gray-800"
          />
        </button>
      </div>
    </div>
  );
});

ScrollDownIndicator.displayName = 'ScrollDownIndicator';

export default ScrollDownIndicator; 