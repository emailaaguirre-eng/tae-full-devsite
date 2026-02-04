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

function ArtKeyEditorContent({ token }: { token: string }) {
  // Prevent search engines from indexing ArtKey editor URLs
  useEffect(() => {
    // Add noindex meta tag
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow, noarchive, nosnippet, noimageindex';
    document.head.appendChild(metaRobots);
    
    // Add X-Robots-Tag via link rel
    const linkRobots = document.createElement('link');
    linkRobots.rel = 'canonical';
    linkRobots.href = window.location.href;
    document.head.appendChild(linkRobots);
    
    return () => {
      document.head.removeChild(metaRobots);
      if (document.head.contains(linkRobots)) {
        document.head.removeChild(linkRobots);
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
      <ArtKeyEditor artkeyId={token} />
    </Suspense>
  );
}

export default function ArtKeyEditorPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-brand-lightest">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-brand-dark border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-brand-dark text-lg">Loading...</p>
        </div>
      </div>
    }>
      <ArtKeyEditorPageContent params={params} />
    </Suspense>
  );
}

async function ArtKeyEditorPageContent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ArtKeyEditorContent token={token} />;
}
