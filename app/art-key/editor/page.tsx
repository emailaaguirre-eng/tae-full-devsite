"use client";

import { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const ArtKeyEditor = dynamic(
  () => import('@/components/ArtKeyEditor'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-brand-lightest">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-brand-dark border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-brand-dark text-lg">Loading ArtKey Editor...</p>
        </div>
      </div>
    )
  }
);

function ArtKeyEditorContent() {
  // Prevent search engines from indexing ArtKey editor URLs
  useEffect(() => {
    // Add noindex meta tag
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow, noarchive, nosnippet, noimageindex';
    document.head.appendChild(metaRobots);
    
    return () => {
      if (document.head.contains(metaRobots)) {
        document.head.removeChild(metaRobots);
      }
    };
  }, []);

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-brand-lightest">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-brand-dark border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-brand-dark text-lg">Loading editor...</p>
        </div>
      </div>
    }>
      <ArtKeyEditor />
    </Suspense>
  );
}

export default function ArtKeyEditorPage() {
  return <ArtKeyEditorContent />;
}
