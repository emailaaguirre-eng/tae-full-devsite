"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Grid3X3,
  Users,
  ShoppingCart,
  QrCode,
  DollarSign,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

interface Stats {
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  totalCustomers: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalArtKeys: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  total: number;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
          setRecentOrders(data.recentOrders || []);
        } else {
          setError(data.error || "Failed to load");
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-medium text-sm">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-sm">
        {error}
      </div>
    );
  }

  const statCards = [
    { label: "Products", value: stats?.activeProducts || 0, sub: `${stats?.totalProducts || 0} total`, icon: Package, href: "/b_d_admn_tae/catalog/products", color: "bg-blue-50 text-blue-600" },
    { label: "Categories", value: stats?.totalCategories || 0, icon: Grid3X3, href: "/b_d_admn_tae/catalog/categories", color: "bg-purple-50 text-purple-600" },
    { label: "Customers", value: stats?.totalCustomers || 0, icon: Users, href: "/b_d_admn_tae/customers", color: "bg-green-50 text-green-600" },
    { label: "Orders", value: stats?.totalOrders || 0, sub: `${stats?.pendingOrders || 0} pending`, icon: ShoppingCart, href: "/b_d_admn_tae/orders", color: "bg-amber-50 text-amber-600" },
    { label: "Revenue", value: `$${(stats?.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { label: "ArtKey Portals", value: stats?.totalArtKeys || 0, icon: QrCode, href: "/b_d_admn_tae/artkey-demos", color: "bg-rose-50 text-rose-600" },
  ];

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      paid: "bg-green-100 text-green-700",
      shipped: "bg-blue-100 text-blue-700",
      delivered: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-dark font-playfair">Dashboard</h1>
        <p className="text-sm text-brand-medium mt-1">Overview of your store</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white border border-brand-light p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-brand-dark">{card.value}</div>
            <div className="text-xs text-brand-medium mt-0.5">{card.label}</div>
            {card.sub && <div className="text-[10px] text-brand-medium/60 mt-0.5">{card.sub}</div>}
            {card.href && (
              <Link
                href={card.href}
                className="text-[10px] text-brand-accent hover:underline mt-2 inline-flex items-center gap-1"
              >
                View <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/b_d_admn_tae/catalog/products?action=new"
          className="bg-brand-dark text-white p-4 hover:bg-brand-dark/90 transition-colors"
        >
          <Package className="w-5 h-5 mb-2" />
          <div className="text-sm font-semibold">Add Product</div>
          <div className="text-xs text-white/60 mt-0.5">Create a new shop product</div>
        </Link>
        <Link
          href="/b_d_admn_tae/artkey-demos?action=new"
          className="bg-brand-dark text-white p-4 hover:bg-brand-dark/90 transition-colors"
        >
          <QrCode className="w-5 h-5 mb-2" />
          <div className="text-sm font-semibold">Create ArtKey Demo</div>
          <div className="text-xs text-white/60 mt-0.5">Generate a portal URL + QR code</div>
        </Link>
        <Link
          href="/b_d_admn_tae/orders"
          className="bg-brand-dark text-white p-4 hover:bg-brand-dark/90 transition-colors"
        >
          <TrendingUp className="w-5 h-5 mb-2" />
          <div className="text-sm font-semibold">View Orders</div>
          <div className="text-xs text-white/60 mt-0.5">Manage pending and fulfilled orders</div>
        </Link>
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-brand-light">
        <div className="px-4 py-3 border-b border-brand-light flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-dark">Recent Orders</h2>
          <Link href="/b_d_admn_tae/orders" className="text-xs text-brand-accent hover:underline">
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-sm text-brand-medium">
            No orders yet. Orders will appear here once customers start purchasing.
          </div>
        ) : (
          <div className="divide-y divide-brand-light">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-brand-dark">{order.orderNumber}</div>
                  <div className="text-xs text-brand-medium">
                    {order.customerName || order.customerEmail || "Guest"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2 py-0.5 font-medium uppercase ${statusBadge(order.status || "pending")}`}>
                    {order.status}
                  </span>
                  <span className="text-sm font-medium text-brand-dark">
                    ${(order.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
