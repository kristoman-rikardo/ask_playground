
import React from 'react';
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
  // Loading state component
  const LoadingIndicator = () => (
    <div className="h-[120px] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <Loader className="w-8 h-8 text-gray-600 animate-spin" />
        <span className="text-sm text-gray-500 mt-2 font-medium">Loading options...</span>
      </div>
    </div>
  );

  // Sparkle SVG icon
  const SparkleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
      fill="currentColor" className="size-5 inline-block ml-1 text-gray-400">
      <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785
              l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238
              1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192
              -.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238
              -1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1
              -.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1
              .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1
              .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1
              -.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184
              .551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1
              0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1
              .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1
              -.633-.632l-.183-.551Z" />
    </svg>
  );

  // Button list component with enhanced responsive layout and text truncation
  const ButtonList = () => (
    <div className="h-auto min-h-[120px] flex flex-wrap gap-2 p-3 content-start">
      {buttons.map((button, index) => (
        <button 
          key={`button-${index}-${button.name.substring(0, 10)}`} 
          onClick={() => onButtonClick(button)} 
          title={button.name} 
          className="choice-button whitespace-nowrap overflow-hidden text-ellipsis transition-all 
                   duration-300 text-base text-left bg-transparent rounded-2xl my-0 mx-[2px] 
                   px-[15px] py-[8px] border border-gray-100 shadow-sm hover:shadow-md
                   hover:bg-gray-50/50 max-w-full"
          style={{ maxWidth: '100%' }}
        >
          {button.name}
          <SparkleIcon />
        </button>
      ))}
    </div>
  );
  
  return (
    <div className="w-full bg-transparent border-t border-transparent p-3 relative">
      {/* AI Sparkle Icon in top left corner */}
      <div className="absolute top-3 left-3">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
          fill="currentColor" className="size-5 text-gray-300">
          <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785
                  l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238
                  1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192
                  -.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238
                  -1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1
                  -.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1
                  .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1
                  .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1
                  -.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184
                  .551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1
                  0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1
                  .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1
                  -.633-.632l-.183-.551Z" />
        </svg>
      </div>
      
      {isLoading ? <LoadingIndicator /> : buttons.length > 0 ? <ButtonList /> : <div className="h-[120px]"></div>}
    </div>
  );
};

export default ButtonPanel;
