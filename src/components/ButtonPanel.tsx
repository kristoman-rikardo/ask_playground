
import React, { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';

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
  // State to track which buttons should pulsate
  const [pulsatingButtons, setPulsatingButtons] = useState<number[]>([]);

  // Effect to randomly pulsate buttons
  useEffect(() => {
    if (buttons.length === 0) return;
    
    // Function to randomly select a button to pulsate
    const pulsateRandomButton = () => {
      const randomIndex = Math.floor(Math.random() * buttons.length);
      setPulsatingButtons(prev => {
        // Remove the button from pulsating if it's already there
        if (prev.includes(randomIndex)) {
          return prev.filter(idx => idx !== randomIndex);
        }
        // Add the button to pulsating buttons, limit to 2 at a time
        else {
          return [...prev, randomIndex].slice(-2);
        }
      });
    };

    // Set up interval for random pulsating
    const interval = setInterval(pulsateRandomButton, 2000);
    return () => clearInterval(interval);
  }, [buttons]);

  return (
    <div className="w-full bg-gray-50 border-t border-gray-200 p-3">
      {isLoading ? (
        <div className="h-[96px] flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <Loader className="w-8 h-8 text-gray-600 animate-spin" />
            <span className="text-sm text-gray-500 mt-2">Loading options...</span>
          </div>
        </div>
      ) : (
        <div className="h-[96px] flex flex-wrap gap-2 justify-end content-start p-2">
          {buttons.map((button, index) => (
            <button
              key={index}
              onClick={() => onButtonClick(button)}
              className={`choice-button whitespace-nowrap transition-all duration-300 ${
                pulsatingButtons.includes(index) ? 'animate-pulse shadow-md' : ''
              }`}
            >
              {button.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ButtonPanel;
