"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import galleryData from "@/content/gallery.json";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedImage from "@/components/ProtectedImage";

// Single Artwork Card Component
function ArtworkCard({ artwork }: { artwork: any }) {
  const [showOptions, setShowOptions] = useState(false);
  const hasOptions = artwork.forSale && artwork.productOptions?.length > 0;

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
      {/* Clickable Image */}
      <div
        className={`relative w-full aspect-square bg-gray-100 ${hasOptions ? 'cursor-pointer' : ''}`}
        onClick={() => hasOptions && setShowOptions(!showOptions)}
      >
        <Image
          src={artwork.imageUrl}
          alt={artwork.title || 'Artwork'}
          fill
          className="object-cover"
          unoptimized={artwork.imageUrl?.includes('theartfulexperience.com')}
        />
        {/* Hover overlay hint */}
        {hasOptions && !showOptions && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <span className="bg-white/90 px-4 py-2 rounded-lg text-sm font-medium text-brand-darkest">
              Click for options
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Title - only show if not "Untitled" */}
        {artwork.title && !artwork.title.toLowerCase().startsWith('untitled') && (
          <h3 className="text-lg font-semibold text-brand-darkest">{artwork.title}</h3>
        )}

        {/* Product Options - revealed on image click */}
        {showOptions && hasOptions && (
          <div className="mt-3">
            <p className="text-sm font-medium text-brand-darkest mb-2">Available Options:</p>
            <div className="space-y-2">
              {artwork.productOptions.map((option: any) => (
                <Link
                  key={option.categoryId}
                  href={`/shop/artwork/${artwork.slug}?category=${option.categorySlug}`}
                  className="w-full px-4 py-2 border border-brand-dark text-brand-darkest rounded-lg font-medium hover:bg-brand-lightest transition-colors text-sm flex justify-between items-center"
                >
                  <span>{option.categoryName}</span>
                  <span className="text-brand-medium">from ${option.pricing.estimatedPrice}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Artwork Gallery Component
function ArtworkGallery({ artistSlug }: { artistSlug: string }) {
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/gallery/artists/${artistSlug}`)
      .then(res => {
        if (!res.ok) {
          console.error(`Gallery API error: ${res.status} ${res.statusText}`);
          return { success: false };
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.data?.artworks) {
          console.log(`[ArtworkGallery] Fetched ${data.data.artworks.length} artworks for ${artistSlug}`);
          setArtworks(data.data.artworks);
        } else {
          setArtworks([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch artworks:', err);
        setArtworks([]);
        setLoading(false);
      });
  }, [artistSlug]);
  
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-8 font-playfair">
          {artistSlug === 'bryant-colman' ? 'Available Photography' : 'Available ArtWork'}
        </h2>
        <div className="text-center py-12">
          <p className="text-brand-dark">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (artworks.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-8 font-playfair">
          {artistSlug === 'bryant-colman' ? 'Available Photography' : 'Available ArtWork'}
        </h2>
        <div className="text-center py-12 bg-brand-lightest rounded-2xl">
          <p className="text-brand-dark">
            {artistSlug === 'bryant-colman'
              ? 'Available photography coming soon.'
              : 'Available ArtWork coming soon.'}
          </p>
          <p className="text-sm text-brand-medium mt-4">
            Visit our <Link href="/shop" className="text-brand-dark hover:underline">shop</Link> to see available products.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
      <h2 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-8 font-playfair">
        {artistSlug === 'bryant-colman' ? 'Available Photography' : 'Available ArtWork'}
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artworks.map((artwork) => (
          <ArtworkCard key={artwork.id} artwork={artwork} />
        ))}
      </div>
    </div>
  );
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

          {/* Available Artwork/Photography Section */}
          <ArtworkGallery artistSlug={artist.slug} />
        </div>
      </section>
      <Footer />
    </main>
  );
}
