import { useState, useCallback } from 'react';
import { loadCart, saveCart } from '../utils';

export function useCart(products) {
  const [cart, setCart] = useState(() => loadCart());

  const persist = useCallback((newCart) => {
    setCart(newCart);
    saveCart(newCart);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = useCallback((id, price) => {
    persist((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      const product = products.find((p) => p.id === id);
      return [...prev, { id, name: product ? product.name : `Товар #${id}`, price, quantity: 1 }];
    });
  }, [products, persist]);

  const changeQuantity = useCallback((id, delta) => {
    persist((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i));
    });
  }, [persist]);

  const removeFromCart = useCallback((id) => {
    persist((prev) => prev.filter((i) => i.id !== id));
  }, [persist]);

  const clearCart = useCallback(() => {
    persist([]);
  }, [persist]);

  return { cart, cartCount, cartTotal, addToCart, changeQuantity, removeFromCart, clearCart };
}
