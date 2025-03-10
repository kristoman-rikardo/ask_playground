
import React from 'react';
import { Loader, Sparkles } from 'lucide-react';

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
  // Loading state component
  const LoadingIndicator = () => (
    <div className="h-[120px] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <Loader className="w-8 h-8 text-gray-600 animate-spin" />
        <span className="text-sm text-gray-500 mt-2 font-medium">Loading options...</span>
      </div>
    </div>
  );

  // Button list component with enhanced responsive layout
  const ButtonList = () => (
    <div className="h-auto min-h-[120px] flex flex-wrap gap-3 p-3 content-start">
      {buttons.map((button, index) => (
        <button
          key={`button-${index}-${button.name.substring(0, 10)}`}
          onClick={() => onButtonClick(button)}
          className="choice-button whitespace-normal text-left overflow-hidden transition-all duration-300"
          title={button.name}
        >
          {button.name}
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-full bg-gray-50 border-t border-gray-200 p-3 relative">
      {/* AI Sparkle Icon in top left corner */}
      <div className="absolute top-3 left-3">
        <Sparkles className="w-4 h-4 text-gray-500" />
      </div>
      
      {isLoading ? <LoadingIndicator /> : (buttons.length > 0 ? <ButtonList /> : <div className="h-[120px]"></div>)}
    </div>
  );
};

export default ButtonPanel;
