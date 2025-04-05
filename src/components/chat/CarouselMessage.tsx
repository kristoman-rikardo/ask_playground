import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/types/chat';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button as UIButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    ? Math.floor((containerWidth - (slidesPerView * 10)) / slidesPerView) - 4 // Account for gap/padding
    : slidesPerView === 1 ? 180 : 160; // Smaller base size

  return (
    <div 
      ref={containerRef}
      className={cn("w-full max-w-full", className)}
    >
      <Carousel 
        className="w-full mx-auto" 
        opts={{ 
          align: cards.length === 1 ? 'start' : 'center',
          containScroll: 'trimSnaps',
          slidesToScroll: slidesPerView, // Scroll full view width
          loop: false,
        }}
      >
        <CarouselContent className={cards.length === 1 ? "flex justify-start" : "flex"}>
          {cards.map((card) => (
            <CarouselItem 
              key={card.id || card.title} 
              className={`px-1 ${
                cards.length === 1 && slidesPerView > 1 
                  ? 'basis-1/2' 
                  : slidesPerView === 1 
                    ? 'basis-full' 
                    : slidesPerView === 2 
                      ? 'basis-1/2' 
                      : 'basis-1/3'
              }`}
            >
              <Card 
                className="border border-gray-100 rounded-lg overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-shadow font-sans" 
                style={{ 
                  width: cardWidth > 0 ? cardWidth : undefined,
                  maxWidth: '100%',
                  margin: cards.length === 1 ? '0' : '0 auto', // Left align if single card
                  fontFamily: "'Inter', system-ui, sans-serif"
                }}
              >
                {card.imageUrl && (
                  <div 
                    className="relative w-full overflow-hidden" 
                    style={{ 
                      paddingTop: '110%', // Even more reduced height
                      position: 'relative' 
                    }}
                  >
                    <img 
                      src={card.imageUrl} 
                      alt={card.title}
                      className="object-cover absolute top-0 left-0 w-full h-full"
                    />
                  </div>
                )}
                <CardHeader className="p-1 pb-0.5 flex-none">
                  <CardTitle 
                    className="font-medium truncate text-xs"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-1 pt-0 flex-grow">
                  <CardDescription 
                    className="line-clamp-2 text-2xs"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    {card.description.text}
                  </CardDescription>
                </CardContent>
                {card.buttons && card.buttons.length > 0 && (
                  <CardFooter className="p-1 pt-0 flex flex-wrap gap-1 flex-none">
                    {card.buttons.map((button, idx) => (
                      <UIButton
                        key={idx}
                        variant="secondary"
                        size="sm"
                        onClick={() => onButtonClick(button)}
                        className={`rounded-md transition-all duration-200 ${
                          slidesPerView === 1 
                            ? 'text-xs h-8 px-4 py-1.5' 
                            : 'text-2xs h-7 px-3 py-1'
                        }`}
                        style={{ 
                          fontFamily: "'Inter', system-ui, sans-serif",
                          fontWeight: 500,
                          boxShadow: '1px 1px 3px rgba(0,0,0,0.12)',
                          backgroundColor: '#f0f0f0',
                          border: '1px solid #e0e0e0',
                          transform: 'translateY(0)',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          zIndex: 1
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#e8e8e8';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '2px -1px 4px rgba(0,0,0,0.18)';
                          e.currentTarget.style.zIndex = '5';
                          e.currentTarget.style.position = 'relative';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#f0f0f0';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '1px 1px 3px rgba(0,0,0,0.12)';
                          e.currentTarget.style.zIndex = '1';
                          e.currentTarget.style.position = 'relative';
                        }}
                      >
                        <span style={{ 
                            fontSize: slidesPerView === 1 ? '0.8rem' : '0.7rem',
                            fontFamily: "'Inter', system-ui, sans-serif" 
                          }}>
                          {button.name}
                        </span>
                      </UIButton>
                    ))}
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
              className="left-0 shadow-sm border border-gray-200 bg-white/80 backdrop-blur-sm h-5 w-5 rounded-full"
            >
              <ChevronLeft className="h-2.5 w-2.5 text-gray-500" />
            </CarouselPrevious>
            <CarouselNext 
              variant="outline"
              size="sm" 
              className="right-0 shadow-sm border border-gray-200 bg-white/80 backdrop-blur-sm h-5 w-5 rounded-full"
            >
              <ChevronRight className="h-2.5 w-2.5 text-gray-500" />
            </CarouselNext>
          </>
        )}
      </Carousel>
    </div>
  );
};

export default CarouselMessage;
