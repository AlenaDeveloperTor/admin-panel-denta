'use client';

import { useEffect, useState } from 'react';

/** Дебаунс значения (по ТЗ: поиск с debounce 500ms) */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
