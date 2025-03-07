
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
  // State to track which button should pulsate
  const [pulsatingButton, setPulsatingButton] = useState<number | null>(null);

  // Effect to randomly pulsate a single button
  useEffect(() => {
    if (buttons.length === 0) return;
    
    // Function to randomly select a button to pulsate
    const pulsateRandomButton = () => {
      // Either select a random button or set to null to pause pulsation briefly
      const shouldPulsate = Math.random() > 0.2; // 80% chance of showing a pulsation
      if (shouldPulsate) {
        const randomIndex = Math.floor(Math.random() * buttons.length);
        setPulsatingButton(randomIndex);
      } else {
        setPulsatingButton(null);
      }
    };

    // Set up interval for random pulsating - slower at 3500ms
    const interval = setInterval(pulsateRandomButton, 3500);
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
              className={`choice-button whitespace-nowrap transition-all duration-500 ${
                pulsatingButton === index ? 'shadow-md scale-[1.02]' : ''
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
