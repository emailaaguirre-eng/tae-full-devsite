"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface PremiumAsset {
  id: string;
  title: string;
  image: string;
  description?: string;
  slug: string;
  premiumFee: number;
  editRules: string;
  artist: {
    id: string;
    name: string;
    slug: string;
  };
  metadata?: string;
}

export default function PremiumLibraryPage() {
  const searchParams = useSearchParams();
  const selectAssetId = searchParams.get('select');
  const returnTo = searchParams.get('returnTo') || '/shop';
  
  const [assets, setAssets] = useState<PremiumAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<PremiumAsset | null>(null);
  
  useEffect(() => {
    fetch('/api/catalog/assets/premium')
      .then(res => res.json())
      .then(data => {
        setAssets(data || []);
        if (selectAssetId) {
          const asset = data.find((a: PremiumAsset) => a.id === selectAssetId);
          if (asset) {
            setSelectedAsset(asset);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch premium assets:', err);
        setLoading(false);
      });
  }, [selectAssetId]);
  
  const handleSelectAsset = (asset: PremiumAsset) => {
    setSelectedAsset(asset);
    // Store selected asset in sessionStorage for editor to pick up
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedPremiumAsset', JSON.stringify({
        id: asset.id,
        title: asset.title,
        image: asset.image,
        premiumFee: asset.premiumFee,
        editRules: asset.editRules,
      }));
      // Redirect back to editor or return URL
      window.location.href = returnTo;
    }
  };
  
  // Group assets by artist
  const assetsByArtist = assets.reduce((acc, asset) => {
    const artistName = asset.artist.name;
    if (!acc[artistName]) {
      acc[artistName] = [];
    }
    acc[artistName].push(asset);
    return acc;
  }, {} as Record<string, PremiumAsset[]>);
  
  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <Link
              href="/shop"
              className="inline-flex items-center text-brand-dark hover:text-brand-darkest mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Shop
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-brand-darkest mb-4 font-playfair">
              Premium Library
            </h1>
            <p className="text-lg text-brand-dark">
              Choose from our curated collection of premium artwork to use in your customizable products.
              Each selection adds a licensing fee to your order.
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-brand-dark">Loading premium assets...</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <p className="text-brand-dark">No premium assets available at this time.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(assetsByArtist).map(([artistName, artistAssets]) => (
                <div key={artistName} className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-brand-darkest mb-6 font-playfair">
                    {artistName}
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {artistAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className={`bg-brand-lightest rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer ${
                          selectedAsset?.id === asset.id ? 'ring-4 ring-brand-darkest' : ''
                        }`}
                        onClick={() => handleSelectAsset(asset)}
                      >
                        <div className="relative w-full h-48 bg-gray-100">
                          <Image
                            src={asset.image}
                            alt={asset.title}
                            fill
                            className="object-contain"
                            unoptimized={asset.image?.includes('theartfulexperience.com')}
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-brand-darkest mb-2">
                            {asset.title}
                          </h3>
                          {asset.description && (
                            <p className="text-sm text-brand-dark mb-3 line-clamp-2">
                              {asset.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-brand-medium">
                              {asset.editRules === 'crop_and_position_only' 
                                ? 'Crop & Position Only' 
                                : 'Full Edit'}
                            </span>
                            <span className="text-lg font-bold text-brand-darkest">
                              +${asset.premiumFee.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}

