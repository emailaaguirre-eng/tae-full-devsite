"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import galleryData from "@/content/gallery.json";

interface WooCommerceProduct {
  id: number;
  name: string;
  price: string;
  regular_price?: string;
  sale_price?: string;
  images?: Array<{ src: string; alt: string }>;
  description?: string;
  short_description?: string;
  average_rating?: string;
  rating_count?: number;
  on_sale?: boolean;
  permalink?: string;
}

interface Artist {
  name: string;
  title: string;
  image: string;
  bio: string;
  description?: string;
  slug: string;
  portfolio?: Array<{
    title: string;
    image: string;
    forSale: boolean;
    price?: number | null;
  }>;
}

export default function Gallery() {
  const { title, subtitle, artists, comingSoon } = galleryData;
  const [wooProducts, setWooProducts] = useState<WooCommerceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from WooCommerce API (only "first light" and "facing the storm")
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=100');
        if (response.ok) {
          const data = await response.json();
          // Filter to show only "first light" and "facing the storm"
          const filteredProducts = data.filter((product: WooCommerceProduct) => {
            const name = product.name.toLowerCase();
            return name.includes('first light') || name.includes('facing the storm');
          });
          setWooProducts(filteredProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const typedArtists = artists as Artist[];

  return (
    <section className="py-20" style={{ backgroundColor: '#ecece9' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4 font-playfair">
            {title}
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
          <p className="text-lg text-brand-darkest max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Artists Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {typedArtists.map((artist) => (
            <Link
              key={artist.slug}
              href={`/gallery/${artist.slug}`}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group"
            >
              <div className="relative h-64 w-full bg-gradient-to-br from-brand-light to-brand-medium overflow-hidden">
                <Image
                  src={artist.image}
                  alt={artist.name}
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-300"
                  style={{ objectPosition: 'top center' }}
                />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-brand-darkest mb-2 font-playfair">
                  {artist.name}
                </h3>
                <div className="mb-3">
                  <span className="text-xs uppercase tracking-wide text-brand-medium font-semibold">
                    {artist.title}
                  </span>
                </div>
                <p className="text-brand-darkest mb-4 line-clamp-3">
                  {artist.bio}
                </p>
                <div className="text-brand-medium font-semibold group-hover:text-brand-dark transition-colors">
                  Learn More & See {artist.name.split(' ')[0]}&apos;s Work →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Coming Soon Message */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg inline-block">
            <h3 className="text-2xl font-bold text-brand-dark mb-4 font-playfair">
              {comingSoon.title}
            </h3>
            <p className="text-brand-darkest mb-6">
              {comingSoon.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
