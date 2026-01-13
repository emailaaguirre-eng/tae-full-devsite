'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  icon: string;
  heroImage: string | null;
  basePrice: number;
  featured: boolean;
  gelatoCatalog: {
    catalogUid: string;
    title: string;
  } | null;
}

export default function ShopPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/shop/products');
        const data = await response.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16" style={{ backgroundColor: '#f3f3f3' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text */}
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold font-playfair leading-tight text-black">
                Create Something Beautiful
              </h1>
              
              <p className="text-xl text-black max-w-xl">
                Choose a product to enhance with ArtKey™ technology. Transform your photos into stunning cards, prints, and more.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  href="#products"
                  className="inline-block bg-black text-white px-8 py-4 font-semibold hover:bg-brand-medium transition-colors"
                >
                  Browse Products
                </a>
                <Link
                  href="/shop/ideas"
                  className="inline-block bg-white text-black px-8 py-4 font-semibold border-2 border-black hover:bg-brand-lightest transition-colors"
                >
                  💡 ArtKey Ideas
                </Link>
              </div>
            </div>
            
            {/* Right Side - Hero Image */}
            <div className="flex justify-center">
              <img
                src="https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/newyearartkeyportal.png"
                alt="ArtKey Products"
                className="max-w-md w-full h-auto shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section id="products" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-brand-darkest mb-4 font-playfair">
              Choose Your Product
            </h2>
            <p className="text-lg text-brand-medium max-w-2xl mx-auto">
              Select a product to start designing. Each one can include an ArtKey to bring your creation to life.
            </p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-brand-light h-64"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/shop/${product.slug}`}
                  className="group relative bg-white border-2 border-brand-light hover:border-brand-darkest transition-all hover:shadow-xl overflow-hidden"
                >
                  {/* Featured Badge */}
                  {product.featured && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="bg-brand-accent text-brand-darkest text-xs font-bold px-3 py-1">
                        Popular
                      </span>
                    </div>
                  )}
                  
                  {/* Product Image or Icon */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-brand-lightest to-white flex items-center justify-center">
                    {product.heroImage ? (
                      <img 
                        src={product.heroImage} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-7xl group-hover:scale-110 transition-transform">
                        {product.icon || '📦'}
                      </span>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair group-hover:text-brand-medium transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-brand-medium mb-4 line-clamp-2">
                      {product.shortDescription || product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-brand-darkest">
                        From ${product.basePrice.toFixed(2)}
                      </span>
                      <span className="text-brand-darkest font-semibold group-hover:translate-x-1 transition-transform">
                        Create →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ArtKey Explainer */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-brand-lightest">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-brand-darkest mb-6 font-playfair">
            What is an ArtKey™?
          </h2>
          <p className="text-lg text-brand-medium mb-8">
            Every product you create can include an ArtKey — a QR code that unlocks a personalized digital portal. 
            Your recipient scans it to experience everything you couldn't fit on paper.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 shadow-sm border border-brand-light">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="font-bold text-brand-darkest mb-2">Scan or Tap</h3>
              <p className="text-brand-medium text-sm">Works with any smartphone camera - no app needed</p>
            </div>
            <div className="bg-white p-6 shadow-sm border border-brand-light">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="font-bold text-brand-darkest mb-2">Discover More</h3>
              <p className="text-brand-medium text-sm">Photos, videos, messages, links - all in one place</p>
            </div>
            <div className="bg-white p-6 shadow-sm border border-brand-light">
              <div className="text-4xl mb-4">💝</div>
              <h3 className="font-bold text-brand-darkest mb-2">Stay Connected</h3>
              <p className="text-brand-medium text-sm">Update your portal anytime - add new memories as they happen</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
