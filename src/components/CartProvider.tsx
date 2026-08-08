"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Product = {
  id: number;
  rawName: string;
  rawPrice: number;
  originalPrice: number;
  category: string;
  imageUrl: string;
  baseLink: string;
};

type CartContextType = {
  cart: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  total: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Product[]>([]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    if (!cart.find(p => p.id === product.id)) {
      setCart([...cart, product]);
      alert("Sepete eklendi!");
    } else {
      alert("Bu ürün zaten sepetinizde.");
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(p => p.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const total = cart.reduce((sum, item) => sum + item.rawPrice, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
