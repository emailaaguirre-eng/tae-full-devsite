"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { getItemCount } = useCart();

  const handleHomeClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Navigate to home page
      e.preventDefault();
      router.push('/');
    }
  };

  const handleCartClick = () => {
    router.push('/customize');
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md professional-shadow fixed w-full top-0 z-50 border-b border-brand-light/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <a 
              href="/" 
              onClick={handleHomeClick} 
              className="text-xl md:text-2xl font-bold text-brand-dark font-playfair cursor-pointer"
            >
              TheAE
            </a>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              <a
                href="/"
                onClick={handleHomeClick}
                className="text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 text-sm font-medium font-playfair cursor-pointer"
              >
                Home
              </a>
              
              <Link
                href="/customize"
                className="text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 text-sm font-medium font-playfair"
              >
                Shop
              </Link>

              <Link
                href="/gallery"
                className="text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 text-sm font-medium font-playfair"
              >
                TheAE Gallery
              </Link>

              <Link
                href="/cocreators"
                className="text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 text-sm font-medium font-playfair"
              >
                CoCreators
              </Link>

              <Link
                href="/about"
                className="text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 text-sm font-medium font-playfair"
              >
                About Us
              </Link>
              <Link
                href="/contact"
                className="text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 text-sm font-medium font-playfair"
              >
                Contact Us
              </Link>
              <button 
                onClick={handleCartClick}
                className="bg-green-600 text-white hover:bg-green-700 transition-colors px-6 py-2 rounded-full text-sm font-medium font-playfair flex items-center gap-2"
              >
                🛒 Cart ({getItemCount()})
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <button 
              onClick={handleCartClick}
              className="text-green-600 text-xl relative"
            >
              🛒
              {getItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-brand-darkest hover:text-brand-medium focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-brand-light">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a
              href="/"
              onClick={(e) => {
                setIsOpen(false);
                handleHomeClick(e);
              }}
              className="block text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 text-base font-medium font-playfair cursor-pointer"
            >
              Home
            </a>
            <Link
              href="/customize"
              className="block text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 text-base font-medium font-playfair"
              onClick={() => setIsOpen(false)}
            >
              Shop
            </Link>
            <Link
              href="/gallery"
              className="block text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 text-base font-medium font-playfair"
              onClick={() => setIsOpen(false)}
            >
              TheAE Gallery
            </Link>
            <Link
              href="/cocreators"
              className="block text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 text-base font-medium font-playfair"
              onClick={() => setIsOpen(false)}
            >
              CoCreators
            </Link>
            <Link
              href="/about"
              className="block text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 text-base font-medium font-playfair"
              onClick={() => setIsOpen(false)}
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="block text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 text-base font-medium font-playfair"
              onClick={() => setIsOpen(false)}
            >
              Contact Us
            </Link>
            <button
              onClick={() => {
                setIsOpen(false);
                handleCartClick();
              }}
              className="block w-full text-left text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 text-base font-medium font-playfair"
            >
              🛒 Cart ({getItemCount()})
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

