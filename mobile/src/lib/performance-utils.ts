'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Performance utilities for mobile app optimizations.
 * Focused on reducing re-renders, debouncing inputs, and managing optimistic updates.
 */

/**
 * Debounce hook for text input changes and rapid interactions.
 * Returns immediate state for UI feedback and debounced state for side effects.
 * 
 * @example
 * const [value, setValue, debouncedValue] = useDebounce('', 300);
 * // Type into input with instant UI feedback, but only commit after 300ms of inactivity
 */
export function useDebounce<T>(
  initialValue: T,
  delayMs: number = 300
): [T, (value: T) => void, T] {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSetValue = (newValue: T) => {
    setValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(newValue);
    }, delayMs);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, handleSetValue, debouncedValue];
}

/**
 * Helper for optimistic updates pattern.
 * Rolls back state if operation fails.
 * 
 * @example
 * const previousState = episodeLogs;
 * setEpisodeLogs(newState); // Optimistic
 * try {
 *   await saveEpisode();
 * } catch (err) {
 *   setEpisodeLogs(previousState); // Rollback
 * }
 */
export function createOptimisticUpdateHelper<T>(
  setState: (value: T) => void,
  currentState: T
) {
  return {
    apply: (newState: T) => setState(newState),
    rollback: () => setState(currentState),
  };
}

/**
 * Debounce callback wrapper to prevent rapid function calls.
 * Useful for API calls from rapid user interactions.
 */
export function debounceCall<T extends (...args: never[]) => unknown>(
  fn: T,
  delayMs: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };
}

/**
 * Memoization helper for callbacks to prevent unnecessary re-renders.
 * Returns a stable callback reference that only changes when dependencies change.
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T {
  return useCallback(callback, deps) as T;
}
