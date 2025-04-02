
import React from 'react';
import { cn } from '@/lib/utils';

interface PulsatingLoaderProps {
  className?: string;
}

const PulsatingLoader: React.FC<PulsatingLoaderProps> = ({ className }) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative">
        {/* Inner pulsating circle */}
        <div className="absolute top-0 left-0 w-full h-full animate-ping rounded-full bg-black opacity-30" />
        {/* Outer stable circle */}
        <div className="w-4 h-4 rounded-full bg-black opacity-75" />
      </div>
    </div>
  );
};

export default PulsatingLoader;
