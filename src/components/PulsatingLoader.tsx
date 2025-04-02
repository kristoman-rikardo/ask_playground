
import React from 'react';
import { cn } from '@/lib/utils';

interface PulsatingLoaderProps {
  className?: string;
}

const PulsatingLoader: React.FC<PulsatingLoaderProps> = ({ className }) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative">
        {/* Outer pulsating circle */}
        <div className="absolute top-0 left-0 w-full h-full animate-ping rounded-full bg-black opacity-20" />
        {/* Middle pulsating circle with slower animation */}
        <div className="absolute top-0 left-0 w-full h-full animate-pulse rounded-full bg-black opacity-15" 
          style={{ animationDuration: '2s' }} />
        {/* Inner stable circle */}
        <div className="w-3 h-3 rounded-full bg-black opacity-60" />
      </div>
    </div>
  );
};

export default PulsatingLoader;
