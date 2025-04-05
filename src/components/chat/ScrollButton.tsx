import React from 'react';
import { ChevronDown } from "lucide-react";
import { cn } from '@/lib/utils';

interface ScrollButtonProps {
  onClick: () => void;
  visible: boolean;
  position?: 'top' | 'bottom';
}

const ScrollButton: React.FC<ScrollButtonProps> = ({ onClick, visible, position = 'bottom' }) => {
  return (
    <div 
      className={cn(
        "absolute left-0 right-0 w-full flex items-center justify-center",
        "transition-all duration-300 opacity-0",
        visible && "opacity-100",
        position === 'top' ? "top-0" : "bottom-0"
      )}
      style={{
        pointerEvents: visible ? 'auto' : 'none'
      }}
    >
      <div className={cn(
        "relative w-full h-[1px]",
        position === 'bottom' ? "bg-gray-100/50" : "bg-gray-100/30"
      )}>
        <button 
          onClick={onClick}
          className={cn(
            "absolute left-1/2 -translate-x-1/2 bg-white rounded-full p-1",
            "hover:bg-gray-50 transition-all duration-200 flex items-center justify-center",
            "border border-gray-100/50 shadow-sm hover:shadow-md",
            position === 'top' ? "top-1" : "-bottom-1"
          )}
          aria-label={position === 'top' ? "Scroll to top" : "Scroll to bottom"}
        >
          <ChevronDown 
            size={12} 
            className={cn(
              "text-gray-400",
              position === 'top' && "rotate-180"
            )}
          />
        </button>
      </div>
    </div>
  );
};

export default ScrollButton;
