/**
 * Edit Store Product Page
 * 
 * Form for editing an existing store product.
 * 
 * @copyright B&D Servicing LLC 2026
 */

"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface GelatoCatalog {
  id: string;
  catalogUid: string;
  title: string;
}

interface FormData {
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  productType: 'gelato_print' | 'custom_artwork' | 'digital_product';
  icon: string;
  heroImage: string;
  gelatoCatalogUid: string;
  basePrice: number;
  defaultBleedMm: number;
  defaultSafeMm: number;
  defaultDpi: number;
  active: boolean;
  featured: boolean;
  requiresArtKey: boolean;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
  allowedFormats: string[];
  allowedPapers: string[];
  allowedCoatings: string[];
  allowedFoils: string[];
  allowedFolds: string[];
}

const COMMON_ICONS = ['🎨', '🖼️', '📷', '🎴', '📜', '🃏', '📦', '🎁', '💌', '✨'];

const DEFAULT_FORM: FormData = {
  slug: '',
  name: '',
  description: '',
  shortDescription: '',
  productType: 'gelato_print',
  icon: '🎨',
  heroImage: '',
  gelatoCatalogUid: '',
  basePrice: 0,
  defaultBleedMm: 4,
  defaultSafeMm: 4,
  defaultDpi: 300,
  active: true,
  featured: false,
  requiresArtKey: false,
  sortOrder: 0,
  metaTitle: '',
  metaDescription: '',
  allowedFormats: [],
  allowedPapers: [],
  allowedCoatings: [],
  allowedFoils: [],
  allowedFolds: [],
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [originalSlug, setOriginalSlug] = useState('');
  const [catalogs, setCatalogs] = useState<GelatoCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchCatalogs();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/store-products/${productId}`);
      const data = await response.json();
      
      if (data.success) {
        const product = data.data;
        setOriginalSlug(product.slug);
        setFormData({
          slug: product.slug || '',
          name: product.name || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          productType: product.productType || 'gelato_print',
          icon: product.icon || '🎨',
          heroImage: product.heroImage || '',
          gelatoCatalogUid: product.gelatoCatalog?.catalogUid || '',
          basePrice: product.basePrice || 0,
          defaultBleedMm: product.defaultBleedMm || 4,
          defaultSafeMm: product.defaultSafeMm || 4,
          defaultDpi: product.defaultDpi || 300,
          active: product.active ?? true,
          featured: product.featured ?? false,
          requiresArtKey: product.requiresArtKey ?? false,
          sortOrder: product.sortOrder || 0,
          metaTitle: product.metaTitle || '',
          metaDescription: product.metaDescription || '',
          allowedFormats: product.allowedFormats || [],
          allowedPapers: product.allowedPapers || [],
          allowedCoatings: product.allowedCoatings || [],
          allowedFoils: product.allowedFoils || [],
          allowedFolds: product.allowedFolds || [],
        });
      } else if (response.status === 404) {
        setNotFound(true);
      } else {
        setError(data.error || 'Failed to fetch product');
      }
    } catch (err) {
      setError('Failed to fetch product');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogs = async () => {
    try {
      const response = await fetch('/api/gelato/catalogs');
      const data = await response.json();
      if (data.success && data.data) {
        setCatalogs(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch catalogs:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/store-products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          gelatoCatalogUid: formData.gelatoCatalogUid || null,
          allowedFormats: formData.allowedFormats.length > 0 ? formData.allowedFormats : null,
          allowedPapers: formData.allowedPapers.length > 0 ? formData.allowedPapers : null,
          allowedCoatings: formData.allowedCoatings.length > 0 ? formData.allowedCoatings : null,
          allowedFoils: formData.allowedFoils.length > 0 ? formData.allowedFoils : null,
          allowedFolds: formData.allowedFolds.length > 0 ? formData.allowedFolds : null,
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
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-yellow-800 mb-2">Product Not Found</h2>
        <p className="text-yellow-700 mb-4">The product you're looking for doesn't exist or has been deleted.</p>
        <Link
          href="/b_d_admn_tae/catalog/products"
          className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link href="/b_d_admn_tae/catalog/products" className="hover:text-blue-600">
            Products
          </Link>
          <span>/</span>
          <span>Edit: {formData.name}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600 mt-1">
          Modify product settings and configuration
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Greeting Cards"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., greeting-cards"
                  />
                  {formData.slug !== originalSlug && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ Changing the slug will break existing links to this product
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief tagline for the product"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Full product description..."
                  />
                </div>
              </div>
            </div>

            {/* Product Type & Gelato Integration */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Type</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Type *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { value: 'gelato_print', label: 'Gelato Print', description: 'Print-on-demand via Gelato', icon: '🖨️' },
                      { value: 'custom_artwork', label: 'Custom Artwork', description: 'Commissioned or handmade art', icon: '🎨' },
                      { value: 'digital_product', label: 'Digital Product', description: 'Downloadable files', icon: '💾' },
                    ].map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, productType: type.value as FormData['productType'] }))}
                        className={`p-4 border-2 rounded-lg text-left transition-colors ${
                          formData.productType === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{type.icon}</div>
                        <div className="font-medium text-gray-900">{type.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.productType === 'gelato_print' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gelato Catalog
                    </label>
                    <select
                      value={formData.gelatoCatalogUid}
                      onChange={(e) => setFormData(prev => ({ ...prev, gelatoCatalogUid: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a catalog...</option>
                      {catalogs.map(catalog => (
                        <option key={catalog.catalogUid} value={catalog.catalogUid}>
                          {catalog.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Link to a synced Gelato catalog for print options
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Print Specifications */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Print Specifications</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Bleed (mm)
                  </label>
                  <input
                    type="number"
                    value={formData.defaultBleedMm}
                    onChange={(e) => setFormData(prev => ({ ...prev, defaultBleedMm: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Safe Zone (mm)
                  </label>
                  <input
                    type="number"
                    value={formData.defaultSafeMm}
                    onChange={(e) => setFormData(prev => ({ ...prev, defaultSafeMm: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Export DPI
                  </label>
                  <input
                    type="number"
                    value={formData.defaultDpi}
                    onChange={(e) => setFormData(prev => ({ ...prev, defaultDpi: parseInt(e.target.value) || 300 }))}
                    min="72"
                    step="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="SEO title (defaults to product name)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="SEO description..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Publish</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Active</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.active ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, featured: !prev.featured }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.featured ? 'bg-yellow-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.featured ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">This Product Requires a QR Code</span>
                    <p className="text-xs text-gray-500 mt-1">Creates ArtKey portal + QR code for orders</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, requiresArtKey: !prev.requiresArtKey }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.requiresArtKey ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.requiresArtKey ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price ($)
                </label>
                <input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your markup added to Gelato cost
                </p>
              </div>
            </div>

            {/* Display */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Display</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {COMMON_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                        className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${
                          formData.icon === icon
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Or enter custom emoji/text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL (WordPress)
                  </label>
                  <input
                    type="url"
                    value={formData.heroImage}
                    onChange={(e) => setFormData(prev => ({ ...prev, heroImage: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://your-site.com/wp-content/uploads/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    WordPress image URL. If not provided, the emoji above will be displayed instead.
                  </p>
                  {formData.heroImage && (
                    <div className="mt-2">
                      <img 
                        src={formData.heroImage} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={saving || !formData.name || !formData.slug}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <Link
                  href="/b_d_admn_tae/catalog/products"
                  className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center font-medium"
                >
                  Cancel
                </Link>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Danger Zone</h2>
              <p className="text-sm text-red-700 mb-4">
                Deleting a product cannot be undone. All associated data will be lost.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${formData.name}"? This action cannot be undone.`)) {
                    fetch(`/api/admin/store-products/${productId}`, { method: 'DELETE' })
                      .then(res => res.json())
                      .then(data => {
                        if (data.success) {
                          router.push('/b_d_admn_tae/catalog/products');
                        } else {
                          alert(data.error || 'Failed to delete product');
                        }
                      })
                      .catch(() => alert('Failed to delete product'));
                  }
                }}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
