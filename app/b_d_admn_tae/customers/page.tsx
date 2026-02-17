"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  Search,
  Mail,
  Phone,
  DollarSign,
  Eye,
} from "lucide-react";

interface Customer {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  notes: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

const EMPTY_FORM = { name: "", email: "", phone: "", notes: "" };

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [viewCustomer, setViewCustomer] = useState<any>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (data.success) setCustomers(data.data || []);
      else setError(data.error);
    } catch {
      setError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const handleEdit = (c: Customer) => {
    setEditId(c.id);
    setForm({
      name: c.name || "",
      email: c.email,
      phone: c.phone || "",
      notes: c.notes || "",
    });
    setShowForm(true);
  };

  const handleView = async (id: string) => {
    setViewLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      const data = await res.json();
      if (data.success) setViewCustomer(data.data);
    } catch {
      setError("Failed to load customer");
    } finally {
      setViewLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      let res;
      if (editId) {
        res = await fetch(`/api/admin/customers/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, phone: form.phone, notes: form.notes }),
        });
      } else {
        res = await fetch("/api/admin/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setEditId(null);
        setForm(EMPTY_FORM);
        await loadCustomers();
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
    if (!confirm("Delete this customer? Customers with orders cannot be deleted.")) return;
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) await loadCustomers();
      else setError(data.error || "Delete failed");
    } catch {
      setError("Network error");
    }
  };

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.email.toLowerCase().includes(q) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-brand-medium text-sm">Loading customers...</div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-playfair">Customers</h1>
          <p className="text-sm text-brand-medium mt-1">{customers.length} customers</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
          className="bg-brand-dark text-white px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-brand-dark/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4 flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-medium" />
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-brand-light text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-medium"
        />
      </div>

      <div className="bg-white border border-brand-light">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-8 h-8 text-brand-medium mx-auto mb-2" />
            <div className="text-sm text-brand-medium">No customers found</div>
          </div>
        ) : (
          <div className="divide-y divide-brand-light">
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-brand-medium font-medium bg-brand-lightest">
              <div className="col-span-3">Customer</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Phone</div>
              <div className="col-span-1">Orders</div>
              <div className="col-span-1">Spent</div>
              <div className="col-span-2">Actions</div>
            </div>
            {filtered.map((c) => (
              <div key={c.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-brand-lightest/50 transition-colors">
                <div className="col-span-3">
                  <div className="text-sm font-medium text-brand-dark">{c.name || "Unnamed"}</div>
                </div>
                <div className="col-span-3 text-xs text-brand-medium flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {c.email}
                </div>
                <div className="col-span-2 text-xs text-brand-medium">
                  {c.phone ? <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span> : "—"}
                </div>
                <div className="col-span-1 text-sm text-brand-dark">{c.orderCount}</div>
                <div className="col-span-1 text-sm font-medium text-brand-dark">
                  ${(c.totalSpent || 0).toFixed(2)}
                </div>
                <div className="col-span-2 flex items-center gap-1 justify-end">
                  <button onClick={() => handleView(c.id)} className="p-1.5 text-brand-medium hover:text-brand-dark transition-colors" title="View Details">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleEdit(c)} className="p-1.5 text-brand-medium hover:text-brand-dark transition-colors" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-brand-medium hover:text-red-600 transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer detail view */}
      {viewCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl my-8">
            <div className="px-6 py-4 border-b border-brand-light flex items-center justify-between">
              <h3 className="text-lg font-semibold text-brand-dark">{viewCustomer.name || viewCustomer.email}</h3>
              <button onClick={() => setViewCustomer(null)}><X className="w-5 h-5 text-brand-medium" /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-[10px] text-brand-medium uppercase tracking-wider mb-1">Email</div>
                  <div className="text-sm text-brand-dark">{viewCustomer.email}</div>
                </div>
                <div>
                  <div className="text-[10px] text-brand-medium uppercase tracking-wider mb-1">Phone</div>
                  <div className="text-sm text-brand-dark">{viewCustomer.phone || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-brand-medium uppercase tracking-wider mb-1">Notes</div>
                  <div className="text-sm text-brand-dark">{viewCustomer.notes || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-brand-medium uppercase tracking-wider mb-1">Member Since</div>
                  <div className="text-sm text-brand-dark">{viewCustomer.createdAt ? new Date(viewCustomer.createdAt).toLocaleDateString() : "—"}</div>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-brand-dark mb-3">Order History</h4>
              {!viewCustomer.orders?.length ? (
                <div className="text-sm text-brand-medium">No orders yet.</div>
              ) : (
                <div className="divide-y divide-brand-light border border-brand-light">
                  {viewCustomer.orders.map((o: any) => (
                    <div key={o.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-brand-dark">{o.orderNumber}</span>
                        <span className="text-sm font-medium">${(o.total || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-brand-medium">
                        <span className={`px-2 py-0.5 text-[10px] font-medium ${
                          o.status === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}>{o.status}</span>
                        <span>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ""}</span>
                        <span>{o.items?.length || 0} items</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md my-8">
            <div className="px-6 py-4 border-b border-brand-light flex items-center justify-between">
              <h3 className="text-lg font-semibold text-brand-dark">{editId ? "Edit Customer" : "New Customer"}</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }}><X className="w-5 h-5 text-brand-medium" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest" />
              </div>
              {!editId && (
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Phone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest" />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                  className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-brand-light flex items-center justify-end gap-2">
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 text-sm border border-brand-light hover:bg-brand-lightest transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || (!editId && !form.email)}
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
