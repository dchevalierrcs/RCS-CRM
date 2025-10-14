// frontend/src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

// On s'assure que la fonction est bien exportée par défaut
export default function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Met à jour la valeur "debounced" après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoie le minuteur si la valeur change avant la fin du délai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Ne se ré-exécute que si la valeur ou le délai change

  return debouncedValue;
}