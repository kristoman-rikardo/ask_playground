import React, { useState } from 'react';
import { Button } from '@/types/chat';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarouselCardProps {
  id: string;
  title: string;
  description: {
    text: string;
  };
  imageUrl?: string;
  buttons: Button[];
  onButtonClick: (button: Button) => void;
}

const defaultImageStyle = {
  objectFit: 'cover' as const,
  height: '160px',
  width: '100%',
  maxHeight: '160px',
  objectPosition: 'center',
};

// Helper to render buttons with their click handlers
const renderButton = (button: Button, onClick: (button: Button) => void, index: number) => {
  // Helper function to check if button is a Buy Now / external link button
  const isExternalLinkButton = (button: Button) => {
    if (!button.request?.payload?.actions) return false;
    
    return button.request.payload.actions.some(action => 
      action.type === 'open_url' && action.payload?.url
    );
  };

  const handleButtonClick = (button: Button) => {
    // For external/buy now buttons, extract the URL and open in new tab
    if (isExternalLinkButton(button)) {
      const action = button.request.payload?.actions?.find(a => a.type === 'open_url');
      if (action && action.payload?.url) {
        window.open(action.payload.url, '_blank');
        return;
      }
    }
    
    // For regular buttons
    if (onClick) {
      onClick(button);
    }
  };

  const isBuyNowButton = isExternalLinkButton(button);

  return (
    <button
      key={`${button.name}-${index}`}
      className={cn(
        "ask-choice-button ask-w-full ask-px-4 ask-py-2",
        "ask-text-sm ask-font-medium ask-text-center",
        "ask-rounded-full ask-border ask-border-solid ask-border-gray-300",
        "ask-bg-white hover:ask-bg-gray-50 ask-transition-colors",
        "ask-truncate ask-whitespace-nowrap ask-overflow-hidden",
        "focus:ask-outline-none focus:ask-ring-2 focus:ask-ring-blue-200"
      )}
      onClick={() => handleButtonClick(button)}
    >
      <span className={cn("ask-truncate")}>{button.name}</span>
      {isBuyNowButton && (
        <ExternalLink size={12} className={cn("ask-flex-shrink-0")} />
      )}
    </button>
  );
};

const CarouselCard: React.FC<CarouselCardProps> = ({
  id,
  title,
  description,
  imageUrl,
  buttons = [],
  onButtonClick,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Handle image loading state
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  // Handle image error state
  const handleImageError = () => {
    setImageError(true);
  };
  
  // Determine if we should show image
  const showImage = imageUrl && !imageError;

  return (
    <div 
      className={cn(
        "ask-carousel-card",
        "ask-rounded-xl ask-border ask-border-gray-200",
        "ask-overflow-hidden ask-flex ask-flex-col",
        "ask-w-full ask-h-full ask-bg-white",
        "ask-transition-all ask-duration-300",
        "hover:ask-shadow-md hover:ask-translate-y-[-2px]"
      )}
    >
      {/* Card Image Container */}
      {showImage && (
        <div className={cn("ask-carousel-card-image-container ask-relative ask-w-full ask-h-40 ask-overflow-hidden")}>
          {!imageLoaded && (
            <div className={cn("ask-absolute ask-inset-0 ask-bg-gray-100 ask-animate-pulse")} />
          )}
          <img
            src={imageUrl}
            alt={title}
            style={defaultImageStyle}
            className={cn(
              "ask-w-full ask-transition-opacity ask-duration-300",
              imageLoaded ? "ask-opacity-100" : "ask-opacity-0"
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      )}
      
      {/* Card Content */}
      <div className={cn("ask-carousel-card-content ask-p-4 ask-flex-1 ask-flex ask-flex-col")}>
        {/* Title */}
        <h3 className={cn("ask-carousel-card-title ask-text-base ask-font-medium ask-mb-1 ask-leading-tight")}>{title}</h3>
        
        {/* Description - only if present */}
        {description && description.text && (
          <p className={cn("ask-carousel-card-description ask-text-sm ask-text-gray-600 ask-mb-4 ask-leading-snug ask-flex-1")}>
            {description.text}
          </p>
        )}
        
        {/* Buttons - only if present */}
        {buttons && buttons.length > 0 && (
          <div className={cn(
            "ask-carousel-card-buttons ask-flex ask-flex-col ask-gap-2 ask-mt-auto",
            !description || !description.text ? "ask-mt-4" : ""
          )}>
            {buttons.map((button, index) => renderButton(button, onButtonClick, index))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarouselCard; 