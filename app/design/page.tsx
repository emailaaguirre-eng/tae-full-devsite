'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import for the polished Design Studio
const DesignStudio = dynamic(() => import('@/components/DesignStudio'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f3f3f3' }}>
      <div className="text-center">
        <div 
          className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-4"
          style={{ borderColor: '#000000', borderTopColor: 'transparent' }}
        ></div>
        <p className="text-lg" style={{ color: '#000000', fontFamily: 'Georgia, serif' }}>
          Loading Design Studio...
        </p>
      </div>
    </div>
  ),
});

// Product presets - these should come from database in production
const PRODUCT_SPECS: Record<string, { id: string; name: string; widthMm: number; heightMm: number; category: string; requiresQR?: boolean }> = {
  'card-5x7': { id: 'card-5x7', name: 'Greeting Card 5×7', widthMm: 127, heightMm: 178, category: 'cards', requiresQR: true },
  'card-4x6': { id: 'card-4x6', name: 'Card 4×6', widthMm: 102, heightMm: 152, category: 'cards', requiresQR: true },
  'postcard-4x6': { id: 'postcard-4x6', name: 'Postcard 4×6', widthMm: 102, heightMm: 152, category: 'postcards', requiresQR: true },
  'invitation-5x7': { id: 'invitation-5x7', name: 'Invitation 5×7', widthMm: 127, heightMm: 178, category: 'invitations', requiresQR: true },
  'announcement-5x7': { id: 'announcement-5x7', name: 'Announcement 5×7', widthMm: 127, heightMm: 178, category: 'announcements', requiresQR: true },
  'print-8x10': { id: 'print-8x10', name: 'Art Print 8×10', widthMm: 203, heightMm: 254, category: 'prints' },
  'print-11x14': { id: 'print-11x14', name: 'Art Print 11×14', widthMm: 279, heightMm: 356, category: 'prints' },
  'canvas-16x20': { id: 'canvas-16x20', name: 'Canvas 16×20', widthMm: 406, heightMm: 508, category: 'canvas' },
};

function DesignPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get product from URL params, default to 5x7 card
  const productId = searchParams.get('product') || 'card-5x7';
  const product = PRODUCT_SPECS[productId] || PRODUCT_SPECS['card-5x7'];

  return (
    <DesignStudio
      product={product}
      onComplete={(designData) => {
        console.log('Design complete:', designData);
        
        // Store design data in sessionStorage for the ArtKey editor
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('designData', JSON.stringify({
            imageDataUrl: designData.imageDataUrl,
            dimensions: designData.dimensions,
            dpi: designData.dpi,
            productId: designData.productId,
            productName: designData.productName,
          }));
        }
        
        // Navigate to ArtKey editor with product context
        const params = new URLSearchParams();
        params.set('product_id', product.id);
        params.set('product_name', product.name);
        params.set('from_design', 'true');
        if (product.requiresQR) {
          params.set('requires_qr', 'true');
        }
        
        router.push(`/art-key/editor?${params.toString()}`);
      }}
      onBack={() => {
        router.push('/shop');
      }}
      onClose={() => {
        if (confirm('Close designer? Unsaved changes will be lost.')) {
          router.push('/shop');
        }
      }}
    />
  );
}

export default function DesignPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f3f3f3' }}>
        <div className="text-center">
          <div 
            className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-4"
            style={{ borderColor: '#000000', borderTopColor: 'transparent' }}
          ></div>
          <p className="text-lg" style={{ color: '#000000', fontFamily: 'Georgia, serif' }}>
            Loading...
          </p>
        </div>
      </div>
    }>
      <DesignPageContent />
    </Suspense>
  );
}
