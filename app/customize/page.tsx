"use client";

/**
 * Customize Page
 * Redirects to ArtKey editor with product context
 * This page acts as a bridge between product selection and the editor
 */

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function CustomizePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Get product parameters from URL
    const productId = searchParams.get('product_id');
    const productName = searchParams.get('product_name');
    const price = searchParams.get('price');
    const productType = searchParams.get('product_type');

    // Build editor URL with all parameters
    const params = new URLSearchParams();
    if (productId) params.set('product_id', productId);
    if (productName) params.set('product_name', productName);
    if (price) params.set('price', price);
    if (productType) params.set('product_type', productType);
    params.set('from_customize', 'true');

    // Redirect to editor
    router.push(`/art-key/editor?${params.toString()}`);
  }, [searchParams, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-lightest">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-brand-dark border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-brand-dark text-lg">Loading editor...</p>
      </div>
    </div>
  );
}

