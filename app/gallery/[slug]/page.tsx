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

  // Fetch products from WooCommerce for this artist
  // Hooks must be called before any conditional returns
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
    if (!artist) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        // Fetch all products (we'll filter by artist association client-side)
        const response = await fetch('/api/products?limit=100');
        if (response.ok) {
          const data = await response.json();
          
          // Filter products by artist association
          // WooCommerce products should have a category, tag, or meta field matching the artist
          const artistNameLower = artist.name.toLowerCase();
          const artistSlugLower = artist.slug.toLowerCase();
          
          const filteredProducts = data.filter((product: any) => {
            // Method 1: Check product categories (WooCommerce categories should match artist slug)
            // Categories can be objects with id, name, slug, or just IDs
            const categories = product.categories || [];
            const categoryMatch = categories.some((cat: any) => {
              if (typeof cat === 'object') {
                return cat.slug?.toLowerCase() === artistSlugLower || 
                       cat.name?.toLowerCase() === artistNameLower ||
                       cat.name?.toLowerCase().includes(artistNameLower.split(' ')[0]); // First name match
              }
              return false;
            });
            
            // Method 2: Check product tags
            const tags = product.tags || [];
            const tagMatch = tags.some((tag: any) => {
              if (typeof tag === 'object') {
                return tag.slug?.toLowerCase() === artistSlugLower || 
                       tag.name?.toLowerCase() === artistNameLower ||
                       tag.name?.toLowerCase().includes(artistNameLower.split(' ')[0]);
              }
              return false;
            });
            
            // Method 3: Check custom meta fields (if you add _artist_slug or _artist_name meta in WooCommerce)
            const metaData = product.meta_data || [];
            const metaMatch = metaData.some((meta: any) => 
              (meta.key === '_artist_slug' && String(meta.value).toLowerCase() === artistSlugLower) ||
              (meta.key === '_artist_name' && String(meta.value).toLowerCase() === artistNameLower) ||
              (meta.key === 'artist' && String(meta.value).toLowerCase() === artistSlugLower)
            );
            
            // Method 4: Fallback - check product name (only for Deanna Lankin as temporary measure)
            // Remove this once products are properly categorized in WooCommerce
            const nameMatch = artist.slug === 'deanna-lankin' && (
              product.name?.toLowerCase().includes('first light') || 
              product.name?.toLowerCase().includes('facing the storm')
            );
            
            return categoryMatch || tagMatch || metaMatch || nameMatch;
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
  }, [artist]);

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

<<<<<<< HEAD
          {/* Available Artwork/Photography Section */}
=======
          {/* Bio Image for Bryant */}
          {artist.bioImage && (
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
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
            </div>
          )}

          {/* Available ArtWork/Photography Section */}
>>>>>>> 898d29324028a1208ee4becfd760c10d81359467
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-8 font-playfair">
              {artist.slug === 'bryant-colman' ? 'Available Photography' : 'Available ArtWork'}
            </h2>
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-brand-dark">Loading {artist.slug === 'bryant-colman' ? 'photography' : 'ArtWork'}...</p>
              </div>
            ) : wooProducts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wooProducts.map((product) => {
                  const productImage = product.images && product.images.length > 0 
                    ? product.images[0].src 
                    : 'https://dredev.theartfulexperience.com/wp-content/uploads/2025/06/IMG_8704-e1751264048493.jpg';
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
                  {artist.slug === 'bryant-colman' 
                    ? 'Available photography coming soon.' 
                    : 'Available ArtWork coming soon.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
