import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CheckpointStatus = 'pending' | 'loading' | 'completed' | 'full' | 'fade-out';

interface CircularCheckpointProps {
  status: CheckpointStatus;
  position: number;
  progress: number; // 0-100 for progress percentage
}

const CircularCheckpoint: React.FC<CircularCheckpointProps> = ({ status, position, progress }) => {
  return (
    <div className="relative flex flex-col items-center">
      {/* Connecting line between checkpoints */}
      {position > 0 && (
        <div className="absolute top-1/2 -left-8 w-6 h-0.5 bg-gray-300 -translate-y-1/2" />
      )}
      
      {/* Circle with different states */}
      <div 
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center relative transition-all duration-300",
          status === 'pending' && "border border-gray-300",
          (status === 'loading' || status === 'full') && "border-2 border-transparent",
          status === 'completed' && "bg-black text-white",
          status === 'fade-out' && "bg-black text-white opacity-50"
        )}
      >
        {(status === 'loading' || status === 'full') && (
          <svg className="w-full h-full" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-gray-300"
            />
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 10} // 2πr where r=10
              strokeDashoffset={(2 * Math.PI * 10) * (1 - progress / 100)} // Calculate dashoffset based on progress
              fill="transparent"
              className="text-black animate-circular-progress"
              transform="rotate(-90, 12, 12)" // Start from the top (12 o'clock)
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.3s ease-out',
                willChange: 'stroke-dashoffset'
              }}
            />
          </svg>
        )}
        {(status === 'completed' || status === 'fade-out') && <Check className="h-4 w-4" />}
      </div>
    </div>
  );
};

export default CircularCheckpoint;
