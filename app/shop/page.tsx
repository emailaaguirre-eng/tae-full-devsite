'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const products = [
  {
    id: 'card',
    name: 'Cards',
    description: 'Greeting cards for any occasion',
    icon: '💌',
  },
  {
    id: 'postcard',
    name: 'Postcards',
    description: 'Share moments with postcards',
    icon: '📮',
  },
  {
    id: 'invitation',
    name: 'Invitations',
    description: 'Elegant invitations for events',
    icon: '💒',
  },
  {
    id: 'announcement',
    name: 'Announcements',
    description: 'Share your news beautifully',
    icon: '📢',
  },
  {
    id: 'print',
    name: 'Wall Art',
    description: 'Prints, canvas, and framed art',
    icon: '🖼️',
  },
];

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[900px] overflow-hidden bg-gradient-to-br from-brand-darkest via-brand-dark to-brand-medium">
        <img
          src="https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/newyearartkeyportal.png"
          alt="Shop Hero"
          className="w-full h-full object-contain"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h1 className="text-5xl font-bold text-white mb-4 font-playfair">
              Create Something Beautiful
            </h1>
            <p className="text-xl text-white/90 max-w-xl">
              Choose a product to start designing with ArtKey
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
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

