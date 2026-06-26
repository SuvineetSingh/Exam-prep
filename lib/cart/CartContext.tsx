'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { CourseName } from '@/lib/types';

const STORAGE_KEY = 'examprep_cart';

interface CartContextValue {
  items: CourseName[];
  addItem: (course: CourseName) => void;
  removeItem: (course: CourseName) => void;
  clear: () => void;
  isInCart: (course: CourseName) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CourseName[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = useCallback((course: CourseName) => {
    setItems((prev) => (prev.includes(course) ? prev : [...prev, course]));
  }, []);

  const removeItem = useCallback((course: CourseName) => {
    setItems((prev) => prev.filter((c) => c !== course));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const isInCart = useCallback((course: CourseName) => items.includes(course), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, isInCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
