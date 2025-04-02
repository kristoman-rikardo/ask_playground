
import React from 'react';
import { Button } from '@/types/chat';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button as UIButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  if (!cards || cards.length === 0) return null;

  return (
    <div className={cn("w-full py-4", className)}>
      <Carousel className="w-full mx-auto" opts={{ align: 'start', containScroll: 'trimSnaps' }}>
        <CarouselContent className="flex -ml-4">
          {cards.map((card) => (
            <CarouselItem key={card.id || card.title} className="basis-full pl-4">
              <Card className="border rounded-xl overflow-hidden h-full flex flex-col">
                {card.imageUrl && (
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    <img 
                      src={card.imageUrl} 
                      alt={card.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <CardHeader className="p-4 pb-2 flex-none">
                  <CardTitle className="text-lg font-medium">{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow">
                  <CardDescription>{card.description.text}</CardDescription>
                </CardContent>
                {card.buttons && card.buttons.length > 0 && (
                  <CardFooter className="p-4 pt-0 flex flex-wrap gap-2 flex-none">
                    {card.buttons.map((button, idx) => (
                      <UIButton
                        key={idx}
                        variant="secondary"
                        size="sm"
                        onClick={() => onButtonClick(button)}
                        className="text-sm"
                      >
                        {button.name}
                      </UIButton>
                    ))}
                  </CardFooter>
                )}
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        {cards.length > 1 && (
          <>
            <CarouselPrevious className="left-1 shadow-md" />
            <CarouselNext className="right-1 shadow-md" />
          </>
        )}
      </Carousel>
    </div>
  );
};

export default CarouselMessage;
