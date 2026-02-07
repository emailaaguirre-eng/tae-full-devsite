'use client';

import dynamic from 'next/dynamic';

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
  return (
    <ProjectEditor
      productSlug="card"
      selectedVariant={{
        uid: 'demo-5x7-portrait',
        size: '5x7',
        orientation: 'portrait',
        paper: 'matte',
      }}
      onComplete={(exportData) => {
        console.log('Design complete:', exportData);
        // In production: navigate to ArtKey editor or checkout
        alert('Design saved! Ready to continue to ArtKey editor.');
        // Redirect to ArtKey editor
        window.location.href = '/art-key/editor?from_design=true';
      }}
      onClose={() => {
        if (confirm('Close designer? Unsaved changes will be lost.')) {
          window.location.href = '/shop';
        }
      }}
    />
  );
}
