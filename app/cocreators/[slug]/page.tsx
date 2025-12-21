"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import cocreatorsData from "@/content/cocreators.json";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface CoCreator {
  name: string;
  title: string;
  image: string;
  mountainImage?: string;
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

interface CoCreatorPageProps {
  params: { slug: string } | Promise<{ slug: string }>;
}

export default function CoCreatorPage({ params }: CoCreatorPageProps) {
  // Handle both Promise and direct params for Next.js 14 compatibility
  const [slug, setSlug] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    const getSlug = async () => {
      if (params instanceof Promise) {
        const resolved = await params;
        setSlug(resolved.slug);
      } else {
        setSlug(params.slug);
      }
    };
    getSlug();
  }, [params]);
  const { cocreators } = cocreatorsData;
  const typedCocreators = cocreators as CoCreator[];
  const cocreator = slug ? typedCocreators.find((c) => c.slug === slug) : undefined;

  // Fetch products from WooCommerce for this co-creator (for future use)
  const [wooProducts, setWooProducts] = useState<Array<{
    id: number;
    name: string;
    price: string;
    images?: Array<{ src: string; alt: string }>;
    permalink?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string; title?: string } | null>(null);

  useEffect(() => {
    if (!cocreator) {
      setLoading(false);
      return;
    }

    // For future: fetch products related to this co-creator
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=100');
        if (response.ok) {
          const data = await response.json();
          // Filter products that might be related to this co-creator
          // For now, empty array - will be populated when products are added
          setWooProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [cocreator]);

  // Handle escape key to close expanded image
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedImage) {
        setExpandedImage(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [expandedImage]);

  if (!cocreator) {
    return (
      <main className="min-h-screen bg-brand-lightest">
        <Navbar />
        <div className="py-20 text-center">
          <h1 className="text-4xl font-bold text-brand-dark mb-4">CoCreator Not Found</h1>
          <Link href="/cocreators" className="text-brand-medium hover:text-brand-dark">
            ← Back to CoCreators
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  // Parse bio and description
  const bioParts = cocreator.bio.split('\n\n');
  const firstBioPart = bioParts[0] || '';
  const descriptionParts = cocreator.description ? cocreator.description.split('\n\n') : [];
  const descriptionTitle = descriptionParts[0] || '';
  const descriptionContent = descriptionParts.slice(1).join('\n\n');

  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      <section className="py-20" style={{ backgroundColor: '#ecece9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/cocreators"
            className="inline-flex items-center text-brand-dark hover:text-brand-darkest mb-8 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to CoCreators
          </Link>

          {/* CoCreator Header */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-12">
            <div className="grid md:grid-cols-2 gap-0">
              {/* CoCreator Profile Picture */}
              <div className="relative min-h-[400px] md:min-h-[500px] w-full">
                <Image
                  src={cocreator.image}
                  alt={cocreator.name}
                  fill
                  className="object-contain"
                  style={{ objectPosition: 'top center' }}
                  unoptimized={cocreator.image.startsWith('http')}
                />
              </div>
              
              {/* CoCreator Name and Title */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <h1 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-4 font-playfair">
                  {cocreator.name}
                </h1>
                <div className="mb-4">
                  <span className="text-sm uppercase tracking-wide text-brand-medium font-semibold">
                    {cocreator.title}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Full Bio Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-6 font-playfair">
              About {cocreator.name.split(' ')[0]}
            </h2>
            <div className="space-y-4">
              <p className="text-lg text-brand-darkest leading-relaxed">
                {firstBioPart}
              </p>
              {descriptionContent && (
                <div className="mt-6 pt-6 border-t border-brand-light">
                  {descriptionTitle && (
                    <h3 className="text-2xl font-bold text-brand-darkest mb-4 font-playfair">
                      {descriptionTitle}
                    </h3>
                  )}
                  <p className="text-base text-brand-darkest leading-relaxed whitespace-pre-line">
                    {descriptionContent}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Portfolio Section */}
          {cocreator.portfolio && cocreator.portfolio.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-8 font-playfair">
                Portfolio
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {cocreator.portfolio.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="relative w-full h-96 rounded-2xl overflow-hidden bg-brand-lightest shadow-md hover:shadow-xl transition-all cursor-pointer group"
                    onClick={() => setExpandedImage({ 
                      src: item.image, 
                      alt: item.title || `${cocreator.name} portfolio ${idx + 1}`,
                      title: item.title 
                    })}
                  >
                    <Image
                      src={item.image}
                      alt={item.title || `${cocreator.name} portfolio ${idx + 1}`}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-300"
                      style={{ objectPosition: 'center' }}
                      unoptimized={item.image.startsWith('http')}
                    />
                    {item.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4">
                        <p className="font-semibold text-lg">{item.title}</p>
                      </div>
                    )}
                    {/* Click indicator */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                      <div className="bg-white/90 rounded-full p-3">
                        <svg className="w-6 h-6 text-brand-darkest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bio Image (mountainImage for Kimber) */}
          {cocreator.mountainImage && (
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
              <div className="relative w-full h-[600px] md:h-[700px] rounded-2xl overflow-hidden bg-brand-lightest">
                <Image
                  src={cocreator.mountainImage}
                  alt={`${cocreator.name} bio image`}
                  fill
                  className="object-contain"
                  style={{ objectPosition: 'center top' }}
                  unoptimized={cocreator.mountainImage.startsWith('http')}
                />
              </div>
            </div>
          )}

          {/* TheAE Collaboration / Available Artwork Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-8 font-playfair">
              {cocreator.slug === 'kimber-cross' ? 'TheAE Collaboration' : 'Available Artwork'}
            </h2>
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-brand-dark">Loading {cocreator.slug === 'kimber-cross' ? 'collaboration' : 'artwork'}...</p>
              </div>
            ) : wooProducts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wooProducts.map((product) => {
                  const productImage = product.images && product.images.length > 0 
                    ? product.images[0].src 
                    : '';
                  const price = product.price || '0.00';
                  
                  return (
                    <div key={product.id} className="bg-brand-lightest rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-brand-light">
                      <div className="relative h-48 w-full bg-gradient-to-br from-brand-light to-brand-medium">
                        <Image
                          src={productImage}
                          alt={product.name}
                          fill
                          className="object-contain"
                          unoptimized={productImage.includes('theartfulexperience.com')}
                        />
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-brand-darkest mb-2 font-playfair">{product.name}</h3>
                        <p className="text-brand-dark font-semibold mb-3">${price}</p>
                        <Link
                          href={`/customize?product_id=${product.id}&product_name=${encodeURIComponent(product.name)}&price=${product.price}`}
                          className="inline-block bg-brand-medium text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-brand-dark transition-all shadow-md hover:shadow-lg"
                        >
                          Customize →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-brand-lightest rounded-2xl">
                <p className="text-brand-dark">
                  {cocreator.slug === 'kimber-cross' 
                    ? 'Collaboration artwork coming soon.' 
                    : 'Available artwork coming soon.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-7xl max-h-[95vh] w-full h-full flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full p-3 transition-colors shadow-lg"
              aria-label="Close"
            >
              <svg className="w-6 h-6 text-brand-darkest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="relative w-full h-full max-w-6xl">
                <Image
                  src={expandedImage.src}
                  alt={expandedImage.alt}
                  fill
                  className="object-contain"
                  unoptimized={expandedImage.src.startsWith('http')}
                />
              </div>
            </div>
            
            {/* Title */}
            {expandedImage.title && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 rounded-lg px-6 py-3 shadow-lg">
                <p className="text-lg font-semibold text-brand-darkest">{expandedImage.title}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}

