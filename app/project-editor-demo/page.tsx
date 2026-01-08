'use client';

import dynamic from 'next/dynamic';
import { MockProvider } from '@/lib/designer/providers/MockProvider';
import { useMemo } from 'react';

const ProjectEditor = dynamic(() => import('@/components/ProjectEditor/ProjectEditor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-700 text-lg">Loading Designer...</p>
      </div>
    </div>
  ),
});

export default function ProjectEditorDemoPage() {
  // Create provider instance (memoized to avoid recreating on each render)
  const provider = useMemo(() => new MockProvider(), []);
  
  return (
    <ProjectEditor
      provider={provider}
      initialSelection={{
        productType: 'greeting-card',
        orientation: 'portrait',
        size: '5x7',
        foldFormat: 'flat',
      }}
      onComplete={(exportData) => {
        console.log('Design complete:', exportData);
        // In production: navigate to checkout or next step
        alert('Design exported! Check console for data.');
      }}
      onClose={() => {
        // In production: navigate back or close modal
        if (confirm('Close designer? Unsaved changes will be lost.')) {
          window.location.href = '/';
        }
      }}
    />
  );
}

