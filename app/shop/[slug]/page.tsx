'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  icon: string;
  heroImage: string | null;
  basePrice: number;
  allowedFormats: string[] | null;
  allowedPapers: string[] | null;
  allowedCoatings: string[] | null;
  allowedFoils: string[] | null;
  defaultBleedMm: number;
  defaultSafeMm: number;
  defaultDpi: number;
  gelatoCatalog: {
    catalogUid: string;
    title: string;
    attributes: any[];
  } | null;
}

interface GelatoProduct {
  productUid: string;
  paperFormat: string;
  paperType: string;
  colorType: string;
  orientation: string;
  coatingType: string;
  foldingType: string;
  spotFinishing: string;
  widthMm: number;
  heightMm: number;
}

// Human-readable names for paper formats
const FORMAT_NAMES: Record<string, string> = {
  '5R': '5" × 7"',
  'A5': 'A5 (5.8" × 8.3")',
  'A6': 'A6 (4.1" × 5.8")',
  'SM': '4.25" × 5.5"',
  'SQ148X148': 'Square (5.8" × 5.8")',
  'DL': 'DL (3.9" × 8.3")',
  '8X10': '8" × 10"',
  '11X14': '11" × 14"',
  '12X12': '12" × 12"',
  '16X20': '16" × 20"',
  '18X24': '18" × 24"',
  '24X36': '24" × 36"',
};

// Human-readable names for orientations
const ORIENTATION_NAMES: Record<string, string> = {
  'hor': 'Landscape',
  'ver': 'Portrait',
};

