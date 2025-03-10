
import { useState, useEffect, useRef } from 'react';

interface UsePulsatingButtonOptions {
  itemsCount: number;
  interval?: number;
  pulsationChance?: number;
}

/**
 * Custom hook that manages the pulsating button effect
 * Note: This hook is now deprecated as the pulsating animation has been removed.
 * Keeping this file for backward compatibility.
 */
export function usePulsatingButton({ 
  itemsCount
}: UsePulsatingButtonOptions) {
  // Always return null to disable pulsating effect
  return null;
}
