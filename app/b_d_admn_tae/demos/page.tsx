"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Demo {
  id: string;
  token: string;
  title: string;
  description?: string;
  shareUrl: string;
  qrCodeUrl?: string;
  createdAt: string;
}

export default function DemosPage() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch demos from API
    fetch('/api/admin/demos')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setDemos(data.demos || []);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load demos');
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this demo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/demos?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete demo');
      }

      // Refresh demos list
      const listResponse = await fetch('/api/admin/demos');
      const listData = await listResponse.json();
      setDemos(listData.demos || []);
    } catch (err: any) {
      alert(err.message || 'Failed to delete demo');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Demo Management</h1>
        <Link
          href="/manage/demos/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create New Demo
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      ) : demos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">No demos found. Create one to get started.</p>
          <Link
            href="/manage/demos/new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create New Demo
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QR Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Share URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {demos.map((demo) => (
                <tr key={demo.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{demo.title}</div>
                    {demo.description && (
                      <div className="text-sm text-gray-500 mt-1">{demo.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{demo.token}</code>
                  </td>
                  <td className="px-6 py-4">
                    {demo.qrCodeUrl ? (
                      <div className="flex flex-col items-start">
                        <img
                          src={demo.qrCodeUrl}
                          alt="QR Code"
                          className="border border-gray-300 rounded"
                          style={{ width: '80px', height: '80px' }}
                        />
                        <a
                          href={demo.qrCodeUrl}
                          download={`qr-${demo.token}.png`}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Download
                        </a>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No QR code</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={demo.shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 break-all"
                    >
                      {demo.shareUrl}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/manage/demos/${demo.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Edit
                    </Link>
                    <a
                      href={demo.shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 mr-4"
                    >
                      View
                    </a>
                    {demo.id !== '1' && (
                      <button
                        onClick={() => handleDelete(demo.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
