"use client";

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

export function usePersistentState<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      if (stickyValue !== null) {
        setValue(JSON.parse(stickyValue));
      }
    } catch (e) {
      console.warn(`Error reading localStorage key “${key}”:`, e);
    }
  }, [key]);

  const setAndStoreValue = useCallback<Dispatch<SetStateAction<T>>>((newValue) => {
    setValue(prevValue => {
      const valueToStore = newValue instanceof Function ? newValue(prevValue) : newValue;
      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (e) {
        console.warn(`Error setting localStorage key “${key}”:`, e);
      }
      return valueToStore;
    });
  }, [key]);

  return [value, setAndStoreValue];
}
