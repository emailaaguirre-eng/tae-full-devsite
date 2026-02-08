"use client";

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ProductVariant {
  id: string;
  name: string;
  sizeLabel?: string;
  printWidth?: number;
  printHeight?: number;
  printDpi?: number;
  printfulVariantId?: number;
  printfulProductId?: number;
  printfulBasePrice?: number;
}

interface SizePickerProps {
  productSlug: string;
  selectedVariantId?: number;
  onVariantSelect: (variant: { id: number; productId: number; trimMm: { w: number; h: number } }) => void;
  disabled?: boolean;
}

/**
 * Size Picker Component
 * Populates sizes from local product catalog (Printful-backed)
 */
export default function SizePicker({
  productSlug,
  selectedVariantId,
  onVariantSelect,
  disabled = false,
}: SizePickerProps) {
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch products from local store for this product category
    setLoading(true);
    setError(null);

    fetch(`/api/shop/products?category=${productSlug}&active=true`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
          setProducts([]);
        } else {
          // Filter to only products that have print dimensions
          const withDimensions = (data.products || data || []).filter(
            (p: ProductVariant) => p.printWidth && p.printHeight && p.printDpi && p.printfulVariantId
          );
          setProducts(withDimensions);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching products:', err);
        setError('Failed to load product sizes');
        setProducts([]);
        setLoading(false);
      });
  }, [productSlug]);

  const handleProductClick = (product: ProductVariant) => {
    if (disabled || !product.printWidth || !product.printHeight || !product.printDpi || !product.printfulVariantId) return;

    // Convert px dimensions to mm
    const wMm = (product.printWidth / product.printDpi) * 25.4;
    const hMm = (product.printHeight / product.printDpi) * 25.4;

    onVariantSelect({
      id: product.printfulVariantId,
      productId: product.printfulProductId || 0,
      trimMm: { w: wMm, h: hMm },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 p-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading sizes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 p-4 bg-red-50 rounded border border-red-200">
        <p className="font-medium">Error loading sizes</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded border border-gray-200">
        <p>No sizes available for this product category.</p>
        <p className="text-xs mt-2 text-gray-500">
          Products need print dimensions configured in the admin panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-700 mb-2">
        Select Size ({products.length} available)
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {products.map((product) => {
          const isSelected = product.printfulVariantId === selectedVariantId;
          const wMm = product.printWidth && product.printDpi
            ? (product.printWidth / product.printDpi) * 25.4
            : null;
          const hMm = product.printHeight && product.printDpi
            ? (product.printHeight / product.printDpi) * 25.4
            : null;
          const sizeLabel = wMm && hMm
            ? `${(wMm / 25.4).toFixed(1)}" × ${(hMm / 25.4).toFixed(1)}"`
            : product.sizeLabel || product.name;

          return (
            <button
              key={product.id}
              onClick={() => handleProductClick(product)}
              disabled={disabled}
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
              {product.name !== sizeLabel && (
                <div className="text-xs text-gray-500 mt-1">{product.name}</div>
              )}
              {wMm && hMm && (
                <div className="text-xs text-gray-400 mt-1">
                  {wMm.toFixed(0)} × {hMm.toFixed(0)} mm
                </div>
              )}
              {product.printfulBasePrice != null && product.printfulBasePrice > 0 && (
                <div className="text-xs text-green-600 mt-1 font-medium">
                  ${product.printfulBasePrice.toFixed(2)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
