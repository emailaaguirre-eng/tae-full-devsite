"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import galleryData from "@/content/gallery.json";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

interface ArtistPageProps {
  params: { slug: string } | Promise<{ slug: string }>;
}

export default function ArtistPage({ params }: ArtistPageProps) {
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
  const { artists } = galleryData;
  const typedArtists = artists as Artist[];
  const artist = slug ? typedArtists.find((a) => a.slug === slug) : undefined;

  // Product fetching removed - no longer using WooCommerce
  // Products are now managed via Gelato API and shop pages
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string; title?: string } | null>(null);

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

  if (!artist) {
    return (
      <main className="min-h-screen bg-brand-lightest">
        <Navbar />
        <div className="py-20 text-center">
          <h1 className="text-4xl font-bold text-brand-dark mb-4">Artist Not Found</h1>
          <Link href="/gallery" className="text-brand-medium hover:text-brand-dark">
            ← Back to Gallery
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      <section className="py-20" style={{ backgroundColor: '#ecece9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/gallery"
            className="inline-flex items-center text-brand-dark hover:text-brand-darkest mb-8 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Gallery
          </Link>

          {/* Artist Header */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-12">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Artist Profile Picture */}
              <div className="relative min-h-[400px] md:min-h-[500px] w-full">
                <Image
                  src={artist.image}
                  alt={artist.name}
                  fill
                  className="object-contain"
                  style={{ objectPosition: 'top center' }}
                  unoptimized={artist.image.includes('theartfulexperience.com')}
                />
              </div>
              
              {/* Artist Name and Title */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <h1 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-4 font-playfair">
                  {artist.name}
                </h1>
                <div className="mb-4">
                  <span className="text-sm uppercase tracking-wide text-brand-medium font-semibold">
                    {artist.title}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Full Bio Section with Image Combined */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-6 font-playfair">
              About {artist.name.split(' ')[0]}
            </h2>
            <div className="space-y-4 mb-8">
              {artist.bio && (
                <p className="text-lg text-brand-darkest leading-relaxed">
                  {artist.bio}
                </p>
              )}
              {artist.description && (
                <div className={artist.bio ? "mt-6 pt-6 border-t border-brand-light" : ""}>
                  <p className="text-lg text-brand-darkest leading-relaxed whitespace-pre-line">
                    {artist.description}
                  </p>
                </div>
              )}
            </div>
            
            {/* Bio Image - Combined in same section */}
            {artist.bioImage && (
              <div className="relative w-full h-[600px] md:h-[700px] rounded-2xl overflow-hidden bg-brand-lightest">
                <Image
                  src={artist.bioImage}
                  alt={`${artist.name} bio image`}
                  fill
                  className="object-contain"
                  style={{ objectPosition: 'center top' }}
                  unoptimized={artist.bioImage.includes('theartfulexperience.com')}
                />
              </div>
            )}
          </div>

          {/* Portfolio Section */}
          {artist.portfolio && artist.portfolio.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-8 font-playfair">
                Portfolio
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {artist.portfolio.map((item, idx) => (
                  <div key={idx} className="relative w-full h-96 rounded-2xl overflow-hidden bg-brand-lightest shadow-md hover:shadow-xl transition-shadow">
                    <Image
                      src={item.image}
                      alt={item.title || `${artist.name} portfolio ${idx + 1}`}
                      fill
                      className="object-contain"
                      style={{ objectPosition: 'center' }}
                      unoptimized={item.image.includes('theartfulexperience.com')}
                    />
                    {item.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4">
                        <p className="font-semibold text-lg">{item.title}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Artwork/Photography Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-8 font-playfair">
              {artist.slug === 'bryant-colman' ? 'Available Photography' : 'Available ArtWork'}
            </h2>
            
            <div className="text-center py-12 bg-brand-lightest rounded-2xl">
              <p className="text-brand-dark">
                {artist.slug === 'bryant-colman' 
                  ? 'Available photography coming soon.' 
                  : 'Available ArtWork coming soon.'}
              </p>
              <p className="text-sm text-brand-medium mt-4">
                Visit our <Link href="/shop" className="text-brand-dark hover:underline">shop</Link> to see available products.
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
