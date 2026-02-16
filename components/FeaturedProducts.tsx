"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  heroImage: string | null;
  basePrice: number;
  sizeLabel: string | null;
  categoryName: string;
  categorySlug: string;
  requiresQrCode: boolean;
}

type FeaturedProductsProps = {
  title?: string;
};

export default function FeaturedProducts({ title = "Shop — Customize Your Own" }: FeaturedProductsProps) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products?limit=12");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setProducts(data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const currentProducts = products;

  // Calculate how many products to show per slide based on screen size
  const getProductsPerSlide = () => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 1; // mobile
    if (window.innerWidth < 1024) return 2; // tablet
    return 4; // desktop
  };

  const [productsPerSlide, setProductsPerSlide] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      setProductsPerSlide(getProductsPerSlide());
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, currentProducts.length - productsPerSlide);

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  return (
    <section
      id="shop" className="py-20" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">
            {title}
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto"></div>
        </div>

        {/* Products Slider */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark"></div>
            <p className="mt-4 text-brand-darkest">Loading products...</p>
          </div>
        ) : currentProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-brand-darkest">No products found.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Navigation Arrows */}
            {currentIndex > 0 && (
              <button
                onClick={goToPrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-brand-light transition-colors"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-6 h-6 text-brand-dark" />
              </button>
            )}
            {currentIndex < maxIndex && (
              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-brand-light transition-colors"
                aria-label="Next products"
              >
                <ChevronRight className="w-6 h-6 text-brand-dark" />
              </button>
            )}

            {/* Slider Container */}
            <div className="overflow-hidden">
              <div
                ref={sliderRef}
                className="flex transition-transform duration-500 ease-in-out gap-6"
                style={{
                  transform: `translateX(-${currentIndex * (100 / productsPerSlide)}%)`,
                }}
              >
                {currentProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-brand-lightest rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer group flex-shrink-0"
                    style={{
                      width: `calc((100% - ${(productsPerSlide - 1) * 24}px) / ${productsPerSlide})`,
                    }}
                  >
                    {/* Product Image */}
                    <div className="bg-gradient-to-br from-brand-light to-brand-medium h-48 flex items-center justify-center group-hover:scale-105 transition-transform relative overflow-hidden">
                      {product.heroImage ? (
                        <Image
                          src={product.heroImage}
                          alt={product.name}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          unoptimized
                        />
                      ) : (
                        <span className="text-6xl text-brand-darkest/30">
                          {product.categoryName === "Greeting Cards" ? "💌" : "🖼️"}
                        </span>
                      )}
                      {product.requiresQrCode && (
                        <span className="absolute top-2 right-2 bg-brand-dark/80 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                          ArtKey
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-5">
                      <p className="text-xs font-semibold text-brand-medium uppercase tracking-wide mb-1">
                        {product.categoryName}
                      </p>
                      <h3 className="text-lg font-bold text-brand-darkest mb-1 line-clamp-1">
                        {product.name}
                      </h3>
                      {product.sizeLabel && (
                        <p className="text-xs text-brand-darkest/60 mb-2">{product.sizeLabel}</p>
                      )}
                      <p className="text-sm text-brand-darkest/80 mb-4 line-clamp-2">
                        {product.description || "Premium quality product with digital ArtKey portal."}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-brand-dark">
                          ${product.basePrice.toFixed(2)}
                        </span>
                        <Link
                          href={`/shop/${product.slug}`}
                          className="bg-brand-medium text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-brand-dark transition-colors"
                        >
                          Customize
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-12 flex flex-wrap justify-center gap-4">
          <Link
            href="/shop"
            className="inline-block bg-brand-dark text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-brand-darkest transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Shop All Products
          </Link>
          <Link
            href="/gallery"
            className="inline-block border-2 border-brand-dark text-brand-dark px-10 py-4 rounded-full text-lg font-semibold hover:bg-brand-dark hover:text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Visit Gallery
          </Link>
        </div>
      </div>
    </section>
  );
}

