"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin-fetch';

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
    totalProducts: 0,
    loading: true,
  });

  const [connectionTests, setConnectionTests] = useState<{
    wordpress?: ConnectionTestResult;
    woocommerce?: ConnectionTestResult;
    printful?: ConnectionTestResult;
    testing: string | null;
  }>({
    testing: null,
  });

  useEffect(() => {
    // Fetch stats from API
    adminFetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats({
          totalArtKeys: data.totalArtKeys || 0,
          totalDemos: data.totalDemos || 0,
          totalProducts: data.totalProducts || 0,
          loading: false,
        });
      })
      .catch(() => {
        setStats(prev => ({ ...prev, loading: false }));
      });
  }, []);

  const testConnection = async (service: 'wordpress' | 'woocommerce' | 'printful' | 'all') => {
    setConnectionTests(prev => ({ ...prev, testing: service }));
    
    try {
      const response = await adminFetch(`/api/admin/test-connections?service=${service}`);
      const data = await response.json();
      
      setConnectionTests({
        wordpress: data.wordpress,
        woocommerce: data.woocommerce,
        printful: data.printful,
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total ArtKeys</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.loading ? '...' : stats.totalArtKeys}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">ArtKey Portals</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.loading ? '...' : stats.totalDemos}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Store Products</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.loading ? '...' : stats.totalProducts}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Printful fulfillment
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Quick Actions</h3>
          <div className="mt-4 space-y-2">
            <Link
              href="/b_d_admn_tae/demos/new"
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create ArtKey Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/b_d_admn_tae/demos"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-semibold mb-2">ArtKey Portals</h3>
            <p className="text-sm text-gray-600">Create and manage ArtKey portal websites</p>
          </Link>

          <Link
            href="/b_d_admn_tae/artkeys"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-semibold mb-2">Manage ArtKeys</h3>
            <p className="text-sm text-gray-600">View and edit all ArtKeys</p>
          </Link>

          <Link
            href="/b_d_admn_tae/orders"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-semibold mb-2">Manage Orders</h3>
            <p className="text-sm text-gray-600">View and manage all orders</p>
          </Link>

          <Link
            href="/b_d_admn_tae/customers"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-semibold mb-2">Manage Customers</h3>
            <p className="text-sm text-gray-600">View customer accounts and order history</p>
          </Link>

          <Link
            href="/b_d_admn_tae/catalog/products"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-semibold mb-2">Products (Printful)</h3>
            <p className="text-sm text-gray-600">Manage print products and Printful catalog</p>
          </Link>

          <Link
            href="/b_d_admn_tae/catalog/categories"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-semibold mb-2">Categories</h3>
            <p className="text-sm text-gray-600">Manage product categories and QR code settings</p>
          </Link>

          <Link
            href="/b_d_admn_tae/settings"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-semibold mb-2">Site Settings</h3>
            <p className="text-sm text-gray-600">Toggle features and configure site options</p>
          </Link>

        </div>
      </div>

      {/* Connection Testing Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Connection Testing</h2>
        <p className="text-sm text-gray-600 mb-4">
          Test connections to WordPress, WooCommerce, and Printful APIs
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

          {/* Printful Test */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Printful</h3>
              {connectionTests.printful && (
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    connectionTests.printful.success
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {connectionTests.printful.success ? '✓ Connected' : '✗ Failed'}
                </span>
              )}
            </div>
            <button
              onClick={() => testConnection('printful')}
              disabled={connectionTests.testing === 'printful'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {connectionTests.testing === 'printful' ? 'Testing...' : 'Test Connection'}
            </button>
            {connectionTests.printful && (
              <p className="text-xs text-gray-600 mt-2">
                {connectionTests.printful.message}
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
