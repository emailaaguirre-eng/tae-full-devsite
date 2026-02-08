"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminFetch } from '@/lib/admin-fetch';
import Link from 'next/link';

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  printfulProductId: number | null;
  printfulVariantId: number | null;
  printfulBasePrice: number;
  taeAddOnFee: number;
  sizeLabel: string;
  paperType: string;
  finishType: string;
  printDpi: number;
  heroImage: string;
  active: boolean;
  sortOrder: number;
}

const DEFAULT_FORM: FormData = {
  name: '',
  slug: '',
  description: '',
  categoryId: '',
  printfulProductId: null,
  printfulVariantId: null,
  printfulBasePrice: 0,
  taeAddOnFee: 0,
  sizeLabel: '',
  paperType: '',
  finishType: '',
  printDpi: 300,
  heroImage: '',
  active: true,
  sortOrder: 0,
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchCategories();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await adminFetch(`/api/admin/store-products/${id}`);
      const data = await response.json();
      if (data.success && data.data) {
        const p = data.data;
        setFormData({
          name: p.name || '',
          slug: p.slug || '',
          description: p.description || '',
          categoryId: p.categoryId || '',
          printfulProductId: p.printfulProductId || null,
          printfulVariantId: p.printfulVariantId || null,
          printfulBasePrice: p.printfulBasePrice || 0,
          taeAddOnFee: p.taeAddOnFee || 0,
          sizeLabel: p.sizeLabel || '',
          paperType: p.paperType || '',
          finishType: p.finishType || '',
          printDpi: p.printDpi || 300,
          heroImage: p.heroImage || '',
          active: p.active ?? true,
          sortOrder: p.sortOrder || 0,
        });
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminFetch('/api/admin/store-categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.map((c: any) => ({ id: c.id, slug: c.slug, name: c.name })));
      }
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await adminFetch(`/api/admin/store-products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          categoryId: formData.categoryId,
          printfulProductId: formData.printfulProductId,
          printfulVariantId: formData.printfulVariantId,
          printfulBasePrice: formData.printfulBasePrice,
          taeAddOnFee: formData.taeAddOnFee,
          sizeLabel: formData.sizeLabel || null,
          paperType: formData.paperType || null,
          finishType: formData.finishType || null,
          printDpi: formData.printDpi,
          heroImage: formData.heroImage || null,
          active: formData.active,
          sortOrder: formData.sortOrder,
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push('/b_d_admn_tae/catalog/products');
      } else {
        setError(data.error || 'Failed to update product');
      }
    } catch (err) {
      setError('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{error}</p>
        <Link href="/b_d_admn_tae/catalog/products" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
          Back to Products
        </Link>
      </div>
    );
  }

  const totalPrice = (formData.printfulBasePrice || 0) + (formData.taeAddOnFee || 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-1">Printful fulfillment</p>
        </div>
        <Link
          href="/b_d_admn_tae/catalog/products"
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Back to Products
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size Label</label>
              <input
                type="text"
                value={formData.sizeLabel}
                onChange={(e) => setFormData({ ...formData, sizeLabel: e.target.value })}
                placeholder="e.g. 5x7"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Printful Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Printful Integration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Printful Product ID</label>
              <input
                type="number"
                value={formData.printfulProductId ?? ''}
                onChange={(e) => setFormData({ ...formData, printfulProductId: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="e.g. 568"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Printful Variant ID</label>
              <input
                type="number"
                value={formData.printfulVariantId ?? ''}
                onChange={(e) => setFormData({ ...formData, printfulVariantId: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="e.g. 14457"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Print DPI</label>
              <input
                type="number"
                value={formData.printDpi}
                onChange={(e) => setFormData({ ...formData, printDpi: parseInt(e.target.value) || 300 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Printful Base Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.printfulBasePrice}
                onChange={(e) => setFormData({ ...formData, printfulBasePrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Cost from Printful</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TAE Add-On Fee ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.taeAddOnFee}
                onChange={(e) => setFormData({ ...formData, taeAddOnFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Your markup</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Price</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-lg font-bold text-gray-900">
                ${totalPrice.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Product Specs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Specs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paper Type</label>
              <input
                type="text"
                value={formData.paperType}
                onChange={(e) => setFormData({ ...formData, paperType: e.target.value })}
                placeholder="e.g. Enhanced Matte"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Finish Type</label>
              <input
                type="text"
                value={formData.finishType}
                onChange={(e) => setFormData({ ...formData, finishType: e.target.value })}
                placeholder="e.g. Black Frame"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Active (visible in store)</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/b_d_admn_tae/catalog/products"
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
