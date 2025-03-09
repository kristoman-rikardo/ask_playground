
import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { usePulsatingButton } from '@/hooks/usePulsatingButton';

interface Button {
  name: string;
  request: any;
}

interface ButtonPanelProps {
  buttons: Button[];
  isLoading: boolean;
  onButtonClick: (button: Button) => void;
}

const ButtonPanel: React.FC<ButtonPanelProps> = ({ 
  buttons, 
  isLoading, 
  onButtonClick 
}) => {
  // Use our custom hook for the pulsating button effect
  const pulsatingButton = usePulsatingButton({ 
    itemsCount: buttons.length,
    interval: 3000, // Slightly more frequent
    pulsationChance: 0.8
  });

  // State for tracking which button to animate
  const [animatedButton, setAnimatedButton] = useState<number | null>(null);

  // Set up animation interval for random button animations
  useEffect(() => {
    if (buttons.length === 0) return;
    
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * buttons.length);
      setAnimatedButton(randomIndex);
      
      // Reset animation after a short delay
      setTimeout(() => {
        setAnimatedButton(null);
      }, 1000);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [buttons.length]);

  // Generate animation class based on random choice
  const getAnimationClass = (index: number) => {
    if (index !== animatedButton) return '';
    
    // Randomly choose between wiggle and bump animations
    return Math.random() > 0.5 ? 'animate-wiggle' : 'animate-bump';
  };

  // Loading state component
  const LoadingIndicator = () => (
    <div className="h-[120px] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <Loader className="w-8 h-8 text-gray-600 animate-spin" />
        <span className="text-sm text-gray-500 mt-2 font-medium">Loading options...</span>
      </div>
    </div>
  );

  // Button list component with improved grid layout
  const ButtonList = () => (
    <div className="h-[120px] grid grid-cols-2 gap-3 p-3 content-start overflow-hidden">
      {buttons.map((button, index) => (
        <button
          key={index}
          onClick={() => onButtonClick(button)}
          className={`choice-button whitespace-normal text-left transition-all duration-500 animate-fade-in ${
            pulsatingButton === index ? 'shadow-md scale-[1.02]' : ''
          } ${getAnimationClass(index)}`}
        >
          {button.name}
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-full bg-gray-50 border-t border-gray-200 p-3">
      {isLoading ? <LoadingIndicator /> : <ButtonList />}
    </div>
  );
};

export default ButtonPanel;
