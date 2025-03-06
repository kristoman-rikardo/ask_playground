
import React from 'react';

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
  return (
    <div className="w-full bg-gray-50 border-t border-gray-200 p-3">
      {isLoading ? (
        <div className="h-[84px] flex items-center justify-end">
          <div className="flex items-center space-x-1.5 p-2 bg-faq-agent rounded-xl animate-pulse">
            <div className="w-2 h-2 bg-faq-dark rounded-full animate-pulse-dot-1"></div>
            <div className="w-2 h-2 bg-faq-dark rounded-full animate-pulse-dot-2"></div>
            <div className="w-2 h-2 bg-faq-dark rounded-full animate-pulse-dot-3"></div>
          </div>
        </div>
      ) : (
        <div className="h-[84px] flex flex-wrap gap-2 justify-end content-start overflow-y-auto">
          {buttons.map((button, index) => (
            <button
              key={index}
              onClick={() => onButtonClick(button)}
              className="choice-button whitespace-nowrap"
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
