import { useState, useEffect, useCallback, useRef } from 'react';
import { idbSetItem } from '../utils/phoneStorage';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialRef = useRef(initialValue);
  initialRef.current = initialValue;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const valueRef = useRef(storedValue);
  valueRef.current = storedValue;

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      const nextValue = value instanceof Function ? value(valueRef.current) : value;
      valueRef.current = nextValue;
      setStoredValue(nextValue);

      let serialized = '';
      try {
        serialized = JSON.stringify(nextValue);
        window.localStorage.setItem(key, serialized);
      } catch {
        // Ignore quota issues cleanly; IndexedDB below handles large offline storage
      }

      if (serialized) {
        void idbSetItem(key, serialized);
      }

      // Defer cross-component storage sync events outside React's state updater/render phase
      queueMicrotask(() => {
        window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key } }));
        window.dispatchEvent(
          new CustomEvent('cloud-sync-dirty', { detail: { key, value: nextValue } })
        );
      });
    },
    [key]
  );

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string }>;
      if (customEvent.detail?.key === key || customEvent.detail?.key === '*') {
        try {
          const item = window.localStorage.getItem(key);
          const next = item !== null ? (JSON.parse(item) as T) : initialRef.current;
          if (JSON.stringify(valueRef.current) === JSON.stringify(next)) {
            return;
          }
          valueRef.current = next;
          setStoredValue(next);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('local-storage-sync', handleSync);
    return () => window.removeEventListener('local-storage-sync', handleSync);
  }, [key]);

  return [storedValue, setValue] as const;
}
