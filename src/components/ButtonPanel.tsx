
import React, { useState, useEffect, useRef } from 'react';

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
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState<'thinking' | 'streaming' | 'products'>('thinking');
  const lastChangeTime = useRef<number>(Date.now());
  const [currentText, setCurrentText] = useState<string>("Tenker...");
  const [isTextChanging, setIsTextChanging] = useState(false);
  
  // Define different loading messages for each phase
  const loadingMessages = {
    thinking: [
      "Tenker...",
      "Grubler...",
      "Resonnerer..."
    ],
    streaming: [
      "Laster inn spørsmål...",
      "Fører samtalen videre...",
      "Finner noe å snakke om..."
    ],
    products: [
      "Finner produkter...",
      "Laster inn produkter...",
      "Presenterer produkter..."
    ]
  };
  
  // Log button state changes
  useEffect(() => {
    if (buttons.length > 0) {
      console.log(`📱 ButtonPanel rendering ${buttons.length} buttons`);
    }
  }, [buttons]);
  
  // Listen for loading phase change events
  useEffect(() => {
    const handleLoadingPhaseChange = (event: any) => {
      if (event.detail && event.detail.phase) {
        setLoadingPhase(event.detail.phase);
        
        // Set initial text for this phase
        setCurrentText(loadingMessages[event.detail.phase][0]);
        setLoadingTextIndex(0);
        
        // Reset the last change time to prevent immediate change
        lastChangeTime.current = Date.now();
      }
    };
    
    // Add event listener for custom loading phase change events
    window.addEventListener('loadingPhaseChange', handleLoadingPhaseChange);
    
    return () => {
      window.removeEventListener('loadingPhaseChange', handleLoadingPhaseChange);
    };
  }, [loadingMessages]);
  
  // Rotate through loading messages every 2.5 seconds
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        const now = Date.now();
        
        // Only change if 2.5 seconds have passed since last change
        if (now - lastChangeTime.current >= 2500) {
          setIsTextChanging(true);
          
          // After animation out completes, change the text
          setTimeout(() => {
            const messages = loadingMessages[loadingPhase];
            const newIndex = (loadingTextIndex + 1) % messages.length;
            setLoadingTextIndex(newIndex);
            setCurrentText(messages[newIndex]);
            
            // Then animate back in
            setTimeout(() => {
              setIsTextChanging(false);
              lastChangeTime.current = Date.now();
            }, 300);
          }, 300);
        }
      }, 500); // Check more frequently than we change
      
      return () => clearInterval(interval);
    }
  }, [isLoading, loadingTextIndex, loadingPhase]);
  
  // Custom loader component with animation and text above the animation
  const LoadingIndicator = () => (
    <div className="h-[100px] flex flex-col items-center justify-center">
      <p 
        className={`text-gray-500 mb-4 text-sm font-medium transition-all duration-300 ${
          isTextChanging ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'
        }`}
      >
        {currentText}
      </p>
      <div className="loader" aria-label="Loading" role="status"></div>
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

  // Updated ButtonList with improved padding and spacing
  const ButtonList = () => (
    <div className="flex flex-wrap gap-2 px-4 py-2 content-start">
      {buttons.map((button, index) => (
        <button 
          key={`button-${index}-${button.name.substring(0, 10)}`} 
          onClick={() => onButtonClick(button)} 
          title={button.name} 
          className="choice-button whitespace-nowrap overflow-hidden text-ellipsis transition-all 
                   duration-300 text-base text-left rounded-2xl 
                   px-4 py-2.5 border border-gray-200/50 
                   shadow-sm hover:shadow-md bg-gray-200 
                   hover:bg-gray-300"
          style={{ maxWidth: '100%' }}
        >
          {button.name}
          <SparkleIcon />
        </button>
      ))}
    </div>
  );
  
  return (
    <div className="w-full bg-transparent p-0 relative">
      {isLoading ? <LoadingIndicator /> : buttons.length > 0 ? <ButtonList /> : <div className="h-[5px]"></div>}
    </div>
  );
};

export default ButtonPanel;
