import { useState, useEffect, useRef } from 'react';

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
  interval = 5000, 
  pulsationChance = 0.4 
}: UsePulsatingButtonOptions) {
  const [pulsatingIndex, setPulsatingIndex] = useState<number | null>(null);
  const prevItemsCountRef = useRef(itemsCount);

  useEffect(() => {
    if (itemsCount === 0) {
      setPulsatingIndex(null);
      return;
    }
    
    // Keep the same pulsating index if possible when items change
    if (prevItemsCountRef.current !== itemsCount) {
      if (pulsatingIndex !== null && pulsatingIndex >= itemsCount) {
        setPulsatingIndex(null);
      }
      prevItemsCountRef.current = itemsCount;
    }
    
    // Function to randomly select an item to pulsate
    const pulsateRandomItem = () => {
      // Either select a random item or set to null to pause pulsation briefly
      const shouldPulsate = Math.random() < pulsationChance;
      if (shouldPulsate && itemsCount > 0) {
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
