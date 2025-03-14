
import React from 'react';
import { Sparkles, Info } from 'lucide-react';
import SpiralLoader from './SpiralLoader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

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
        <SpiralLoader 
          size="small"
          phrases={[
            "Laster alternativer...",
            "Finner valg...",
            "Henter muligheter..."
          ]}
        />
      </div>
    </div>
  );

  // Button list component with enhanced responsive layout
  const ButtonList = () => (
    <div className="h-auto min-h-[120px] flex flex-wrap gap-3 p-3 content-start py-[10px] px-[10px] mx-[5px] my-0">
      {buttons.map((button, index) => (
        <button 
          key={`button-${index}-${button.name.substring(0, 10)}`} 
          onClick={() => onButtonClick(button)} 
          title={button.name} 
          className="choice-button whitespace-normal overflow-hidden transition-all duration-300 text-base text-left bg-neutral-100 rounded-2xl my-0 px-[15px] py-[8px] mx-0"
        >
          {button.name}
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-full border-t border-gray-200 p-3 relative bg-slate-100">
      {/* AI Info Icon in top left corner with tooltip */}
      <div className="absolute top-3 left-3 z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="focus:outline-none">
                <Sparkles className="w-4 h-4 text-gray-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[250px] text-xs">
              <p>Denne AI-løsningen er utviklet av Dalai</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {isLoading ? 
        <LoadingIndicator /> : 
        buttons && buttons.length > 0 ? 
          <ButtonList /> : 
          <div className="h-[120px]"></div>
      }
    </div>
  );
};

export default ButtonPanel;
