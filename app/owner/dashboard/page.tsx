"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ArtKey {
  id: string;
  publicToken: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function OwnerDashboard() {
  const [artKeys, setArtKeys] = useState<ArtKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('owner_token');
    const userData = localStorage.getItem('owner_user');

    if (!token || !userData) {
      router.push('/owner/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchArtKeys();
  }, [router]);

  const fetchArtKeys = async () => {
    try {
      const token = localStorage.getItem('owner_token');
      const res = await fetch('/api/owner/artkeys', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('owner_token');
        localStorage.removeItem('owner_user');
        router.push('/owner/login');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setArtKeys(data.artKeys);
      } else {
        setError(data.error || 'Failed to load ArtKeys');
      }
    } catch (err: any) {
      setError('Failed to load ArtKeys');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('owner_token');
    localStorage.removeItem('owner_user');
    router.push('/owner/login');
  };

  const getAppBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">My ArtKeys</h1>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-gray-600">{user.email}</span>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Your ArtKeys</h2>
          <Link
            href="/art-key/editor"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Create New ArtKey
          </Link>
        </div>

        {artKeys.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">You haven't created any ArtKeys yet.</p>
            <Link
              href="/art-key/editor"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Create Your First ArtKey
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artKeys.map((artKey) => {
              const publicUrl = `${getAppBaseUrl()}/artkey/${artKey.publicToken}`;
              const editUrl = `/art-key/editor?artkey_id=${artKey.id}`;
              
              return (
                <div key={artKey.id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {artKey.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Created: {new Date(artKey.createdAt).toLocaleDateString()}
                  </p>
                  <div className="space-y-2">
                    <Link
                      href={`/owner/artkey/${artKey.id}`}
                      className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      📋 View All Content
                    </Link>
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      View Public Portal
                    </a>
                    <Link
                      href={editUrl}
                      className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit ArtKey
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

