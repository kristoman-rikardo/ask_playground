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
      }
    }
    
    // Always call the original onButtonClick for tracking and other functionality
    onButtonClick(button);
  };

  return (
    <div 
      ref={containerRef}
      className={cn("w-full relative overflow-visible mt-2 mb-3 pl-3 pr-3", className)} // Added left padding to prevent leftmost card cutoff
    >
      <Carousel 
        className="w-full mx-auto overflow-visible" // Simplified to maintain consistent width
        opts={{ 
          align: 'center', // Changed to center alignment for better distribution
          containScroll: false, // Changed to false to prevent clipping
          slidesToScroll: slidesPerView,
          loop: false,
        }}
      >
        <CarouselContent className={`flex gap-1 pl-1 pr-1 overflow-visible`}> {/* Added right padding and adjusted left padding */}
          {cards.map((card, index) => (
            <CarouselItem 
              key={card.id || card.title} 
              className={`${
                cards.length === 1 && slidesPerView > 1 
                  ? 'basis-1/2 px-1' 
                  : slidesPerView === 1 
                    ? 'basis-full px-1' 
                    : slidesPerView === 2 
                      ? 'basis-1/2 px-1' 
                      : 'basis-1/3 px-1'
              } ${index === 0 ? 'ml-0' : ''} overflow-visible`} // Removed extra left margin for first item
            >
              <Card 
                className="border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-shadow font-sans" 
                style={{ 
                  width: cardWidth > 0 ? cardWidth : undefined,
                  maxWidth: containerWidth > 0 ? `${cardWidth}px` : '100%',
                  margin: '0 auto',
                  marginLeft: index === 0 ? '8px' : '0 auto', // Add left margin for first card
                  marginRight: index === cards.length - 1 ? '8px' : '0 auto', // Add right margin for last card
                  fontFamily: "'Inter', system-ui, sans-serif"
                }}
              >
                {card.imageUrl && (
                  <div 
                    className="relative w-full overflow-hidden" 
                    style={{ 
                      paddingTop: '70%', // Reduced height for better fit
                      position: 'relative' 
                    }}
                  >
                    <img 
                      src={card.imageUrl} 
                      alt={card.title}
                      className="object-cover absolute top-0 left-0 w-full h-full"
                      loading="lazy"
                    />
                  </div>
                )}
                <CardHeader className="p-2 pb-1 flex-none">
                  <CardTitle 
                    className="font-medium truncate text-sm"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 flex-grow">
                  <CardDescription 
                    className="line-clamp-2 text-xs"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    {card.description.text}
                  </CardDescription>
                </CardContent>
                {card.buttons && card.buttons.length > 0 && (
                  <CardFooter className="p-2 pt-1 flex flex-wrap gap-2 flex-none justify-center">
                    {card.buttons.map((button, idx) => {
                      const isBuyNowButton = isExternalLinkButton(button);
                      
                      return (
                        <UIButton
                          key={idx}
                          variant="secondary"
                          size="sm"
                          onClick={() => handleButtonClick(button)}
                          className="rounded-md transition-all duration-200 w-full text-xs h-9 px-4 py-2"
                          style={{ 
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontWeight: 500,
                            boxShadow: '1px 1px 3px rgba(0,0,0,0.12)',
                            backgroundColor: isBuyNowButton ? '#28483F10' : '#f0f0f0',
                            border: '1px solid #e0e0e0',
                            transform: 'translateY(0)',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            zIndex: 1
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
                              fontSize: '0.85rem',
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
                                size={12}
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
              className="left-2 shadow-sm border border-gray-200 bg-white/90 backdrop-blur-sm h-7 w-7 rounded-full z-10"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-gray-600" />
            </CarouselPrevious>
            <CarouselNext 
              variant="outline"
              size="sm" 
              className="right-2 shadow-sm border border-gray-200 bg-white/90 backdrop-blur-sm h-7 w-7 rounded-full z-10"
            >
              <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
            </CarouselNext>
          </>
        )}
      </Carousel>
    </div>
  );
};

export default CarouselMessage;
