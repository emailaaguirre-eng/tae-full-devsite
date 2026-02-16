"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Design files exported from the Customization Studio.
 * Each entry is one placement surface (front, back, inside1, inside2).
 */
export interface DesignFile {
  placement: string;
  dataUrl: string;
}

/**
 * A cart item for a customizable product (shop).
 * Non-customizable items (gallery, cocreators) use a simpler subset.
 */
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;

  /** Source storefront: "shop" | "gallery" | "cocreators" */
  source?: string;

  /** Product slug for linking back to product detail */
  productSlug?: string;

  /** Printful IDs needed at checkout to submit the order */
  printfulProductId?: number;
  printfulVariantId?: number;

  /** Exported design images from the Customization Studio */
  designFiles?: DesignFile[];

  /** Whether this product includes an ArtKey QR code */
  requiresQrCode?: boolean;

  /** ArtKey portal data (title, theme, features, links, etc.) */
  artKeyData?: Record<string, any>;

  /** ArtKey template position on the design canvas */
  artKeyTemplatePosition?: {
    placement: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /** Legacy customization fields */
  customization?: {
    size?: string;
    material?: string;
    frame?: string;
    frameColor?: string;
    uploadedImage?: string;
  };
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('artful-cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('artful-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id);
      if (existingItem) {
        return prevCart.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prevCart, item];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getItemCount,
      }}
    >
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
