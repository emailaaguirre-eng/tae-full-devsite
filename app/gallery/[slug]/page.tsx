"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import galleryData from "@/content/gallery.json";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedImage from "@/components/ProtectedImage";

// Artwork Gallery Component
function ArtworkGallery({ artistSlug }: { artistSlug: string }) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/api/catalog/assets?artistSlug=${artistSlug}&active=true`)
      .then(res => {
        if (!res.ok) {
          console.error(`Assets API error: ${res.status} ${res.statusText}`);
          return [];
        }
        return res.json();
      })
      .then(data => {
        console.log(`[ArtworkGallery] Fetched ${Array.isArray(data) ? data.length : 0} assets for ${artistSlug}`);
        setAssets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch assets:', err);
        setAssets([]);
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
  
  if (assets.length === 0) {
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
        {assets.map((asset) => (
          <div key={asset.id} className="bg-brand-lightest rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
            <div className="relative w-full h-64 bg-gray-100">
              <Image
                src={asset.image}
                alt={asset.title}
                fill
                className="object-contain"
                unoptimized={asset.image?.includes('theartfulexperience.com')}
              />
            </div>
            <div className="p-4">
              {asset.title && !asset.title.toLowerCase().startsWith('untitled') && (
                <h3 className="text-lg font-semibold text-brand-darkest mb-2">{asset.title}</h3>
              )}
              {asset.description && (
                <p className="text-sm text-brand-dark mb-4 line-clamp-2">{asset.description}</p>
              )}
              <div className="flex flex-col gap-2">
                {asset.isForSaleAsPrint && (
                  <Link
                    href={`/shop/print?asset=${asset.slug}`}
                    className="w-full px-4 py-2 bg-brand-darkest text-white rounded-lg text-center font-semibold hover:bg-brand-dark transition-colors"
                  >
                    Buy Print {asset.printPrice && `$${asset.printPrice.toFixed(2)}`}
                  </Link>
                )}
                {asset.isAllowedInPremiumLibrary && (
                  <Link
                    href={`/library/premium?select=${asset.id}`}
                    className="w-full px-4 py-2 bg-brand-medium text-white rounded-lg text-center font-semibold hover:bg-brand-dark transition-colors"
                  >
                    Use on a Card
                    {asset.premiumFee && asset.premiumFee > 0 && (
                      <span className="text-xs block mt-1">+${asset.premiumFee.toFixed(2)}</span>
                    )}
                  </Link>
                )}
              </div>
            </div>
          </div>
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
