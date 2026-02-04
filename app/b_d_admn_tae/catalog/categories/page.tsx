/**
 * Store Categories Management Page
 *
 * Create, edit, reorder, and manage product categories.
 * Each category maps to a section on the customer-facing shop.
 *
 * @copyright B&D Servicing LLC 2026
 */

"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  taeId: string;
  slug: string;
  name: string;
  icon: string;
  taeBaseFee: number;
  requiresQrCode: boolean;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  productCount: number;
  activeProductCount: number;
}

interface EditingCategory {
  id: string | null;
  name: string;
  slug: string;
  icon: string;
  taeBaseFee: string;
  requiresQrCode: boolean;
  sortOrder: string;
}

const emptyEdit: EditingCategory = {
  id: null,
  name: '',
  slug: '',
  icon: '📦',
  taeBaseFee: '0',
  requiresQrCode: false,
  sortOrder: '0',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCat, setNewCat] = useState<EditingCategory>({ ...emptyEdit });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/store-categories');
      const data = await response.json();
      if (data.success) {
        // Sort by sortOrder ascending for display
        const sorted = data.data.sort((a: Category, b: Category) => a.sortOrder - b.sortOrder);
        setCategories(sorted);
      } else {
        setError(data.error || 'Failed to fetch categories');
      }
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCat.name.trim()) {
      alert('Category name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/store-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCat.name.trim(),
          slug: newCat.slug.trim() || undefined,
          icon: newCat.icon || '📦',
          taeBaseFee: parseFloat(newCat.taeBaseFee) || 0,
          requiresQrCode: newCat.requiresQrCode,
          sortOrder: parseInt(newCat.sortOrder) || 0,
          active: true,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setShowNewForm(false);
        setNewCat({ ...emptyEdit });
        await fetchCategories();
      } else {
        alert(data.error || 'Failed to create category');
      }
    } catch (err) {
      alert('Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditing({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || '📦',
      taeBaseFee: cat.taeBaseFee.toString(),
      requiresQrCode: cat.requiresQrCode,
      sortOrder: cat.sortOrder.toString(),
    });
  };

  const handleSaveEdit = async () => {
    if (!editing || !editing.id) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/store-categories/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editing.name.trim(),
          slug: editing.slug.trim(),
          icon: editing.icon,
          taeBaseFee: parseFloat(editing.taeBaseFee) || 0,
          requiresQrCode: editing.requiresQrCode,
          sortOrder: parseInt(editing.sortOrder) || 0,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setEditing(null);
        await fetchCategories();
      } else {
        alert(data.error || 'Failed to update category');
      }
    } catch (err) {
      alert('Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const response = await fetch(`/api/admin/store-categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !cat.active }),
      });
      const data = await response.json();
      if (data.success) {
        setCategories(categories.map(c =>
          c.id === cat.id ? { ...c, active: !c.active } : c
        ));
      }
    } catch (err) {
      alert('Failed to update category');
    }
  };

  const handleToggleFeatured = async (cat: Category) => {
    try {
      const response = await fetch(`/api/admin/store-categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !cat.featured }),
      });
      const data = await response.json();
      if (data.success) {
        setCategories(categories.map(c =>
          c.id === cat.id ? { ...c, featured: !c.featured } : c
        ));
      }
    } catch (err) {
      alert('Failed to update category');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete category "${cat.name}"?\n\nThis will NOT delete the ${cat.productCount} products in it — you'll need to move them first.`)) return;

    setDeletingId(cat.id);
    try {
      const response = await fetch(`/api/admin/store-categories/${cat.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setCategories(categories.filter(c => c.id !== cat.id));
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch (err) {
      alert('Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-medium">{error}</p>
        <button onClick={fetchCategories} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
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
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">
            {categories.length} categories &middot; Organize your products into shop sections
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/b_d_admn_tae/catalog/products"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            ← Products
          </Link>
          <button
            onClick={() => { setShowNewForm(true); setNewCat({ ...emptyEdit }); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Category
          </button>
        </div>
      </div>

      {/* New Category Form */}
      {showNewForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                placeholder="e.g. Wall Art"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={newCat.slug}
                onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
                placeholder="auto-generated from name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
              <input
                type="text"
                value={newCat.icon}
                onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TAE Base Fee ($)</label>
              <input
                type="number"
                step="0.01"
                value={newCat.taeBaseFee}
                onChange={(e) => setNewCat({ ...newCat, taeBaseFee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={newCat.sortOrder}
                onChange={(e) => setNewCat({ ...newCat, sortOrder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newCat.requiresQrCode}
                  onChange={(e) => setNewCat({ ...newCat, requiresQrCode: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Requires QR Code</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {saving ? 'Creating...' : 'Create Category'}
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const isEditing = editing?.id === cat.id;

          return (
            <div key={cat.id} className={`bg-white rounded-lg shadow p-5 ${!cat.active ? 'opacity-60' : ''}`}>
              {isEditing ? (
                /* Inline Edit Mode */
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                      <input
                        type="text"
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Slug</label>
                      <input
                        type="text"
                        value={editing.slug}
                        onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Icon</label>
                      <input
                        type="text"
                        value={editing.icon}
                        onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">TAE Fee ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editing.taeBaseFee}
                        onChange={(e) => setEditing({ ...editing, taeBaseFee: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Sort Order</label>
                      <input
                        type="number"
                        value={editing.sortOrder}
                        onChange={(e) => setEditing({ ...editing, sortOrder: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editing.requiresQrCode}
                          onChange={(e) => setEditing({ ...editing, requiresQrCode: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">Requires QR Code</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Display Mode */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{cat.icon || '📦'}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{cat.name}</h3>
                        {cat.featured && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">★ Featured</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-3 mt-0.5">
                        <span>/{cat.slug}</span>
                        <span>·</span>
                        <span>TAE Fee: ${cat.taeBaseFee.toFixed(2)}</span>
                        <span>·</span>
                        <span>{cat.activeProductCount} active / {cat.productCount} total products</span>
                        {cat.requiresQrCode && (
                          <>
                            <span>·</span>
                            <span className="text-blue-600">QR Required</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(cat)}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        cat.active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.active ? '✓ Active' : '○ Inactive'}
                    </button>
                    <button
                      onClick={() => handleToggleFeatured(cat)}
                      className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                        cat.featured
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={cat.featured ? 'Remove from featured' : 'Mark as featured'}
                    >
                      {cat.featured ? '★' : '☆'}
                    </button>
                    <Link
                      href={`/b_d_admn_tae/catalog/products?category=${cat.slug}`}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100"
                    >
                      View Products
                    </Link>
                    <button
                      onClick={() => handleEdit(cat)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      disabled={deletingId === cat.id}
                      className="px-3 py-1.5 bg-red-50 text-red-700 rounded text-xs font-medium hover:bg-red-100 disabled:opacity-50"
                    >
                      {deletingId === cat.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
          <p className="text-gray-600 mb-4">Create your first category to start organizing products.</p>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Category
          </button>
        </div>
      )}
    </div>
  );
}
