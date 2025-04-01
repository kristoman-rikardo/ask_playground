
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Sparkle } from 'lucide-react';
import CheckpointProgress, { Checkpoint } from './CheckpointProgress';

interface TypingIndicatorProps {
  step?: number;
  totalSteps?: number;
  labels?: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  step = 0, 
  totalSteps = 1,
  labels = []
}) => {
  const [progress, setProgress] = useState(0);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Setup checkpoints based on totalSteps
  useEffect(() => {
    const newCheckpoints: Checkpoint[] = [];
    for (let i = 0; i < totalSteps; i++) {
      newCheckpoints.push({
        id: `checkpoint-${i}`,
        label: labels[i] || '',
        status: i < step ? 'complete' : i === step ? 'loading' : 'pending'
      });
    }
    setCheckpoints(newCheckpoints);
    setCurrentIndex(step);
  }, [step, totalSteps, labels]);

  // Animate the progress continuously
  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 2));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center space-y-2 p-4 bg-gray-50 rounded-xl max-w-[280px] my-2">
      {totalSteps > 1 && (
        <CheckpointProgress 
          checkpoints={checkpoints} 
          currentIndex={currentIndex}
        />
      )}
      
      <div className="flex items-center space-x-2">
        <Sparkle size={16} color="#EF7315" className="animate-pulse" />
        <Progress value={progress} className="w-36 h-2" />
        <Sparkle size={16} color="#EF7315" className="animate-pulse" />
      </div>
      
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
