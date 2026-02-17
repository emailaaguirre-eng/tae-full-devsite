"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Grid3X3,
  Check,
} from "lucide-react";

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
  productCount: number;
  activeProductCount: number;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = {
  name: "",
  icon: "",
  taeBaseFee: "0",
  requiresQrCode: false,
  active: true,
  featured: false,
  sortOrder: "0",
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/store-categories");
      const data = await res.json();
      if (data.success) setCategories(data.data || []);
      else setError(data.error);
    } catch {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const handleEdit = (c: Category) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      icon: c.icon || "",
      taeBaseFee: (c.taeBaseFee || 0).toString(),
      requiresQrCode: c.requiresQrCode,
      active: c.active,
      featured: c.featured,
      sortOrder: (c.sortOrder || 0).toString(),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        icon: form.icon || undefined,
        taeBaseFee: parseFloat(form.taeBaseFee) || 0,
        requiresQrCode: form.requiresQrCode,
        active: form.active,
        featured: form.featured,
        sortOrder: parseInt(form.sortOrder) || 0,
      };

      let res;
      if (editId) {
        res = await fetch(`/api/admin/store-categories/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/store-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setEditId(null);
        setForm(EMPTY_FORM);
        await loadCategories();
      } else {
        setError(data.error || "Save failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/store-categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDeleteId(null);
        await loadCategories();
      } else {
        setError(data.error || "Delete failed");
      }
    } catch {
      setError("Network error");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-brand-medium text-sm">Loading categories...</div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-playfair">Categories</h1>
          <p className="text-sm text-brand-medium mt-1">{categories.length} categories</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
          className="bg-brand-dark text-white px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-brand-dark/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4 flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="bg-white border border-brand-light">
        {categories.length === 0 ? (
          <div className="p-8 text-center">
            <Grid3X3 className="w-8 h-8 text-brand-medium mx-auto mb-2" />
            <div className="text-sm text-brand-medium">No categories yet</div>
            <button
              onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
              className="text-xs text-brand-accent hover:underline mt-2"
            >
              Create your first category
            </button>
          </div>
        ) : (
          <div className="divide-y divide-brand-light">
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-brand-medium font-medium bg-brand-lightest">
              <div className="col-span-1">Icon</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-2">TAE ID</div>
              <div className="col-span-1">Products</div>
              <div className="col-span-2">Base Fee</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Actions</div>
            </div>
            {categories.map((c) => (
              <div key={c.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-brand-lightest/50 transition-colors">
                <div className="col-span-1 text-lg">{c.icon || "📦"}</div>
                <div className="col-span-3">
                  <div className="text-sm font-medium text-brand-dark">{c.name}</div>
                  <div className="text-[10px] text-brand-medium">{c.slug}</div>
                </div>
                <div className="col-span-2 text-xs text-brand-medium">{c.taeId}</div>
                <div className="col-span-1 text-sm text-brand-dark">{c.productCount}</div>
                <div className="col-span-2 text-sm text-brand-dark">${(c.taeBaseFee || 0).toFixed(2)}</div>
                <div className="col-span-1">
                  <span className={`text-[10px] px-2 py-0.5 font-medium ${c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-1 justify-end">
                  <button onClick={() => handleEdit(c)} className="p-1.5 text-brand-medium hover:text-brand-dark transition-colors" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-brand-medium hover:text-red-600 transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 max-w-sm w-full">
            <h3 className="text-sm font-semibold text-brand-dark mb-2">Delete Category</h3>
            <p className="text-sm text-brand-medium mb-4">
              Are you sure? Categories with products cannot be deleted.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-brand-light hover:bg-brand-lightest transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg my-8">
            <div className="px-6 py-4 border-b border-brand-light flex items-center justify-between">
              <h3 className="text-lg font-semibold text-brand-dark">
                {editId ? "Edit Category" : "New Category"}
              </h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }}><X className="w-5 h-5 text-brand-medium" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  placeholder="e.g. Greeting Cards"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Icon (emoji)</label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    placeholder="e.g. 🎨"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">TAE Base Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.taeBaseFee}
                    onChange={(e) => setForm({ ...form, taeBaseFee: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  />
                </div>
                <div className="flex flex-col gap-2 pt-5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setForm({ ...form, requiresQrCode: !form.requiresQrCode })}
                      className={`w-4 h-4 border flex items-center justify-center ${form.requiresQrCode ? "bg-brand-dark border-brand-dark text-white" : "border-brand-light"}`}
                    >
                      {form.requiresQrCode && <Check className="w-2.5 h-2.5" />}
                    </button>
                    <span className="text-xs text-brand-dark">Requires QR Code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setForm({ ...form, active: !form.active })}
                      className={`w-4 h-4 border flex items-center justify-center ${form.active ? "bg-brand-dark border-brand-dark text-white" : "border-brand-light"}`}
                    >
                      {form.active && <Check className="w-2.5 h-2.5" />}
                    </button>
                    <span className="text-xs text-brand-dark">Active</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-brand-light flex items-center justify-end gap-2">
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 text-sm border border-brand-light hover:bg-brand-lightest transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="px-6 py-2 text-sm bg-brand-dark text-white hover:bg-brand-dark/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
