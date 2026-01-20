"use client";

/**
 * Artwork Purchase Page
 *
 * Shows a specific artwork with product options (sizes, materials, frames, prices).
 * URL: /shop/artwork/[slug]?category=wall-art
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Artwork {
  id: string;
  taeId: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string;
  forSale: boolean;
  productOptions: Array<{
    categoryId: string;
    categorySlug: string;
    categoryName: string;
    pricing: {
      artistRoyalty: number;
    };
  }>;
}

interface Artist {
  id: string;
  name: string;
  slug: string;
  royaltyFee: number;
}

interface SizeOption {
  size: string;
  sizeLabel: string;
  widthInches: number | null;
  heightInches: number | null;
  basePrice: number;
  taeBaseFee: number;
  totalPrice: number;
  variants: Array<{
    gelatoProductUid: string;
    paperType: string | null;
    frameColor: string | null;
    price: number;
  }>;
}

interface ProductOptions {
  success: boolean;
  source: string;
  category: {
    slug: string;
    name: string;
    taeBaseFee: number;
  };
  sizes: SizeOption[];
  frameColors: string[];
  paperTypes: string[];
}

export default function ArtworkPurchasePage({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [slug, setSlug] = useState<string | null>(null);
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [productOptions, setProductOptions] = useState<ProductOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'wall-art');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedFrameColor, setSelectedFrameColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Resolve params
  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  // Fetch artwork data
  useEffect(() => {
    if (!slug) return;

    async function fetchArtwork() {
      try {
        // Find artwork by slug - need to search through all artists
        const artistsRes = await fetch('/api/gallery/artists');
        const artistsData = await artistsRes.json();

        if (!artistsData.success) {
          setError('Failed to load artists');
          setLoading(false);
          return;
        }

        // Find the artwork across all artists
        let found = false;
        for (const artistSummary of artistsData.data) {
          const artistRes = await fetch(`/api/gallery/artists/${artistSummary.slug}`);
          const artistData = await artistRes.json();

          if (artistData.success) {
            const foundArtwork = artistData.data.artworks.find((a: Artwork) => a.slug === slug);
            if (foundArtwork) {
              setArtwork(foundArtwork);
              setArtist({
                id: artistData.data.id,
                name: artistData.data.name,
                slug: artistData.data.slug,
                royaltyFee: artistData.data.royaltyFee,
              });
              found = true;
              break;
            }
          }
        }

        if (!found) {
          setError('Artwork not found');
        }
      } catch (err) {
        setError('Failed to load artwork');
      } finally {
        setLoading(false);
      }
    }

    fetchArtwork();
  }, [slug]);

  // Fetch product options when category changes
  useEffect(() => {
    if (!selectedCategory) return;

    async function fetchOptions() {
      try {
        const res = await fetch(`/api/shop/product-options?category=${selectedCategory}`);
        const data = await res.json();

        if (data.success) {
          setProductOptions(data);
          // Auto-select first size
          if (data.sizes?.length > 0 && !selectedSize) {
            setSelectedSize(data.sizes[0].size);
          }
          // Auto-select first frame color for framed prints
          if (selectedCategory === 'framed-prints' && data.frameColors?.length > 0) {
            setSelectedFrameColor(data.frameColors[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch product options:', err);
      }
    }

    fetchOptions();
  }, [selectedCategory]);

  // Calculate total price
  const calculatePrice = () => {
    if (!productOptions || !selectedSize || !artist) return null;

    const sizeOption = productOptions.sizes.find(s => s.size === selectedSize);
    if (!sizeOption) return null;

    const gelatoPrice = sizeOption.basePrice;
    const taeFee = sizeOption.taeBaseFee;
    const artistRoyalty = artist.royaltyFee;

    return {
      gelatoPrice,
      taeFee,
      artistRoyalty,
      total: gelatoPrice + taeFee + artistRoyalty,
    };
  };

  const pricing = calculatePrice();

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-lightest">
        <Navbar />
        <div className="py-20 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-brand-dark border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !artwork) {
    return (
      <main className="min-h-screen bg-brand-lightest">
        <Navbar />
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-brand-darkest mb-4">Artwork Not Found</h1>
          <p className="text-brand-dark mb-6">{error || 'The artwork you are looking for does not exist.'}</p>
          <Link href="/gallery" className="text-brand-dark hover:underline">
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

      <section className="py-12" style={{ backgroundColor: '#ecece9' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          {artist && (
            <Link
              href={`/gallery/${artist.slug}`}
              className="inline-flex items-center text-brand-dark hover:text-brand-darkest mb-6 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to {artist.name}'s Gallery
            </Link>
          )}

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Artwork Image */}
              <div className="relative aspect-square bg-gray-100">
                <Image
                  src={artwork.imageUrl}
                  alt={artwork.title || 'Artwork'}
                  fill
                  className="object-contain p-4"
                  unoptimized={artwork.imageUrl?.includes('theartfulexperience.com')}
                />
              </div>

              {/* Purchase Options */}
              <div className="p-8 md:p-10">
                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-brand-darkest mb-2 font-playfair">
                  {artwork.title || 'Untitled'}
                </h1>
                {artist && (
                  <p className="text-brand-medium mb-6">
                    by <Link href={`/gallery/${artist.slug}`} className="hover:underline">{artist.name}</Link>
                  </p>
                )}

                {/* Product Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-brand-darkest mb-2">Product Type</label>
                  <div className="flex flex-wrap gap-2">
                    {artwork.productOptions.map(option => (
                      <button
                        key={option.categorySlug}
                        onClick={() => {
                          setSelectedCategory(option.categorySlug);
                          setSelectedSize(null);
                          setSelectedFrameColor(null);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedCategory === option.categorySlug
                            ? 'bg-brand-darkest text-white'
                            : 'bg-brand-lightest text-brand-darkest hover:bg-brand-light'
                        }`}
                      >
                        {option.categoryName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                {productOptions && productOptions.sizes.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-brand-darkest mb-2">Size</label>
                    <div className="grid grid-cols-2 gap-2">
                      {productOptions.sizes.map(size => (
                        <button
                          key={size.size}
                          onClick={() => setSelectedSize(size.size)}
                          className={`px-4 py-3 rounded-lg text-left transition-colors ${
                            selectedSize === size.size
                              ? 'bg-brand-darkest text-white'
                              : 'bg-brand-lightest text-brand-darkest hover:bg-brand-light'
                          }`}
                        >
                          <span className="font-medium">{size.sizeLabel}</span>
                          <span className="block text-sm opacity-75">
                            from ${(size.basePrice + size.taeBaseFee + (artist?.royaltyFee || 0)).toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Frame Color Selection (for framed prints) */}
                {selectedCategory === 'framed-prints' && productOptions?.frameColors && productOptions.frameColors.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-brand-darkest mb-2">Frame Color</label>
                    <div className="flex flex-wrap gap-2">
                      {productOptions.frameColors.map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedFrameColor(color)}
                          className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                            selectedFrameColor === color
                              ? 'bg-brand-darkest text-white'
                              : 'bg-brand-lightest text-brand-darkest hover:bg-brand-light'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-brand-darkest mb-2">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-brand-lightest hover:bg-brand-light flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="text-lg font-medium w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg bg-brand-lightest hover:bg-brand-light flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Price Breakdown */}
                {pricing && (
                  <div className="border-t border-brand-light pt-6 mb-6">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-brand-medium">Print cost</span>
                        <span>${pricing.gelatoPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-medium">Platform fee</span>
                        <span>${pricing.taeFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-medium">Artist royalty</span>
                        <span>${pricing.artistRoyalty.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-brand-light">
                        <span>Total</span>
                        <span>${(pricing.total * quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  disabled={!selectedSize || (selectedCategory === 'framed-prints' && !selectedFrameColor)}
                  className="w-full py-4 bg-brand-darkest text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Cart
                </button>

                {/* Source indicator (for debugging) */}
                {productOptions && (
                  <p className="text-xs text-brand-medium mt-4 text-center">
                    Prices from {productOptions.source === 'cache' ? 'local cache' : 'fallback data'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
