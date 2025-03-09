
import React from 'react';
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
    interval: 5000, // Less frequent to avoid distracting animations
    pulsationChance: 0.6  // Lower chance of pulsation
  });

  // Loading state component
  const LoadingIndicator = () => (
    <div className="h-[120px] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <Loader className="w-8 h-8 text-gray-600 animate-spin" />
        <span className="text-sm text-gray-500 mt-2 font-medium">Loading options...</span>
      </div>
    </div>
  );

  // Button list component with responsive layout
  const ButtonList = () => (
    <div className="h-auto min-h-[120px] grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 content-start">
      {buttons.map((button, index) => (
        <button
          key={`button-${index}-${button.name.substring(0, 10)}`}
          onClick={() => onButtonClick(button)}
          className={`choice-button whitespace-normal text-left overflow-hidden transition-all duration-300
            ${pulsatingButton === index ? 'shadow-md scale-[1.02]' : ''}`}
          title={button.name} // Show full text on hover if truncated
        >
          {button.name}
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-full bg-gray-50 border-t border-gray-200 p-3">
      {isLoading ? <LoadingIndicator /> : (buttons.length > 0 ? <ButtonList /> : <div className="h-[120px]"></div>)}
    </div>
  );
};

export default ButtonPanel;
