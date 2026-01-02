'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PRODUCT_CATALOG, getProductSlugs } from '@/lib/productConfig';

// Get products from productConfig for consistency
const products = getProductSlugs().map(slug => {
  const config = PRODUCT_CATALOG[slug];
  return {
    id: slug,
    name: config.name,
    description: config.description,
    icon: config.icon,
  };
});

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16" style={{ backgroundColor: "#f3f3f3" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Side */}
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-brand-darkest font-playfair leading-tight">
                Create Something Beautiful
              </h1>
              <p className="text-xl text-brand-dark max-w-xl">
                Choose a product to start designing with ArtKey. Transform your photos into stunning cards, prints, and more.
              </p>
              <div className="flex gap-4">
                <a
                  href="#products"
                  className="inline-block bg-brand-darkest text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-dark transition-colors"
                >
                  Browse Products
                </a>
              </div>
            </div>
            {/* Image Side */}
            <div className="flex justify-center">
              <img
                src="https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/newyearartkeyportal.png"
                alt="Shop Hero"
                className="max-w-md w-full h-auto rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section id="products" className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-brand-darkest mb-8 font-playfair text-center">
            Our Products
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Ideas Card */}
            <Link
              href="/shop/ideas"
              className="group p-8 rounded-2xl border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-xl bg-gradient-to-br from-purple-50 to-blue-50 block"
            >
              <div className="text-5xl mb-4">💡</div>
              <h3 className="text-2xl font-bold text-brand-darkest mb-3 font-playfair group-hover:text-purple-700 transition-colors">
                ArtKey Ideas
              </h3>
              <p className="text-brand-dark mb-4">
                Discover creative ways to enhance your products with digital experiences
              </p>
              <span className="text-purple-600 font-semibold group-hover:underline">
                Explore Ideas
              </span>
            </Link>

            {/* Product Cards */}
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/shop/${product.id}`}
                className="group p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all hover:shadow-xl bg-white block"
              >
                <div className="text-5xl mb-4">{product.icon}</div>
                <h3 className="text-2xl font-bold text-brand-darkest mb-3 font-playfair group-hover:text-brand-dark transition-colors">
                  {product.name}
                </h3>
                <p className="text-brand-dark mb-4">{product.description}</p>
                <span className="text-brand-darkest font-semibold group-hover:underline">
                  Create {product.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
