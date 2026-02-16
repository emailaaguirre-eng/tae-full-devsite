"use client";

import { useCart } from "@/contexts/CartContext";
import type { CartItem } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const frontDesign = item.designFiles?.find((f) => f.placement === "front");
  const thumbnail = frontDesign?.dataUrl || item.imageUrl;

  return (
    <div className="flex gap-4 sm:gap-6 py-6 border-b border-gray-100 last:border-0">
      {/* Thumbnail */}
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-brand-light to-brand-medium">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={item.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-brand-darkest/20">
              {item.source === "gallery"
                ? "🖼️"
                : item.source === "cocreators"
                ? "🤝"
                : "📦"}
            </span>
          </div>
        )}
        {item.requiresQrCode && (
          <span className="absolute top-1 right-1 bg-brand-dark/80 text-white text-[8px] px-1.5 py-0.5 rounded-full font-semibold">
            ArtKey
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-semibold text-brand-darkest text-sm sm:text-base line-clamp-1">
              {item.name}
            </h3>
            {item.source && (
              <p className="text-[11px] text-brand-medium uppercase tracking-wider mt-0.5">
                {item.source === "shop"
                  ? "Custom Product"
                  : item.source === "gallery"
                  ? "theAE Gallery"
                  : "CoCreators"}
              </p>
            )}
            {item.customization?.size && (
              <p className="text-xs text-brand-darkest/50 mt-1">
                Size: {item.customization.size}
              </p>
            )}
          </div>
          <p className="text-lg font-bold text-brand-dark whitespace-nowrap">
            ${(item.price * item.quantity).toFixed(2)}
          </p>
        </div>

        {/* Design files preview (show placement thumbnails) */}
        {item.designFiles && item.designFiles.length > 1 && (
          <div className="flex gap-2 mt-3">
            {item.designFiles.map((df) => (
              <div
                key={df.placement}
                className="w-10 h-10 rounded border border-gray-200 overflow-hidden bg-gray-50"
                title={df.placement}
              >
                <img
                  src={df.dataUrl}
                  alt={df.placement}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        )}

        {/* ArtKey badge */}
        {item.artKeyData?.title && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-brand-light/50 text-brand-darkest px-2.5 py-1 rounded-full text-xs">
            <span>ArtKey:</span>
            <span className="font-medium truncate max-w-[120px]">
              {item.artKeyData.title}
            </span>
          </div>
        )}

        {/* Quantity controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="px-3 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-4 py-1.5 text-sm font-medium text-brand-darkest min-w-[40px] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="px-3 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => onRemove(item.id)}
            className="text-red-400 hover:text-red-600 transition-colors p-2"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, getTotalPrice, getItemCount } = useCart();
  const router = useRouter();

  const subtotal = getTotalPrice();
  const itemCount = getItemCount();

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-brand-light/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-brand-darkest/30" />
          </div>
          <h1 className="text-2xl font-bold text-brand-darkest mb-3">
            Your cart is empty
          </h1>
          <p className="text-brand-darkest/60 mb-8">
            Browse our shop, gallery, or cocreator collections to find something
            you love.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shop"
              className="bg-brand-dark text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-darkest transition-colors"
            >
              Shop Products
            </Link>
            <Link
              href="/gallery"
              className="border-2 border-brand-dark text-brand-dark px-8 py-3 rounded-full font-semibold hover:bg-brand-dark hover:text-white transition-colors"
            >
              Visit Gallery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-brand-darkest font-playfair">
            Your Cart
            <span className="text-lg font-normal text-brand-darkest/50 ml-3">
              ({itemCount} {itemCount === 1 ? "item" : "items"})
            </span>
          </h1>
          <button
            onClick={clearCart}
            className="text-sm text-red-400 hover:text-red-600 transition-colors"
          >
            Clear cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              {cart.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </div>

            {/* Continue Shopping */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="text-sm text-brand-dark font-medium hover:text-brand-darkest transition-colors"
              >
                &larr; Continue shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold text-brand-darkest mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-darkest/60">
                    Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                  </span>
                  <span className="font-medium text-brand-darkest">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-darkest/60">Shipping</span>
                  <span className="text-brand-darkest/60 text-xs">
                    Calculated at checkout
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="font-bold text-brand-darkest">Estimated Total</span>
                  <span className="font-bold text-xl text-brand-dark">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* ArtKey Notice */}
              {cart.some((item) => item.requiresQrCode) && (
                <div className="bg-brand-light/30 border border-brand-medium/20 rounded-lg p-4 mb-6">
                  <p className="text-xs text-brand-darkest/70 leading-relaxed">
                    <span className="font-semibold">ArtKey items included.</span>{" "}
                    During checkout, we&apos;ll generate your unique QR codes and
                    show you a proof with the real QR before you pay.
                  </p>
                </div>
              )}

              <button
                onClick={() => router.push("/checkout")}
                className="w-full bg-brand-dark text-white py-4 rounded-full text-lg font-semibold hover:bg-brand-darkest transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-center text-[11px] text-brand-darkest/40 mt-3">
                Secure checkout powered by PayPal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
