import React, { useState, useEffect } from 'react';

interface Button {
  name: string;
  request: any;
}

interface ButtonPanelProps {
  buttons: Button[];
  isLoading: boolean;
  onButtonClick: (button: Button) => void;
  className?: string;
  isMinimized?: boolean;
}

const ButtonPanel: React.FC<ButtonPanelProps> = ({
  buttons,
  isLoading,
  onButtonClick,
  className = '',
  isMinimized = false
}) => {
  // Sparkle SVG icon for buttons
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
  
  // Enhanced thinking indicator with separate animation for dots - no background label
  const ThinkingIndicator = () => (
    <div className="mb-3 transition-all duration-300">
      <span className="thinking-text">Thinking</span>
      <span className="dots-animation"></span>
    </div>
  );
  
  // Simplified loader component with thinking text
  const LoadingIndicator = () => (
    <div className="h-[70px] flex flex-col items-center justify-center transition-opacity duration-300">
      <ThinkingIndicator />
      <div className="simple-loader" aria-label="Loading" role="status"></div>
    </div>
  );

  // Handle button click with scrolling
  const handleButtonClick = (button: Button) => {
    onButtonClick(button);
  };

  // Button List component
  const ButtonList = () => (
    <div className="flex flex-wrap gap-2 px-4 py-2 content-start">
      {buttons.map((button, index) => (
        <button 
          key={`button-${index}-${button.name.substring(0, 10)}`} 
          onClick={() => handleButtonClick(button)} 
          title={button.name} 
          className="choice-button whitespace-normal break-words transition-all 
                   duration-300 text-base text-left rounded-2xl 
                   px-3 py-2 border border-gray-200/50 
                   shadow-sm hover:shadow-md bg-gray-100 
                   hover:bg-gray-200 font-sans"
          style={{ maxWidth: '100%', fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 400 }}
        >
          {button.name}
          <SparkleIcon />
        </button>
      ))}
    </div>
  );
  
  return (
    <div className={`w-full bg-transparent p-0 relative font-sans ${className}`} style={{ fontFamily: "'Inter', system-ui, sans-serif", marginTop: '8px' }}>
      {isLoading && !isMinimized ? <LoadingIndicator /> : buttons.length > 0 ? <ButtonList /> : null}
    </div>
  );
};

export default ButtonPanel;
