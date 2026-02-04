/**
 * Store Products List Page — Printful Edition
 *
 * Lists all store products with category tabs, search, bulk actions.
 * Handles 199+ products across 7 categories.
 *
 * @copyright B&D Servicing LLC 2026
 */

"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  taeBaseFee: number;
  productCount: number;
}

interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  productType: string;
  heroImage: string | null;
  basePrice: number;
  printfulBasePrice: number;
  taeAddOnFee: number;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  printProvider: string;
  printfulProductId: number | null;
  printfulVariantId: number | null;
  sizeLabel: string | null;
  paperType: string | null;
  finishType: string | null;
  taeId: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
}

type StatusFilter = 'all' | 'active' | 'inactive';

export default function ProductsListPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/store-products');
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        if (data.categories) {
          setCategories(data.categories);
        }
      } else {
        setError(data.error || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Failed to fetch products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (product: StoreProduct) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

    setDeletingId(product.id);
    try {
      const response = await fetch(`/api/admin/store-products/${product.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setProducts(products.filter(p => p.id !== product.id));
        selectedIds.delete(product.id);
        setSelectedIds(new Set(selectedIds));
      } else {
        alert(data.error || 'Failed to delete product');
      }
    } catch (err) {
      alert('Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (product: StoreProduct) => {
    try {
      const response = await fetch(`/api/admin/store-products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !product.active }),
      });
      const data = await response.json();
      if (data.success) {
        setProducts(products.map(p =>
          p.id === product.id ? { ...p, active: !p.active } : p
        ));
      }
    } catch (err) {
      alert('Failed to update product');
    }
  };

  const handleBulkActivate = async (activate: boolean) => {
    if (selectedIds.size === 0) return;
    const action = activate ? 'activate' : 'deactivate';
    if (!confirm(`${activate ? 'Activate' : 'Deactivate'} ${selectedIds.size} selected products?`)) return;

    setBulkUpdating(true);
    let successCount = 0;

    for (const id of selectedIds) {
      try {
        const response = await fetch(`/api/admin/store-products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: activate }),
        });
        const data = await response.json();
        if (data.success) successCount++;
      } catch (err) {
        console.error(`Failed to ${action} product ${id}`);
      }
    }

    // Refresh products list
    await fetchProducts();
    setSelectedIds(new Set());
    setBulkUpdating(false);
    alert(`${successCount} of ${selectedIds.size} products ${action}d successfully.`);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sizeLabel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.taeId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || product.categorySlug === selectedCategory;

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && product.active) ||
      (statusFilter === 'inactive' && !product.active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Count stats
  const totalActive = products.filter(p => p.active).length;
  const totalInactive = products.filter(p => !p.active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-medium">{error}</p>
        <button onClick={fetchProducts} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            {products.length} products across {categories.length} categories &middot; {totalActive} active, {totalInactive} inactive
          </p>
        </div>
        <Link
          href="/b_d_admn_tae/catalog/products/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-lg shadow mb-4 overflow-x-auto">
        <div className="flex border-b">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              selectedCategory === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All ({products.length})
          </button>
          {categories.map(cat => {
            const catProducts = products.filter(p => p.categorySlug === cat.slug);
            const activeCount = catProducts.filter(p => p.active).length;
            return (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  selectedCategory === cat.slug
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {cat.icon} {cat.name} ({activeCount}/{catProducts.length})
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + Status Filter + Bulk Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, size, or TAE ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as StatusFilter[]).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status === 'active' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="mt-3 pt-3 border-t flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">{selectedIds.size} selected</span>
            <button
              onClick={() => handleBulkActivate(true)}
              disabled={bulkUpdating}
              className="px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {bulkUpdating ? 'Updating...' : 'Activate Selected'}
            </button>
            <button
              onClick={() => handleBulkActivate(false)}
              disabled={bulkUpdating}
              className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
            >
              {bulkUpdating ? 'Updating...' : 'Deactivate Selected'}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-gray-600 text-sm hover:text-gray-900"
            >
              Clear Selection
            </button>
          </div>
        )}

        <div className="mt-3 text-sm text-gray-500">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No products in this category yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Printful ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  + TAE Fee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className={`hover:bg-gray-50 ${!product.active ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-[280px]" title={product.name}>
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {product.sizeLabel || product.taeId}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                      {product.categoryName}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                    <div>P: {product.printfulProductId}</div>
                    <div>V: {product.printfulVariantId}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    ${product.printfulBasePrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    ${product.taeAddOnFee.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${product.basePrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        product.active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {product.active ? '✓ Active' : '○ Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/b_d_admn_tae/catalog/products/${product.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deletingId === product.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{products.length}</div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{totalActive}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-400">{totalInactive}</div>
          <div className="text-sm text-gray-600">Inactive</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
          <div className="text-sm text-gray-600">Categories</div>
        </div>
      </div>
    </div>
  );
}
