"use client";

import { Suspense } from 'react';
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