// Human-readable names for paper types
const PAPER_NAMES: Record<string, string> = {
  '100-lb-cover-coated-silk': 'Silk (Coated)',
  '110-lb-cover-coated-silk': 'Premium Silk',
  '130-lb-cover-coated-silk': 'Heavy Silk',
  '100-lb-cover-uncoated': 'Matte (Uncoated)',
  '110-lb-cover-uncoated': 'Premium Matte',
  '130-lb-cover-uncoated': 'Heavy Matte',
  '300-gsm-coated-silk': '300gsm Silk',
  '350-gsm-coated-silk': '350gsm Silk',
  '300-gsm-uncoated': '300gsm Matte',
  '350-gsm-uncoated': '350gsm Matte',
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [availableProducts, setAvailableProducts] = useState<GelatoProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedOrientation, setSelectedOrientation] = useState<string>('');
  const [selectedPaper, setSelectedPaper] = useState<string>('');

  // Fetch product and Gelato options
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch store product
        const productRes = await fetch(`/api/shop/products/${slug}`);
        const productData = await productRes.json();
        
        if (!productData.success) {
          setError('Product not found');
          setLoading(false);
          return;
        }
        
        setProduct(productData.data);
        
        // Fetch available Gelato products for this catalog
        if (productData.data.gelatoCatalog?.catalogUid) {
          const gelatoRes = await fetch(
            `/api/shop/gelato-products?catalog=${productData.data.gelatoCatalog.catalogUid}`
          );
          const gelatoData = await gelatoRes.json();
          
          if (gelatoData.success) {
            setAvailableProducts(gelatoData.data);
            
            // Set first valid combination as default
            if (gelatoData.data.length > 0) {
              const firstProduct = gelatoData.data[0];
              setSelectedFormat(firstProduct.paperFormat || '');
              setSelectedOrientation(firstProduct.orientation || '');
              setSelectedPaper(firstProduct.paperType || '');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [slug]);

  // Dynamically compute available options based on current selection
  const availableFormats = [...new Set(availableProducts.map(p => p.paperFormat))].filter(Boolean) as string[];
  
  // Filter orientations based on selected format
  const availableOrientations = [...new Set(
    availableProducts
      .filter(p => !selectedFormat || p.paperFormat === selectedFormat)
      .map(p => p.orientation)
  )].filter(Boolean) as string[];
  
  // Filter papers based on selected format AND orientation
  const availablePapers = [...new Set(
    availableProducts
      .filter(p => 
        (!selectedFormat || p.paperFormat === selectedFormat) &&
        (!selectedOrientation || p.orientation === selectedOrientation)
      )
      .map(p => p.paperType)
  )].filter(Boolean) as string[];

  // Auto-select first valid option when selection becomes invalid
  useEffect(() => {
    if (selectedOrientation && !availableOrientations.includes(selectedOrientation) && availableOrientations.length > 0) {
      setSelectedOrientation(availableOrientations[0]);
    }
  }, [selectedFormat, availableOrientations, selectedOrientation]);

  useEffect(() => {
    if (selectedPaper && !availablePapers.includes(selectedPaper) && availablePapers.length > 0) {
      setSelectedPaper(availablePapers[0]);
    }
  }, [selectedFormat, selectedOrientation, availablePapers, selectedPaper]);

  // Find matching Gelato product
  const matchingProduct = availableProducts.find(
    (p) =>
      p.paperFormat === selectedFormat &&
      p.orientation === selectedOrientation &&
      p.paperType === selectedPaper
  );

  // Handle start designing
  const handleStartDesigning = () => {
    if (!matchingProduct) {
      alert('Please select a valid combination of options.');
      return;
    }
    
    // Navigate to editor with product UID
    router.push(`/editor/${product?.slug}?product=${matchingProduct.productUid}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-lightest">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-brand-dark"></div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-brand-lightest">
        <Navbar />
        <div className="pt-24 pb-16 text-center">
          <h1 className="text-2xl font-bold text-brand-darkest mb-4">Product Not Found</h1>
          <Link href="/shop" className="text-brand-medium hover:underline">
            ← Back to Shop
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link href="/shop" className="text-brand-medium hover:text-brand-dark">
              ← Back to Shop
            </Link>
          </nav>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Product Preview */}
            <div className="space-y-6">
              <div className="aspect-square bg-white shadow-lg flex items-center justify-center">
                {product.heroImage ? (
                  <img 
                    src={product.heroImage} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-9xl">{product.icon || '📦'}</span>
                )}
              </div>
              
              {/* Size Preview */}
              {matchingProduct && (
                <div className="bg-white p-4 shadow-sm border border-brand-light">
                  <h4 className="font-semibold text-brand-darkest mb-2">Selected Size</h4>
                  <p className="text-brand-medium">
                    {matchingProduct.widthMm}mm × {matchingProduct.heightMm}mm
                    {' '}({(matchingProduct.widthMm / 25.4).toFixed(1)}" × {(matchingProduct.heightMm / 25.4).toFixed(1)}")
                  </p>
                </div>
              )}
            </div>
            
            {/* Right: Product Options */}
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-brand-darkest mb-4 font-playfair">
                  {product.name}
                </h1>
                <p className="text-lg text-brand-medium">
                  {product.description}
                </p>
              </div>
              
              {/* Size Selection */}
              <div>
                <label className="block text-sm font-semibold text-brand-darkest mb-3">
                  Size
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableFormats.map((format) => (
                    <button
                      key={format}
                      onClick={() => setSelectedFormat(format)}
                      className={`py-3 px-4 border-2 transition-all ${
                        selectedFormat === format
                          ? 'border-brand-dark bg-brand-light text-brand-darkest'
                          : 'border-brand-light bg-white hover:border-brand-medium text-brand-darkest'
                      }`}
                    >
                      {FORMAT_NAMES[format] || format}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Orientation Selection */}
              <div>
                <label className="block text-sm font-semibold text-brand-darkest mb-3">
                  Orientation
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {availableOrientations.map((orientation) => (
                    <button
                      key={orientation}
                      onClick={() => setSelectedOrientation(orientation)}
                      className={`py-3 px-4 border-2 transition-all flex items-center justify-center gap-2 ${
                        selectedOrientation === orientation
                          ? 'border-brand-dark bg-brand-light text-brand-darkest'
                          : 'border-brand-light bg-white hover:border-brand-medium text-brand-darkest'
                      }`}
                    >
                      <span className={`w-6 h-8 border-2 border-current ${
                        orientation === 'hor' ? 'transform rotate-90' : ''
                      }`} />
                      {ORIENTATION_NAMES[orientation] || orientation}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Paper Selection */}
              <div>
                <label className="block text-sm font-semibold text-brand-darkest mb-3">
                  Paper Type
                </label>
                <div className="space-y-2">
                  {availablePapers.slice(0, 6).map((paper) => (
                    <button
                      key={paper}
                      onClick={() => setSelectedPaper(paper)}
                      className={`w-full py-3 px-4 border-2 transition-all text-left ${
                        selectedPaper === paper
                          ? 'border-brand-dark bg-brand-light text-brand-darkest'
                          : 'border-brand-light bg-white hover:border-brand-medium text-brand-darkest'
                      }`}
                    >
                      {PAPER_NAMES[paper] || paper.replace(/-/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Price and CTA */}
              <div className="bg-white p-6 shadow-lg border border-brand-light space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-brand-medium">Starting at</span>
                  <span className="text-3xl font-bold text-brand-darkest">
                    ${product.basePrice.toFixed(2)}
                  </span>
                </div>
                
                {!matchingProduct && (
                  <p className="text-sm text-brand-medium">
                    ⚠️ This combination is not available. Try different options.
                  </p>
                )}
                
                <button
                  onClick={handleStartDesigning}
                  disabled={!matchingProduct}
                  className={`w-full py-4 font-bold text-lg transition-all ${
                    matchingProduct
                      ? 'bg-brand-dark hover:bg-brand-medium text-white shadow-lg hover:shadow-xl'
                      : 'bg-brand-light text-brand-medium cursor-not-allowed'
                  }`}
                >
                  Start Designing →
                </button>
                
                <p className="text-center text-sm text-brand-medium">
                  Add an ArtKey™ to bring your design to life
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
