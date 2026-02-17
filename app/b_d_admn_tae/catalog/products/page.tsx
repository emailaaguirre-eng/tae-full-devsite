"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Package,
  Check,
  ChevronDown,
} from "lucide-react";

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  heroImage: string | null;
  basePrice: number;
  printfulBasePrice: number;
  taeAddOnFee: number;
  active: boolean;
  sortOrder: number;
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
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  taeBaseFee: number;
  productCount: number;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  categoryId: "",
  printProvider: "printful",
  printfulProductId: "",
  printfulVariantId: "",
  printfulBasePrice: "0",
  taeAddOnFee: "0",
  sizeLabel: "",
  paperType: "",
  finishType: "",
  heroImage: "",
  active: true,
  sortOrder: "0",
};

export default function AdminProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/store-products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
        setCategories(data.categories || []);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setShowForm(true);
      setEditId(null);
      setForm(EMPTY_FORM);
    }
  }, [searchParams]);

  const handleEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      description: p.description || "",
      categoryId: p.categoryId || "",
      printProvider: p.printProvider || "printful",
      printfulProductId: p.printfulProductId?.toString() || "",
      printfulVariantId: p.printfulVariantId?.toString() || "",
      printfulBasePrice: (p.printfulBasePrice || 0).toString(),
      taeAddOnFee: (p.taeAddOnFee || 0).toString(),
      sizeLabel: p.sizeLabel || "",
      paperType: p.paperType || "",
      finishType: p.finishType || "",
      heroImage: p.heroImage || "",
      active: p.active,
      sortOrder: (p.sortOrder || 0).toString(),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, any> = {
        name: form.name,
        description: form.description || null,
        categoryId: form.categoryId || undefined,
        printProvider: form.printProvider,
        printfulProductId: form.printfulProductId ? parseInt(form.printfulProductId) : null,
        printfulVariantId: form.printfulVariantId ? parseInt(form.printfulVariantId) : null,
        printfulBasePrice: parseFloat(form.printfulBasePrice) || 0,
        taeAddOnFee: parseFloat(form.taeAddOnFee) || 0,
        sizeLabel: form.sizeLabel || null,
        paperType: form.paperType || null,
        finishType: form.finishType || null,
        heroImage: form.heroImage || null,
        active: form.active,
        sortOrder: parseInt(form.sortOrder) || 0,
      };

      let res;
      if (editId) {
        res = await fetch(`/api/admin/store-products/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/store-products", {
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
        await loadProducts();
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
      const res = await fetch(`/api/admin/store-products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDeleteId(null);
        await loadProducts();
      } else {
        setError(data.error || "Delete failed");
      }
    } catch {
      setError("Network error");
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || p.categoryId === filterCat;
    return matchSearch && matchCat;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-brand-medium text-sm">Loading products...</div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-playfair">Products</h1>
          <p className="text-sm text-brand-medium mt-1">{products.length} products total</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id || "" }); }}
          className="bg-brand-dark text-white px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-brand-dark/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4 flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-medium" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-brand-light text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-medium"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="border border-brand-light px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-medium"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.productCount})</option>
          ))}
        </select>
      </div>

      {/* Product list */}
      <div className="bg-white border border-brand-light">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-8 h-8 text-brand-medium mx-auto mb-2" />
            <div className="text-sm text-brand-medium">No products found</div>
            <button
              onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id || "" }); }}
              className="text-xs text-brand-accent hover:underline mt-2"
            >
              Create your first product
            </button>
          </div>
        ) : (
          <div className="divide-y divide-brand-light">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-brand-medium font-medium bg-brand-lightest">
              <div className="col-span-4">Product</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Provider</div>
              <div className="col-span-1">Actions</div>
            </div>
            {filtered.map((p) => (
              <div key={p.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-brand-lightest/50 transition-colors">
                <div className="col-span-12 md:col-span-4">
                  <div className="text-sm font-medium text-brand-dark">{p.name}</div>
                  <div className="text-[10px] text-brand-medium mt-0.5">{p.taeId}</div>
                </div>
                <div className="col-span-6 md:col-span-2 text-xs text-brand-medium">
                  {p.categoryName}
                </div>
                <div className="col-span-6 md:col-span-2 text-sm font-medium text-brand-dark">
                  ${(p.basePrice || 0).toFixed(2)}
                </div>
                <div className="col-span-4 md:col-span-1">
                  <span className={`text-[10px] px-2 py-0.5 font-medium ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="col-span-4 md:col-span-2 text-xs text-brand-medium capitalize">
                  {p.printProvider || "printful"}
                </div>
                <div className="col-span-4 md:col-span-1 flex items-center gap-1 justify-end">
                  <button onClick={() => handleEdit(p)} className="p-1.5 text-brand-medium hover:text-brand-dark transition-colors" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-brand-medium hover:text-red-600 transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 max-w-sm w-full">
            <h3 className="text-sm font-semibold text-brand-dark mb-2">Delete Product</h3>
            <p className="text-sm text-brand-medium mb-4">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-brand-light hover:bg-brand-lightest transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl my-8">
            <div className="px-6 py-4 border-b border-brand-light flex items-center justify-between">
              <h3 className="text-lg font-semibold text-brand-dark">
                {editId ? "Edit Product" : "New Product"}
              </h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-brand-medium hover:text-brand-dark">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  placeholder="e.g. Holiday Greeting Card 5x7"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Category *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  >
                    <option value="">Select...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Print Provider</label>
                  <select
                    value={form.printProvider}
                    onChange={(e) => setForm({ ...form, printProvider: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  >
                    <option value="printful">Printful</option>
                    <option value="custom">Custom / In-house</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Printful Product ID</label>
                  <input
                    type="text"
                    value={form.printfulProductId}
                    onChange={(e) => setForm({ ...form, printfulProductId: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    placeholder="e.g. 358"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Printful Variant ID</label>
                  <input
                    type="text"
                    value={form.printfulVariantId}
                    onChange={(e) => setForm({ ...form, printfulVariantId: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    placeholder="e.g. 10163"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Printful Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.printfulBasePrice}
                    onChange={(e) => setForm({ ...form, printfulBasePrice: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">TAE Add-on Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.taeAddOnFee}
                    onChange={(e) => setForm({ ...form, taeAddOnFee: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Size Label</label>
                  <input
                    type="text"
                    value={form.sizeLabel}
                    onChange={(e) => setForm({ ...form, sizeLabel: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    placeholder='e.g. 5" x 7"'
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Paper Type</label>
                  <input
                    type="text"
                    value={form.paperType}
                    onChange={(e) => setForm({ ...form, paperType: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    placeholder="e.g. Matte"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Finish Type</label>
                  <input
                    type="text"
                    value={form.finishType}
                    onChange={(e) => setForm({ ...form, finishType: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    placeholder="e.g. Glossy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Hero Image URL</label>
                <input
                  type="text"
                  value={form.heroImage}
                  onChange={(e) => setForm({ ...form, heroImage: e.target.value })}
                  className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={`w-5 h-5 border flex items-center justify-center transition-colors ${
                    form.active ? "bg-brand-dark border-brand-dark text-white" : "border-brand-light"
                  }`}
                >
                  {form.active && <Check className="w-3 h-3" />}
                </button>
                <span className="text-sm text-brand-dark">Active (visible in shop)</span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-brand-light flex items-center justify-end gap-2">
              <button
                onClick={() => { setShowForm(false); setEditId(null); }}
                className="px-4 py-2 text-sm border border-brand-light hover:bg-brand-lightest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="px-6 py-2 text-sm bg-brand-dark text-white hover:bg-brand-dark/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : editId ? "Update Product" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
