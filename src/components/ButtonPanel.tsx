
import React from 'react';
import { Button } from '@/hooks/useChatSession';
import ButtonLoader from './ButtonLoader';

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
  if (isLoading) {
    return <ButtonLoader />;
  }

  if (buttons.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 flex-wrap p-3 border-t border-gray-200">
      {buttons.map((button, index) => (
        <button
          key={`${button.name}-${index}`}
          onClick={() => onButtonClick(button)}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
        >
          {button.name}
        </button>
      ))}
    </div>
  );
};

export default ButtonPanel;
