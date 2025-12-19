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
  bioImage?: string;
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

  // Fetch products from WooCommerce API (products attributed to Deanna)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=100');
        if (response.ok) {
          const data = await response.json();
          // Filter to show products attributed to Deanna (first light, facing the storm, etc.)
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

  // Scroll to anchor when page loads with hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash) {
        // Wait for content to render, then scroll
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
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
            <div
              key={artist.slug}
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
                  <span className="text-xs uppercase tracking-wide text-brand-dark font-semibold">
                    {artist.title}
                  </span>
                </div>
                <p className="text-brand-darkest mb-4 line-clamp-3">
                  {artist.bio}
                </p>
                <a
                  href={`#${artist.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById(artist.slug);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="text-brand-dark font-semibold group-hover:text-brand-darkest transition-colors inline-block cursor-pointer"
                >
                  Learn More →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Expanded Details for Each Artist */}
        {typedArtists.map((artist) => {
          // Get products for Deanna
          const artistProducts = artist.slug === 'deanna-lankin' 
            ? wooProducts.filter((p: WooCommerceProduct) => {
                const name = p.name.toLowerCase();
                return name.includes('first light') || name.includes('facing the storm');
              })
            : [];

          return (
            <div
              key={`detail-${artist.slug}`}
              id={artist.slug}
              className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8"
            >
              {/* Image: Portfolio image for Deanna, bioImage for Bryant */}
              {artist.slug === 'deanna-lankin' && artist.portfolio && artist.portfolio.length > 0 ? (
                // Deanna: Show all portfolio images
                <div className="mb-8">
                  <h4 className="text-2xl font-bold text-brand-darkest mb-6 font-playfair">Portfolio</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    {artist.portfolio.map((item, idx) => (
                      <div key={idx} className="relative w-full h-96 rounded-2xl overflow-hidden bg-brand-lightest">
                        <Image
                          src={item.image}
                          alt={item.title || `${artist.name} portfolio ${idx + 1}`}
                          fill
                          className="object-contain"
                          style={{ objectPosition: 'center' }}
                          unoptimized={item.image.includes('theartfulexperience.com')}
                        />
                        {item.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4">
                            <p className="font-semibold">{item.title}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : artist.bioImage ? (
                // Bryant: Show bioImage (yellow jacket mountain image)
                <div className="relative w-full h-[600px] md:h-[700px] mb-8 rounded-2xl overflow-hidden bg-brand-lightest">
                  <Image
                    src={artist.bioImage}
                    alt={`${artist.name} bio image`}
                    fill
                    className="object-contain"
                    style={{ objectPosition: 'center top' }}
                    unoptimized={artist.bioImage.includes('theartfulexperience.com')}
                  />
                </div>
              ) : null}
              
              <h3 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-4 font-playfair">
                {artist.name}
              </h3>
              <div className="mb-6">
                <span className="text-sm uppercase tracking-wide text-brand-medium font-semibold">
                  {artist.title}
                </span>
              </div>
              
              {/* Complete Bio */}
              {artist.bio && (
                <div className="mb-6">
                  <p className="text-lg text-brand-darkest leading-relaxed mb-4">
                    {artist.bio}
                  </p>
                </div>
              )}
              
              {/* Full Description */}
              {artist.description && (
                <div className="mb-8">
                  <p className="text-base text-brand-darkest leading-relaxed mb-4 whitespace-pre-line">
                    {artist.description}
                  </p>
                </div>
              )}

              {/* Deanna's Products Section */}
              {artist.slug === 'deanna-lankin' && artistProducts.length > 0 && (
                <div className="mt-8 pt-8 border-t border-brand-light">
                  <h4 className="text-2xl font-bold text-brand-darkest mb-6 font-playfair">Available Artwork</h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {artistProducts.map((product: WooCommerceProduct) => {
                      const productImage = product.images && product.images.length > 0 
                        ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.src || product.images[0]?.url)
                        : null;
                      
                      return (
                        <div key={product.id} className="bg-brand-lightest rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all">
                          {productImage && (
                            <div className="relative h-48 w-full bg-gradient-to-br from-brand-light to-brand-medium">
                              <Image
                                src={productImage}
                                alt={product.name}
                                fill
                                className="object-contain"
                                unoptimized={productImage.includes('theartfulexperience.com')}
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <h5 className="font-bold text-brand-darkest mb-2">{product.name}</h5>
                            <p className="text-brand-dark font-semibold">{product.price}</p>
                            <Link
                              href={`/customize?product_id=${product.id}&product_name=${encodeURIComponent(product.name)}&price=${product.price}`}
                              className="mt-3 inline-block bg-brand-medium text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-brand-dark transition-all"
                            >
                              Customize →
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

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
