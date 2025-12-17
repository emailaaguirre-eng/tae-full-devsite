"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Demo ID to token mapping
const DEMO_TOKENS: Record<string, string> = {
  '1': '691e3d09ef58e',
};

export default function EditDemoPage() {
  const params = useParams();
  const router = useRouter();
  const demoId = params.id as string;

  useEffect(() => {
    // Map demo ID to token and redirect to ArtKey editor
    const token = DEMO_TOKENS[demoId];
    
    if (token) {
      // Redirect to the ArtKey editor
      router.push(`/art-key/edit/${token}`);
    } else {
      // If demo not found, redirect to demos list
      router.push('/manage/demos');
    }
  }, [demoId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
}
