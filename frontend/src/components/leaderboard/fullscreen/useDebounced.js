import { useRef, useCallback } from 'react';

// Debounce a callback (e.g. color pickers) — only fires after the user pauses.
export default function useDebounced(fn, delay = 120) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}