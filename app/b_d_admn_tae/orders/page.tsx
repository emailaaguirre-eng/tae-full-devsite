"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X,
  ShoppingCart,
  Search,
  Eye,
  Truck,
  Package,
  ExternalLink,
} from "lucide-react";

interface OrderItem {
  id: string;
  itemName: string;
  itemType: string;
  quantity: number;
  unitPrice: number;
  basePrice: number;
  artKeyId: string | null;
  qrCodeUrl: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customerId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  subtotal: number;
  shippingCost: number;
  total: number;
  printfulOrderId: string | null;
  printfulStatus: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrier: string | null;
  createdAt: string | null;
  items: OrderItem[];
  itemCount: number;
}

const STATUS_OPTIONS = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editTracking, setEditTracking] = useState({ number: "", url: "", carrier: "" });
  const [saving, setSaving] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const url = filterStatus ? `/api/admin/orders?status=${filterStatus}` : "/api/admin/orders";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setOrders(data.data || []);
      else setError(data.error);
    } catch {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleView = (o: Order) => {
    setViewOrder(o);
    setEditStatus(o.status || "pending");
    setEditTracking({
      number: o.trackingNumber || "",
      url: o.trackingUrl || "",
      carrier: o.carrier || "",
    });
  };

  const handleUpdateOrder = async () => {
    if (!viewOrder) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${viewOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          trackingNumber: editTracking.number || null,
          trackingUrl: editTracking.url || null,
          carrier: editTracking.carrier || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setViewOrder(null);
        await loadOrders();
      } else {
        setError(data.error || "Update failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      paid: "bg-green-100 text-green-700",
      processing: "bg-blue-100 text-blue-700",
      shipped: "bg-indigo-100 text-indigo-700",
      delivered: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-brand-medium text-sm">Loading orders...</div></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-dark font-playfair">Orders</h1>
        <p className="text-sm text-brand-medium mt-1">{orders.length} orders total</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4 flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-medium" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-brand-light text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-medium"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-brand-light px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-medium"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-brand-light">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingCart className="w-8 h-8 text-brand-medium mx-auto mb-2" />
            <div className="text-sm text-brand-medium">No orders found</div>
          </div>
        ) : (
          <div className="divide-y divide-brand-light">
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-brand-medium font-medium bg-brand-lightest">
              <div className="col-span-2">Order #</div>
              <div className="col-span-3">Customer</div>
              <div className="col-span-1">Items</div>
              <div className="col-span-2">Total</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Actions</div>
            </div>
            {filtered.map((o) => (
              <div key={o.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-brand-lightest/50 transition-colors">
                <div className="col-span-2">
                  <div className="text-sm font-medium text-brand-dark">{o.orderNumber}</div>
                  <div className="text-[10px] text-brand-medium">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ""}</div>
                </div>
                <div className="col-span-3">
                  <div className="text-sm text-brand-dark">{o.customerName || "Guest"}</div>
                  <div className="text-[10px] text-brand-medium">{o.customerEmail}</div>
                </div>
                <div className="col-span-1 text-sm text-brand-dark">{o.itemCount}</div>
                <div className="col-span-2 text-sm font-medium text-brand-dark">
                  ${(o.total || 0).toFixed(2)}
                </div>
                <div className="col-span-2">
                  <span className={`text-[10px] px-2 py-0.5 font-medium uppercase ${statusBadge(o.status || "pending")}`}>
                    {o.status}
                  </span>
                  {o.trackingNumber && <Truck className="w-3 h-3 text-brand-medium ml-1 inline" />}
                </div>
                <div className="col-span-2 flex items-center gap-1 justify-end">
                  <button onClick={() => handleView(o)} className="p-1.5 text-brand-medium hover:text-brand-dark transition-colors" title="View / Edit">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order detail / edit modal */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl my-8">
            <div className="px-6 py-4 border-b border-brand-light flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-brand-dark">Order {viewOrder.orderNumber}</h3>
                <p className="text-xs text-brand-medium mt-0.5">
                  {viewOrder.createdAt ? new Date(viewOrder.createdAt).toLocaleString() : ""}
                </p>
              </div>
              <button onClick={() => setViewOrder(null)}><X className="w-5 h-5 text-brand-medium" /></button>
            </div>
            <div className="p-6">
              {/* Customer info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-[10px] text-brand-medium uppercase tracking-wider mb-1">Customer</div>
                  <div className="text-sm text-brand-dark">{viewOrder.customerName || "Guest"}</div>
                  <div className="text-xs text-brand-medium">{viewOrder.customerEmail}</div>
                </div>
                <div>
                  <div className="text-[10px] text-brand-medium uppercase tracking-wider mb-1">Printful</div>
                  <div className="text-sm text-brand-dark">
                    {viewOrder.printfulOrderId ? `#${viewOrder.printfulOrderId}` : "Not submitted"}
                  </div>
                  {viewOrder.printfulStatus && (
                    <div className="text-xs text-brand-medium">{viewOrder.printfulStatus}</div>
                  )}
                </div>
              </div>

              {/* Items */}
              <h4 className="text-sm font-semibold text-brand-dark mb-2">Items</h4>
              <div className="border border-brand-light divide-y divide-brand-light mb-6">
                {viewOrder.items.map((item) => (
                  <div key={item.id} className="px-4 py-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-brand-dark">{item.itemName}</div>
                      <div className="text-[10px] text-brand-medium">
                        {item.itemType} {item.quantity > 1 ? `x${item.quantity}` : ""}
                        {item.artKeyId && " | Has ArtKey Portal"}
                      </div>
                    </div>
                    <div className="text-sm font-medium">${(item.unitPrice || 0).toFixed(2)}</div>
                  </div>
                ))}
                <div className="px-4 py-2 flex items-center justify-between bg-brand-lightest">
                  <div className="text-sm font-medium text-brand-dark">Total</div>
                  <div className="text-sm font-bold text-brand-dark">${(viewOrder.total || 0).toFixed(2)}</div>
                </div>
              </div>

              {/* Status update */}
              <h4 className="text-sm font-semibold text-brand-dark mb-2">Update Order</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1 uppercase tracking-wider">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full border border-brand-light px-4 py-2 text-sm bg-brand-lightest focus:outline-none focus:ring-2 focus:ring-brand-medium"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-brand-dark/70 mb-1 uppercase tracking-wider">Tracking #</label>
                    <input
                      type="text"
                      value={editTracking.number}
                      onChange={(e) => setEditTracking({ ...editTracking, number: e.target.value })}
                      className="w-full border border-brand-light px-3 py-2 text-sm bg-brand-lightest focus:outline-none focus:ring-2 focus:ring-brand-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-dark/70 mb-1 uppercase tracking-wider">Carrier</label>
                    <input
                      type="text"
                      value={editTracking.carrier}
                      onChange={(e) => setEditTracking({ ...editTracking, carrier: e.target.value })}
                      className="w-full border border-brand-light px-3 py-2 text-sm bg-brand-lightest focus:outline-none focus:ring-2 focus:ring-brand-medium"
                      placeholder="e.g. USPS"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-dark/70 mb-1 uppercase tracking-wider">Tracking URL</label>
                    <input
                      type="text"
                      value={editTracking.url}
                      onChange={(e) => setEditTracking({ ...editTracking, url: e.target.value })}
                      className="w-full border border-brand-light px-3 py-2 text-sm bg-brand-lightest focus:outline-none focus:ring-2 focus:ring-brand-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-brand-light flex items-center justify-end gap-2">
              <button onClick={() => setViewOrder(null)} className="px-4 py-2 text-sm border border-brand-light hover:bg-brand-lightest transition-colors">Close</button>
              <button
                onClick={handleUpdateOrder}
                disabled={saving}
                className="px-6 py-2 text-sm bg-brand-dark text-white hover:bg-brand-dark/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Update Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
