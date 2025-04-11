import React, { useEffect, useState, useRef, memo } from 'react';
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

const CarouselMessage: React.FC<CarouselMessageProps> = memo(({ cards, onButtonClick, className }) => {
  const [slidesPerView, setSlidesPerView] = useState(2);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Ensure carousel is properly visible by scrolling it into view
  useEffect(() => {
    if (containerRef.current) {
      // Allow layout to stabilize before scrolling
      const timer = setTimeout(() => {
        // Find the nearest scrollable parent
        const scrollContainer = document.querySelector('.overflow-y-auto');
        if (scrollContainer) {
          // Scroll to fully show the carousel
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [cards]);
  
  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // Initial measurement
    updateWidth();
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Responsive slides count based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 350) {
        setSlidesPerView(1);
      } else if (window.innerWidth < 550) {
        setSlidesPerView(2);
      } else {
        setSlidesPerView(3);
      }
    };
    
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // Initial setup
    handleResize();
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  if (!cards || cards.length === 0) return null;
  
  // Calculate card width based on container width and slides per view
  const cardWidth = containerWidth > 0 
    ? Math.floor((containerWidth - (slidesPerView * 20)) / slidesPerView) - 8 // Increased spacing between cards
    : slidesPerView === 1 ? 170 : 150;
    
  // Helper function to check if button is a Buy Now / external link button
  const isExternalLinkButton = (button: Button) => {
    return (
      button.name === "Buy Now" || 
      (button.request?.type === "action" && 
       button.request.payload?.actions?.some(action => action.type === "open_url"))
    );
  };
  
  // Helper function to extract URL from button data
  const getButtonUrl = (button: Button) => {
    if (button.request?.type === "action") {
      const openUrlAction = button.request.payload?.actions?.find(action => action.type === "open_url");
      if (openUrlAction && openUrlAction.payload?.url) {
        return openUrlAction.payload.url;
      }
    }
    return null;
  };
  
  // Function to handle button clicks
  const handleButtonClick = (button: Button, event: React.MouseEvent) => {
    // Check if this is an external link button
    if (isExternalLinkButton(button)) {
      const url = getButtonUrl(button);
      if (url) {
        // Open the URL in a new tab
        window.open(url, '_blank');
        // Focus on the newly opened tab
        window.focus();
        // Don't call the original onButtonClick for Buy Now buttons to prevent rendering a message
        return;
      }
    }
    
    // For non-Buy Now buttons, call the original onButtonClick for analytics or other processing
    onButtonClick(button);
  };

  return (
    <div 
      ref={containerRef}
      className={cn("w-full max-w-full mt-2 mb-5 pl-4", className)}
    >
      <Carousel 
        className="w-full mx-auto" 
        opts={{ 
          align: cards.length === 1 ? 'start' : 'center',
          containScroll: 'trimSnaps',
          slidesToScroll: slidesPerView,
          loop: false,
        }}
      >
        <CarouselContent className={`${cards.length === 1 ? "flex justify-start" : "flex"} gap-3 pl-2`}>
          {cards.map((card, index) => (
            <CarouselItem 
              key={card.id || card.title} 
              className={`px-2 ${
                cards.length === 1 && slidesPerView > 1 
                  ? 'basis-1/2' 
                  : slidesPerView === 1 
                    ? 'basis-full' 
                    : slidesPerView === 2 
                      ? 'basis-1/2' 
                      : 'basis-1/3'
              } ${index === 0 ? 'ml-2' : ''}`}
            >
              <Card 
                className="border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-shadow font-sans" 
                style={{ 
                  width: cardWidth > 0 ? cardWidth : undefined,
                  maxWidth: '100%',
                  margin: cards.length === 1 ? '0' : '0 auto',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  backgroundColor: '#fafafa'
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
                          onClick={(e) => handleButtonClick(button, e)}
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
                                size={14} 
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
              className="left-3 shadow-sm border border-gray-200 bg-white/90 backdrop-blur-sm h-7 w-7 rounded-full"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-gray-600" />
            </CarouselPrevious>
            <CarouselNext 
              variant="outline"
              size="sm" 
              className="right-3 shadow-sm border border-gray-200 bg-white/90 backdrop-blur-sm h-7 w-7 rounded-full"
            >
              <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
            </CarouselNext>
          </>
        )}
      </Carousel>
    </div>
  );
});

CarouselMessage.displayName = 'CarouselMessage';

export default CarouselMessage; 