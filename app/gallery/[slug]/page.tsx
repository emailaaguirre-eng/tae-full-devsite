"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useState, useEffect } from "react";
import galleryData from "@/content/gallery.json";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

interface ArtistPageProps {
  params: Promise<{ slug: string }>;
}

export default function ArtistPage({ params }: ArtistPageProps) {
  const { slug } = use(params);
  const { artists } = galleryData;
  const typedArtists = artists as Artist[];
  const artist = typedArtists.find((a) => a.slug === slug);

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

  useEffect(() => {
    if (!artist) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=100');
        if (response.ok) {
          const data = await response.json();
          // Filter products that might be related to this artist
          // For Deanna Lankin, show "first light" and "facing the storm"
          const filteredProducts = data.filter((product: any) => {
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
  }, [artist]);

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
                />
              </div>
              
              {/* Artist Bio */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <h1 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-4 font-playfair">
                  {artist.name}
                </h1>
                <div className="mb-4">
                  <span className="text-sm uppercase tracking-wide text-brand-medium font-semibold">
                    {artist.title}
                  </span>
                </div>
                <p className="text-lg text-brand-darkest leading-relaxed mb-4">
                  {artist.bio}
                </p>
                {artist.description && (
                  <p className="text-base text-brand-dark leading-relaxed">
                    {artist.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Portfolio/Gallery Section */}
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-darkest mb-8 font-playfair">
              Portfolio & Gallery
            </h2>
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-brand-dark">Loading artwork...</p>
              </div>
            ) : wooProducts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wooProducts.map((product) => {
                  const productImage = product.images && product.images.length > 0 
                    ? product.images[0].src 
                    : 'https://dredev.theartfulexperience.com/wp-content/uploads/2025/06/IMG_8704-e1751264048493.jpg';
                  const price = product.price || '0.00';
                  
                  return (
                    <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group">
                      <div className="relative aspect-square overflow-hidden bg-gray-50">
                        <Image
                          src={productImage}
                          alt={product.name}
                          fill
                          className="object-contain group-hover:scale-110 transition-transform duration-500"
                          style={{ objectPosition: 'center' }}
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-brand-darkest mb-2">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-lg font-bold text-brand-medium">
                            ${price}
                          </span>
                        </div>
                        <a 
                          href={product.permalink || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full bg-brand-medium text-white px-6 py-3 rounded-full font-semibold hover:bg-brand-dark transition-all text-center"
                        >
                          {product.permalink ? 'View Details' : 'Portfolio Piece'}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl">
                <p className="text-brand-dark">Portfolio pieces coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
