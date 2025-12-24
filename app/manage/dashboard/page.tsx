"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ConnectionTestResult {
  success: boolean;
  message: string;
  configured?: boolean;
  [key: string]: any;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalArtKeys: 0,
    totalDemos: 0,
    loading: true,
  });

  const [connectionTests, setConnectionTests] = useState<{
    wordpress?: ConnectionTestResult;
    woocommerce?: ConnectionTestResult;
    gelato?: ConnectionTestResult;
    testing: string | null;
  }>({
    testing: null,
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

  const testConnection = async (service: 'wordpress' | 'woocommerce' | 'gelato' | 'all') => {
    setConnectionTests(prev => ({ ...prev, testing: service }));
    
    try {
      const response = await fetch(`/api/admin/test-connections?service=${service}`);
      const data = await response.json();
      
      setConnectionTests({
        wordpress: data.wordpress,
        woocommerce: data.woocommerce,
        gelato: data.gelato,
        testing: null,
      });
    } catch (error) {
      setConnectionTests({
        ...connectionTests,
        testing: null,
      });
      alert(`Error testing connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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
              href="/manage/demos/new"
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
            href="/manage/demos"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-semibold mb-2">Manage Demos</h3>
            <p className="text-sm text-gray-600">View and manage all demo ArtKeys</p>
          </Link>

          <Link
            href="/manage/artkeys"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-semibold mb-2">Manage ArtKeys</h3>
            <p className="text-sm text-gray-600">View and edit all ArtKeys</p>
          </Link>

          <Link
            href="/art-key/691e3d09ef58e"
            target="_blank"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-semibold mb-2">🎯 Critical Demo (Customer-Facing)</h3>
            <p className="text-sm text-gray-600">Open the professional demo URL (no "demo" in URL)</p>
          </Link>
          <Link
            href="/demo/artkey-691e3d09ef58e"
            target="_blank"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-semibold mb-2">View Demo Portal (Internal)</h3>
            <p className="text-sm text-gray-600">Internal testing link</p>
          </Link>

        </div>
      </div>

      {/* Connection Testing Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Connection Testing</h2>
        <p className="text-sm text-gray-600 mb-4">
          Test connections to WordPress, WooCommerce, and Gelato APIs
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* WordPress Test */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">WordPress</h3>
              {connectionTests.wordpress && (
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    connectionTests.wordpress.success
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {connectionTests.wordpress.success ? '✓ Connected' : '✗ Failed'}
                </span>
              )}
            </div>
            <button
              onClick={() => testConnection('wordpress')}
              disabled={connectionTests.testing === 'wordpress'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {connectionTests.testing === 'wordpress' ? 'Testing...' : 'Test Connection'}
            </button>
            {connectionTests.wordpress && (
              <p className="text-xs text-gray-600 mt-2">
                {connectionTests.wordpress.message}
              </p>
            )}
          </div>

          {/* WooCommerce Test */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">WooCommerce</h3>
              {connectionTests.woocommerce && (
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    connectionTests.woocommerce.success
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {connectionTests.woocommerce.success ? '✓ Connected' : '✗ Failed'}
                </span>
              )}
            </div>
            <button
              onClick={() => testConnection('woocommerce')}
              disabled={connectionTests.testing === 'woocommerce'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {connectionTests.testing === 'woocommerce' ? 'Testing...' : 'Test Connection'}
            </button>
            {connectionTests.woocommerce && (
              <p className="text-xs text-gray-600 mt-2">
                {connectionTests.woocommerce.message}
              </p>
            )}
          </div>

          {/* Gelato Test */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Gelato</h3>
              {connectionTests.gelato && (
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    connectionTests.gelato.success
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {connectionTests.gelato.success ? '✓ Connected' : '✗ Failed'}
                </span>
              )}
            </div>
            <button
              onClick={() => testConnection('gelato')}
              disabled={connectionTests.testing === 'gelato'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {connectionTests.testing === 'gelato' ? 'Testing...' : 'Test Connection'}
            </button>
            {connectionTests.gelato && (
              <p className="text-xs text-gray-600 mt-2">
                {connectionTests.gelato.message}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => testConnection('all')}
          disabled={connectionTests.testing !== null}
          className="w-full md:w-auto px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
        >
          {connectionTests.testing === 'all' ? 'Testing All Connections...' : 'Test All Connections'}
        </button>
      </div>
    </div>
  );
}
