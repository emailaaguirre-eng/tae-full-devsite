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

  /** Assignment-based identity for Catalog V2 bridge flow */
  assignmentId?: string;

  /** Printful IDs needed at checkout to submit the order */
  printfulProductId?: number;
  printfulVariantId?: number;

  /** Exported design images from the Customization Studio */
  designFiles?: DesignFile[];
  /** Server-registered studio export reference for traceability/retries */
  designDraftId?: string;
  /** Lightweight signature to verify render payload integrity through checkout */
  studioRenderSignature?: string;

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
    templateId?: string;
  };

  /** Proof-stage persisted portal/Qr metadata for regeneration-free reproofs */
  proofPortal?: {
    portalToken: string;
    ownerToken: string;
    portalUrl: string;
    editUrl: string;
    qrCodeDataUrl?: string;
  };

  /**
   * Latest server proof snapshot id from /api/proof/generate (pending approval).
   */
  pendingProofSnapshotId?: string;
  /**
   * Server-approved snapshot id (POST /api/proof/approve). Required for QR payment + orders.
   */
  approvedProofSnapshotId?: string;

  /** Legacy customization fields */
  customization?: {
    size?: string;
    material?: string;
    frame?: string;
    frameColor?: string;
    uploadedImage?: string;
  };

  /** Optional paid features selected during buying flow */
  priceAdjustments?: Array<{
    code?: string;
    label?: string;
    amount: number;
  }>;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const safeNumber = (value: unknown, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('artful-cart');
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      if (Array.isArray(parsed)) {
        setCart(
          parsed.map((item) => ({
            ...item,
            price: safeNumber(item?.price, 0),
            quantity: Math.max(1, Math.trunc(safeNumber(item?.quantity, 1))),
          }))
        );
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes.
  // Design files (large base64 PNGs) are stored separately in sessionStorage
  // to avoid exceeding localStorage's ~5MB quota.
  useEffect(() => {
    const lightCart = cart.map((item) => {
      const { designFiles, imageUrl, ...rest } = item;
      let next = { ...rest, imageUrl, designFiles } as CartItem;

      if (designFiles && designFiles.length > 0) {
        try {
          sessionStorage.setItem(`tae-design-${item.id}`, JSON.stringify(designFiles));
        } catch { /* sessionStorage also full — data survives in memory */ }
        if (imageUrl && imageUrl.startsWith('data:')) {
          try { sessionStorage.setItem(`tae-thumb-${item.id}`, imageUrl); } catch {}
          return {
            ...next,
            designFiles: designFiles.map((df) => ({ placement: df.placement, dataUrl: '' })),
            imageUrl: '',
          };
        }
        return {
          ...next,
          designFiles: designFiles.map((df) => ({ placement: df.placement, dataUrl: '' })),
        };
      }
      return next;
    });
    try {
      localStorage.setItem('artful-cart', JSON.stringify(lightCart));
    } catch {
      console.warn('Cart save failed — clearing old cart data');
      localStorage.removeItem('artful-cart');
    }
  }, [cart]);

  // Rehydrate design files from sessionStorage on mount
  useEffect(() => {
    setCart((prev) =>
      prev.map((item) => {
        let next = item;
        if (item.designFiles?.some((df) => !df.dataUrl)) {
          try {
            const stored = sessionStorage.getItem(`tae-design-${item.id}`);
            if (stored) {
              const files = JSON.parse(stored);
              const thumb = sessionStorage.getItem(`tae-thumb-${item.id}`);
              next = { ...next, designFiles: files, imageUrl: thumb || next.imageUrl };
            }
          } catch {}
        }
        return next;
      })
    );
  }, []);

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
    try {
      sessionStorage.removeItem(`tae-design-${id}`);
      sessionStorage.removeItem(`tae-thumb-${id}`);
    } catch {}
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
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
    try {
      for (const item of cart) {
        sessionStorage.removeItem(`tae-design-${item.id}`);
        sessionStorage.removeItem(`tae-thumb-${item.id}`);
      }
    } catch {}
    setCart([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = safeNumber(item?.price, 0);
      const qty = Math.max(1, Math.trunc(safeNumber(item?.quantity, 1)));
      return total + price * qty;
    }, 0);
  };

  const getItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateCartItem,
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
