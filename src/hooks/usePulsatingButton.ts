
import { useState, useEffect } from 'react';

interface UsePulsatingButtonOptions {
  itemsCount: number;
  interval?: number;
  pulsationChance?: number;
}

/**
 * Custom hook that manages the pulsating button effect
 */
export function usePulsatingButton({ 
  itemsCount, 
  interval = 3500, 
  pulsationChance = 0.8 
}: UsePulsatingButtonOptions) {
  const [pulsatingIndex, setPulsatingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (itemsCount === 0) return;
    
    // Function to randomly select an item to pulsate
    const pulsateRandomItem = () => {
      // Either select a random item or set to null to pause pulsation briefly
      const shouldPulsate = Math.random() < pulsationChance;
      if (shouldPulsate) {
        const randomIndex = Math.floor(Math.random() * itemsCount);
        setPulsatingIndex(randomIndex);
      } else {
        setPulsatingIndex(null);
      }
    };

    // Set up interval for random pulsating
    const intervalId = setInterval(pulsateRandomItem, interval);
    return () => clearInterval(intervalId);
  }, [itemsCount, interval, pulsationChance]);

  return pulsatingIndex;
}
