"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoPage() {
  const [token, setToken] = useState('691e3d09ef58e');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      router.push(`/art-key/${token.trim()}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2 font-playfair">ArtKey Portal Demo</h1>
        <p className="text-gray-600 text-center mb-6">
          Enter your ArtKey token to view the portal
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
              ArtKey Token
            </label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your token (e.g., 691e3d09ef58e)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            View ArtKey Portal
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
          <p className="text-sm text-gray-500 text-center">
            Or visit directly: <code className="bg-gray-100 px-2 py-1 rounded text-xs">/art-key/[your-token]</code>
          </p>
          <div className="text-center">
            <a
              href="/art-key/691e3d09ef58e"
              className="text-blue-600 hover:text-blue-700 underline text-sm"
            >
              Test with existing token: 691e3d09ef58e
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
