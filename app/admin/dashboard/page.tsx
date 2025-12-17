"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalArtKeys: 0,
    totalDemos: 0,
    loading: true,
  });

  useEffect(() => {
    // Fetch stats from API
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats({
          totalArtKeys: data.totalArtKeys || 0,
          totalDemos: data.totalDemos || 0,
          loading: false,
        });
      })
      .catch(() => {
        setStats(prev => ({ ...prev, loading: false }));
      });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total ArtKeys</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.loading ? '...' : stats.totalArtKeys}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active Demos</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.loading ? '...' : stats.totalDemos}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Quick Actions</h3>
          <div className="mt-4 space-y-2">
            <Link
              href="/admin/demos/new"
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/demos"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-semibold mb-2">Manage Demos</h3>
            <p className="text-sm text-gray-600">View and manage all demo ArtKeys</p>
          </Link>

          <Link
            href="/admin/artkeys"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-semibold mb-2">Manage ArtKeys</h3>
            <p className="text-sm text-gray-600">View and edit all ArtKeys</p>
          </Link>

          <Link
            href="/demo/artkey-691e3d09ef58e"
            target="_blank"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-semibold mb-2">View Demo Portal</h3>
            <p className="text-sm text-gray-600">Open the sales demo in a new tab</p>
          </Link>

          <Link
            href="/api/artkey/test-connection"
            target="_blank"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-semibold mb-2">Test WordPress Connection</h3>
            <p className="text-sm text-gray-600">Check API connectivity</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
