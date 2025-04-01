
import React from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Checkpoint {
  id: string;
  label?: string;
  status: 'pending' | 'loading' | 'complete';
}

interface CheckpointProgressProps {
  checkpoints: Checkpoint[];
  currentIndex: number;
}

const CheckpointProgress: React.FC<CheckpointProgressProps> = ({
  checkpoints,
  currentIndex
}) => {
  return (
    <div className="flex items-center justify-center space-x-1 py-2">
      {checkpoints.map((checkpoint, index) => (
        <React.Fragment key={checkpoint.id}>
          <div className="flex flex-col items-center">
            <div 
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                checkpoint.status === 'pending' ? 'border border-gray-300' : '',
                checkpoint.status === 'loading' ? 'border-2 border-t-transparent border-r-gray-300 border-b-gray-300 border-l-gray-300 animate-spin' : '',
                checkpoint.status === 'complete' ? 'bg-[#EF7315] text-white' : 'text-gray-400'
              )}
            >
              {checkpoint.status === 'complete' ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                checkpoint.status !== 'loading' && <Circle size={14} />
              )}
            </div>
            {checkpoint.label && (
              <span className="text-xs mt-1 text-gray-500">{checkpoint.label}</span>
            )}
          </div>
          {index < checkpoints.length - 1 && (
            <div 
              className={cn(
                "h-0.5 flex-1 max-w-12 transition-all duration-300", 
                index < currentIndex ? "bg-[#EF7315]" : "bg-gray-200"
              )}
            ></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default CheckpointProgress;
