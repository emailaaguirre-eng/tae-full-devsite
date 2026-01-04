"use client";

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface GelatoVariant {
  uid: string;
  name: string;
  dimensions?: {
    width: number;
    height: number;
    unit: 'mm' | 'cm' | 'in';
  };
  trimMm?: {
    w: number;
    h: number;
  };
  attributes?: Record<string, string>;
}

interface GelatoProduct {
  uid: string;
  name: string;
  catalogUid?: string;
  variants: GelatoVariant[];
}

interface SizePickerProps {
  productSlug: string;
  selectedVariantUid?: string;
  onVariantSelect: (variant: { uid: string; productUid: string; trimMm: { w: number; h: number } }) => void;
  disabled?: boolean;
}

/**
 * Size Picker Component
 * SPRINT 2: Populates sizes from Gelato catalog
 */
export default function SizePicker({
  productSlug,
  selectedVariantUid,
  onVariantSelect,
  disabled = false,
}: SizePickerProps) {
  const [products, setProducts] = useState<GelatoProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Map our product slugs to Gelato categories
  const categoryMap: Record<string, string> = {
    'card': 'card',
    'postcard': 'postcard',
    'invitation': 'invitation',
    'announcement': 'announcement',
    'print': 'print',
    'wall-art': 'wall-art',
  };
  
  const category = categoryMap[productSlug] || productSlug;
  
  useEffect(() => {
    // Fetch products from Gelato catalog
    setLoading(true);
    setError(null);
    
    fetch(`/api/gelato/products/search?category=${category}&limit=200`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
          setProducts([]);
        } else {
          setProducts(data.products || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching Gelato products:', err);
        setError('Failed to load product sizes');
        setProducts([]);
        setLoading(false);
      });
  }, [category]);
  
  // Collect all variants from all products
  const allVariants: Array<{ variant: GelatoVariant; productUid: string; productName: string }> = [];
  for (const product of products) {
    for (const variant of product.variants || []) {
      if (variant.trimMm) {
        allVariants.push({
          variant,
          productUid: product.uid,
          productName: product.name,
        });
      }
    }
  }
  
  // Sort variants by size (smallest to largest)
  allVariants.sort((a, b) => {
    const areaA = (a.variant.trimMm?.w || 0) * (a.variant.trimMm?.h || 0);
    const areaB = (b.variant.trimMm?.w || 0) * (b.variant.trimMm?.h || 0);
    return areaA - areaB;
  });
  
  const handleVariantClick = (variant: GelatoVariant, productUid: string) => {
    if (disabled || !variant.trimMm) return;
    
    onVariantSelect({
      uid: variant.uid,
      productUid,
      trimMm: variant.trimMm,
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 p-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading sizes from Gelato...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-sm text-red-600 p-4 bg-red-50 rounded border border-red-200">
        <p className="font-medium">Error loading sizes</p>
        <p className="text-xs mt-1">{error}</p>
        <p className="text-xs mt-2 text-gray-600">
          Make sure the Gelato catalog is cached: <code className="bg-gray-100 px-1 rounded">npm run refresh-catalog</code>
        </p>
      </div>
    );
  }
  
  if (allVariants.length === 0) {
    return (
      <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded border border-gray-200">
        <p>No sizes available for this product category.</p>
        <p className="text-xs mt-2">
          Try refreshing the catalog: <code className="bg-gray-100 px-1 rounded">npm run refresh-catalog</code>
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-700 mb-2">
        Select Size ({allVariants.length} available)
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {allVariants.map(({ variant, productUid, productName }) => {
          const isSelected = variant.uid === selectedVariantUid;
          const trimMm = variant.trimMm;
          const sizeLabel = trimMm
            ? `${(trimMm.w / 25.4).toFixed(1)}" × ${(trimMm.h / 25.4).toFixed(1)}"`
            : variant.name;
          
          return (
            <button
              key={variant.uid}
              onClick={() => handleVariantClick(variant, productUid)}
              disabled={disabled || !trimMm}
              className={`
                p-3 rounded border text-left transition-colors
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="text-sm font-medium">{sizeLabel}</div>
              {variant.name && variant.name !== sizeLabel && (
                <div className="text-xs text-gray-500 mt-1">{variant.name}</div>
              )}
              {trimMm && (
                <div className="text-xs text-gray-400 mt-1">
                  {trimMm.w.toFixed(0)} × {trimMm.h.toFixed(0)} mm
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

