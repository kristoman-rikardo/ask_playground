
import React from 'react';
import { Progress } from '@/components/ui/progress';

const TypingIndicator: React.FC = () => {
  const [progress, setProgress] = React.useState(0);

  // Animate the progress continuously
  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 2));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center space-y-2 p-4 bg-gray-50 rounded-xl max-w-[120px] my-2">
      <Progress value={progress} className="w-16 h-2" />
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
