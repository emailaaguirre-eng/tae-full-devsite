"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCategories from "@/components/ProductCategories";

interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  heroImage: string | null;
  basePrice: number;
  sizeLabel: string | null;
  paperType: string | null;
  orientation: string | null;
  categoryName: string;
  categorySlug: string;
  categoryIcon: string;
  requiresQrCode: boolean;
}

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string | null;
}

export default function ShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams({ limit: "100" });
        if (activeCategory) params.set("category", activeCategory);
        if (search) params.set("search", search);

        const res = await fetch(`/api/products?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setProducts(data.data || []);
            if (data.categories) setCategories(data.categories);
          }
        }
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [activeCategory, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-brand-dark via-brand-darkest to-brand-dark text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-playfair mb-4">
            Shop &mdash; Customize Your Own
          </h1>
          <p className="text-lg text-brand-lightest max-w-2xl mx-auto">
            Upload your image, design your ArtKey portal, and create something
            truly personal. Every product includes a scannable QR experience.
          </p>
        </div>
      </div>

      <ProductCategories />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 items-start md:items-center justify-between">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === null
                  ? "bg-brand-dark text-white"
                  : "bg-white text-brand-darkest border border-brand-light hover:bg-brand-light"
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setActiveCategory(
                    activeCategory === cat.slug ? null : cat.slug
                  )
                }
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.slug
                    ? "bg-brand-dark text-white"
                    : "bg-white text-brand-darkest border border-brand-light hover:bg-brand-light"
                }`}
              >
                {cat.icon && <span className="mr-1">{cat.icon}</span>}
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-brand-light rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-darkest/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark" />
            <p className="mt-4 text-brand-darkest">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-brand-darkest/60 mb-2">
              No products found
            </p>
            <p className="text-brand-darkest/40">
              {search
                ? "Try a different search term."
                : "Products will appear here once added via the admin panel."}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/shop/${product.slug}`}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 group"
              >
                {/* Image */}
                <div className="relative h-56 bg-gradient-to-br from-brand-light to-brand-medium overflow-hidden">
                  {product.heroImage ? (
                    <Image
                      src={product.heroImage}
                      alt={product.name}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl text-brand-darkest/20">
                        {product.categoryIcon || "🖼️"}
                      </span>
                    </div>
                  )}
                  {product.requiresQrCode && (
                    <span className="absolute top-3 right-3 bg-brand-dark/80 text-white text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-wide">
                      ArtKey
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <p className="text-[11px] font-semibold text-brand-medium uppercase tracking-wider mb-1">
                    {product.categoryName}
                  </p>
                  <h3 className="text-lg font-bold text-brand-darkest mb-1 line-clamp-1 group-hover:text-brand-dark transition-colors">
                    {product.name}
                  </h3>
                  {product.sizeLabel && (
                    <p className="text-xs text-brand-darkest/50 mb-2">
                      {product.sizeLabel}
                    </p>
                  )}
                  <p className="text-sm text-brand-darkest/70 line-clamp-2 mb-4">
                    {product.description ||
                      "Premium quality product with a digital ArtKey portal."}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-brand-dark">
                      ${product.basePrice.toFixed(2)}
                    </span>
                    <span className="text-sm font-semibold text-brand-medium group-hover:text-brand-dark transition-colors">
                      Customize &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
