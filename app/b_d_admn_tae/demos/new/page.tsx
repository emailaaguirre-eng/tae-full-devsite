"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewDemoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    artKeyData: '',
  });
  const [createdDemo, setCreatedDemo] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Parse artKeyData if provided, otherwise use default
      let artKeyData;
      if (formData.artKeyData.trim()) {
        try {
          artKeyData = JSON.parse(formData.artKeyData);
        } catch {
          setError('Invalid JSON in ArtKey Data field');
          setLoading(false);
          return;
        }
      } else {
        artKeyData = {
          title: formData.title,
          description: formData.description,
          demo: true,
          createdAt: new Date().toISOString(),
        };
      }

      const response = await fetch('/api/admin/demos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          artKeyData: artKeyData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create demo');
      }

      setCreatedDemo(data.demo);
      setSuccess(true);
      
      // Redirect to demos list after 3 seconds
      setTimeout(() => {
        router.push('/manage/demos');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create demo');
    } finally {
      setLoading(false);
    }
  };

  if (success && createdDemo) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Demo Created Successfully!</h1>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            {createdDemo.title}
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Token:</label>
              <code className="block mt-1 bg-gray-100 px-3 py-2 rounded text-sm">
                {createdDemo.token}
              </code>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Share URL:</label>
              <a
                href={createdDemo.shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-1 text-blue-600 hover:text-blue-800 underline"
              >
                {createdDemo.shareUrl}
              </a>
            </div>

            {createdDemo.qrCodeUrl && (
              <div>
                <label className="text-sm font-medium text-gray-700">QR Code:</label>
                <div className="mt-2">
                  <img
                    src={createdDemo.qrCodeUrl}
                    alt="QR Code"
                    className="border border-gray-300 rounded"
                    style={{ maxWidth: '200px' }}
                  />
                </div>
                <a
                  href={createdDemo.qrCodeUrl}
                  download={`qr-${createdDemo.token}.png`}
                  className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
                >
                  Download QR Code
                </a>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-4">
            <a
              href={createdDemo.shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Demo Portal
            </a>
            <button
              onClick={() => router.push('/manage/demos')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Demos List
            </button>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Redirecting to demos list in 3 seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create New Demo ArtKey</h1>
        <button
          onClick={() => router.push('/manage/demos')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Demo Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Holiday Greeting Card Demo"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional description for this demo"
            />
          </div>

          <div>
            <label htmlFor="artKeyData" className="block text-sm font-medium text-gray-700 mb-2">
              ArtKey Data (JSON) - Optional
            </label>
            <textarea
              id="artKeyData"
              value={formData.artKeyData}
              onChange={(e) => setFormData({ ...formData, artKeyData: e.target.value })}
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder='{"title": "Demo Title", "content": {...}, "settings": {...}}'
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional: Provide custom JSON data for the ArtKey. If left empty, a default structure will be created.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Demo...' : 'Create Demo'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/manage/demos')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

