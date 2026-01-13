"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditDemoPage() {
  const params = useParams();
  const router = useRouter();
  const demoId = params.id as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch demo to get ownerToken for editing
    async function fetchDemoAndRedirect() {
      try {
        const response = await fetch('/api/admin/demos');
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch demos');
        }

        const demo = data.demos.find((d: any) => d.id === demoId);
        
        if (!demo) {
          setError('Demo not found');
          setTimeout(() => router.push('/b_d_admn_tae/demos'), 2000);
          return;
        }

        if (!demo.ownerToken) {
          setError('Demo does not have an owner token for editing');
          setTimeout(() => router.push('/b_d_admn_tae/demos'), 2000);
          return;
        }

        // Redirect to the ArtKey editor using ownerToken
        router.push(`/art-key/edit/${demo.ownerToken}`);
      } catch (err: any) {
        console.error('Error fetching demo:', err);
        setError(err.message || 'Failed to load demo');
        setTimeout(() => router.push('/b_d_admn_tae/demos'), 2000);
      }
    }

    fetchDemoAndRedirect();
  }, [demoId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600 text-sm">Redirecting to demos list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading ArtKey editor...</p>
      </div>
    </div>
  );
}
