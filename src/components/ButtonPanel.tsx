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
  const LoadingIndicator = () => <div className="h-[120px] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <Loader className="w-8 h-8 text-gray-600 animate-spin" />
        <span className="text-sm text-gray-500 mt-2 font-medium">Loading options...</span>
      </div>
    </div>;

  // Button list component with enhanced responsive layout
  const ButtonList = () => <div className="h-auto min-h-[120px] flex flex-wrap gap-3 p-3 content-start py-[10px] px-[10px] mx-[5px] my-0">
      {buttons.map((button, index) => <button key={`button-${index}-${button.name.substring(0, 10)}`} onClick={() => onButtonClick(button)} title={button.name} className="choice-button whitespace-normal overflow-hidden transition-all duration-300 text-base text-left bg-neutral-100 rounded-2xl my-0 px-[15px] py-[8px] mx-0">
          {button.name}
        </button>)}
    </div>;
  return <div className="w-full bg-gray-50 border-t border-gray-200 p-3 relative">
      {/* AI Sparkle Icon in top left corner */}
      <div className="absolute top-3 left-3">
        <Sparkles className="w-4 h-4 text-gray-500" />
      </div>
      
      {isLoading ? <LoadingIndicator /> : buttons.length > 0 ? <ButtonList /> : <div className="h-[120px]"></div>}
    </div>;
};
export default ButtonPanel;