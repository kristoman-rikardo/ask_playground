
import React from 'react';
import { Button } from '@/hooks/useChatSession';
import ButtonLoader from './ButtonLoader';
import { Sparkle } from 'lucide-react';

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
          className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 relative group"
        >
          <span className="relative z-10">{button.name}</span>
          <Sparkle className="absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-400 opacity-50 z-0 size-4" />
        </button>
      ))}
    </div>
  );
};

export default ButtonPanel;
