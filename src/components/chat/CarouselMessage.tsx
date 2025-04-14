import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/types/chat';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button as UIButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface CarouselCard {
  id: string;
  title: string;
  description: {
    text: string;
  };
  imageUrl?: string;
  buttons: Button[];
}

interface CarouselMessageProps {
  cards: CarouselCard[];
  onButtonClick: (button: Button) => void;
  className?: string;
}

const CarouselMessage: React.FC<CarouselMessageProps> = ({ cards, onButtonClick, className }) => {
  const [slidesPerView, setSlidesPerView] = useState(2);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Ensure carousel is properly visible by scrolling it into view
  useEffect(() => {
    if (containerRef.current) {
      // Allow layout to stabilize before scrolling
      const timer = setTimeout(() => {
        // Find the nearest scrollable parent - try both with and without prefix
        let scrollContainer = document.querySelector('.ask-overflow-y-auto');
        
        // If not found with prefix, try without (for backward compatibility)
        if (!scrollContainer) {
          scrollContainer = document.querySelector('.overflow-y-auto'); 
        }
        
        // Alternatively, search for the exact element with ref
        if (!scrollContainer) {
          const allScrollable = document.querySelectorAll('[class*="overflow-y-auto"]');
          if (allScrollable.length > 0) {
            scrollContainer = allScrollable[0];
          }
        }
        
        if (scrollContainer) {
          // Scroll to fully show the carousel
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
          console.log('Scrolled container to show carousel');
        } else {
          console.warn('Could not find scrollable container for carousel');
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [cards]);
  
  // Fix for embla-carousel viewport overflow
  useEffect(() => {
    // Find the embla viewport element and fix its overflow
    const fixCarouselOverflow = () => {
      if (containerRef.current) {
        // Fix the viewport overflow
        const viewport = containerRef.current.querySelector('.embla__viewport');
        if (viewport instanceof HTMLElement) {
          viewport.style.overflow = 'visible';
          viewport.style.marginLeft = '0';
          viewport.style.marginRight = '0';
          console.log('Fixed embla carousel viewport overflow');
        }

        // Fix the container overflow and padding
        const container = containerRef.current.querySelector('.embla__container');
        if (container instanceof HTMLElement) {
          container.style.overflow = 'visible';
          container.style.paddingLeft = '8px';
          container.style.paddingRight = '8px';
          console.log('Fixed embla carousel container padding');
        }
      }
    };
    
    // Run once on mount and then again after a short delay to ensure the carousel is rendered
    fixCarouselOverflow();
    
    // Run multiple times to ensure styles are applied after all DOM updates
    const timers = [
      setTimeout(fixCarouselOverflow, 100),
      setTimeout(fixCarouselOverflow, 300),
      setTimeout(fixCarouselOverflow, 500)
    ];
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [cards]);
  
  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth(); // Initial measurement
    window.addEventListener('resize', updateWidth);
    
    // Add a slight delay to ensure accurate measurement after DOM updates
    const timer = setTimeout(updateWidth, 100);
    
    return () => {
      window.removeEventListener('resize', updateWidth);
      clearTimeout(timer);
    };
  }, [cards]);
  
  // Responsive slides count based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 350) {
        setSlidesPerView(1);
      } else if (window.innerWidth < 550) {
        setSlidesPerView(2);
      } else {
        setSlidesPerView(3); // Show 3 on wider screens (>550px)
      }
    };
    
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (!cards || cards.length === 0) return null;
  
  // Calculate card width based on container width and slides per view
  const cardWidth = containerWidth > 0 
    ? Math.floor((containerWidth - (slidesPerView * 16)) / slidesPerView) - 4 // Further adjusted spacing for better fit
    : slidesPerView === 1 ? 170 : 155;
    
  // Helper function to check if a button is a "Buy Now" or external link button
  const isExternalLinkButton = (button: Button) => {
    // Check if button name is "Buy Now"
    if (button.name === "Buy Now") return true;
    
    // Check if the button has an action with open_url type
    if (button.request?.type === "action" && 
        button.request.payload?.actions?.some((action: any) => action.type === "open_url")) {
      return true;
    }
    
    return false;
  };
  
  // Helper function to extract URL from button data
  const getButtonUrl = (button: Button) => {
    if (button.request?.type === "action") {
      const openUrlAction = button.request.payload?.actions?.find(
        (action: any) => action.type === "open_url"
      );
      
      if (openUrlAction && openUrlAction.payload?.url) {
        return openUrlAction.payload.url;
      }
    }
    return null;
  };
  
  // Custom handler for button clicks
  const handleButtonClick = (button: Button) => {
    // Check if this button should open an external URL
    if (isExternalLinkButton(button)) {
      const url = getButtonUrl(button);
      if (url) {
        // Open the URL in a new tab
        window.open(url, '_blank', 'noopener,noreferrer');
        // Focus on the new tab
        window.focus();
        // Don't call the original onButtonClick for Buy Now buttons to prevent rendering a message
        return;
      }
    }
    
    // For non-Buy Now buttons, call the original onButtonClick for tracking and other functionality
    onButtonClick(button);
  };

  return (
    <div 
      ref={containerRef}
      className={cn("ask-w-full ask-relative ask-overflow-visible ask-mt-2 ask-mb-5", className)}
    >
      <Carousel 
        className="ask-w-full ask-mx-auto ask-overflow-visible"
        opts={{ 
          align: 'start',
          containScroll: 'trimSnaps',
          slidesToScroll: slidesPerView === 1 ? 1 : slidesPerView,
          dragFree: true,
          loop: false,
        }}
      >
        <CarouselContent className={`${cards.length === 1 ? "ask-flex ask-justify-start" : "ask-flex ask-justify-between"} ask-gap-2 ask-pl-1`}>
          {cards.map((card, index) => (
            <CarouselItem 
              key={card.id || card.title} 
              className={`${
                cards.length === 1 && slidesPerView > 1 
                  ? 'ask-basis-1/2 ask-px-1' 
                  : slidesPerView === 1 
                    ? 'ask-basis-full ask-px-1' 
                    : slidesPerView === 2 
                      ? 'ask-basis-1/2 ask-px-1' 
                      : 'ask-basis-1/3 ask-px-1'
              } ${index === 0 ? 'ask-ml-0' : ''} ask-overflow-visible`}
              style={{
                flex: slidesPerView === 1 ? '0 0 100%' : `0 0 calc(${100 / slidesPerView}% - 16px)`,
                maxWidth: slidesPerView === 1 ? '100%' : `calc(${100 / slidesPerView}% - 16px)`
              }}
            >
              <Card 
                className="ask-border ask-border-gray-200 ask-rounded-lg ask-overflow-hidden ask-h-full ask-flex ask-flex-col ask-shadow-sm hover:ask-shadow-md ask-transition-shadow ask-font-sans" 
                style={{ 
                  minWidth: '140px',
                  maxWidth: '100%',
                  margin: '0 auto',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  backgroundColor: '#fafafa'
                }}
              >
                {card.imageUrl && (
                  <div 
                    className="ask-relative ask-w-full ask-overflow-hidden" 
                    style={{ 
                      paddingTop: '65%', // Adjusted for better proportion
                      position: 'relative' 
                    }}
                  >
                    <img 
                      src={card.imageUrl} 
                      alt={card.title}
                      className="ask-object-cover ask-absolute ask-top-0 ask-left-0 ask-w-full ask-h-full"
                      loading="lazy"
                    />
                  </div>
                )}
                <CardHeader className="ask-p-2 ask-pb-1 ask-flex-none">
                  <CardTitle 
                    className="ask-font-medium ask-truncate ask-text-sm"
                    style={{ 
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: '0.9rem', // Adjusted font size for better proportion
                      lineHeight: 1.3
                    }}
                  >
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="ask-p-2 ask-pt-0 ask-flex-grow">
                  <CardDescription 
                    className="ask-line-clamp-2 ask-text-xs"
                    style={{ 
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: '0.8rem', // Adjusted font size for better proportion
                      lineHeight: 1.4,
                      color: '#666'
                    }}
                  >
                    {card.description.text}
                  </CardDescription>
                </CardContent>
                {card.buttons && card.buttons.length > 0 && (
                  <CardFooter className="ask-p-2 ask-pt-1 ask-flex ask-flex-wrap ask-gap-2 ask-flex-none ask-justify-center">
                    {card.buttons.map((button, idx) => {
                      const isBuyNowButton = isExternalLinkButton(button);
                      
                      return (
                        <UIButton
                          key={idx}
                          variant="secondary"
                          size="sm"
                          onClick={() => handleButtonClick(button)}
                          className="ask-rounded-md ask-transition-all ask-duration-200 ask-w-full ask-text-xs ask-h-8 ask-px-3 ask-py-1.5"
                          style={{ 
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontWeight: 500,
                            fontSize: '0.75rem', // Adjusted font size for better proportion
                            boxShadow: '1px 1px 3px rgba(0,0,0,0.12)',
                            backgroundColor: isBuyNowButton ? '#28483F10' : '#f0f0f0',
                            border: '1px solid #e0e0e0',
                            transform: 'translateY(0)',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            zIndex: 1,
                            lineHeight: 1.2,
                            whiteSpace: 'normal', // Allow text wrapping in buttons
                            minHeight: '32px'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = isBuyNowButton ? '#28483F20' : '#e8e8e8';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '2px 2px 4px rgba(0,0,0,0.18)';
                            e.currentTarget.style.zIndex = '5';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = isBuyNowButton ? '#28483F10' : '#f0f0f0';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '1px 1px 3px rgba(0,0,0,0.12)';
                            e.currentTarget.style.zIndex = '1';
                          }}
                        >
                          <span 
                            style={{ 
                              fontSize: '0.75rem', // Adjusted font size for better proportion
                              fontFamily: "'Inter', system-ui, sans-serif",
                              fontWeight: 500,
                              lineHeight: 1.2,
                              color: isBuyNowButton ? '#28483F' : 'inherit',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            {button.name}
                            {isBuyNowButton && (
                              <ExternalLink 
                                size={10} // Adjusted size for better proportion
                                style={{ color: '#28483F', strokeWidth: 2 }} 
                              />
                            )}
                          </span>
                        </UIButton>
                      );
                    })}
                  </CardFooter>
                )}
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        {cards.length > slidesPerView && (
          <>
            <CarouselPrevious 
              variant="outline" 
              size="sm"
              className="ask-left-3 ask-shadow-sm ask-border ask-border-gray-200 ask-bg-white/90 ask-backdrop-blur-sm ask-h-7 ask-w-7 ask-rounded-full ask-z-10"
            >
              <ChevronLeft className="ask-h-3.5 ask-w-3.5 ask-text-gray-600" />
            </CarouselPrevious>
            <CarouselNext 
              variant="outline"
              size="sm" 
              className="ask-right-3 ask-shadow-sm ask-border ask-border-gray-200 ask-bg-white/90 ask-backdrop-blur-sm ask-h-7 ask-w-7 ask-rounded-full ask-z-10"
            >
              <ChevronRight className="ask-h-3.5 ask-w-3.5 ask-text-gray-600" />
            </CarouselNext>
          </>
        )}
      </Carousel>
    </div>
  );
};

export default CarouselMessage;
