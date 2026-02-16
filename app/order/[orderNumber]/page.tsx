"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Package,
  Truck,
  AlertCircle,
  ExternalLink,
  Copy,
} from "lucide-react";

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  customerEmail: string;
  customerName: string | null;
  subtotal: number;
  shippingCost: number;
  total: number;
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrier: string | null;
  printfulStatus: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemData[];
}

interface OrderItemData {
  id: string;
  itemName: string;
  itemType: string;
  quantity: number;
  unitPrice: number;
  basePrice: number;
  portal: {
    title: string;
    portalUrl: string;
    editUrl: string;
  } | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof Check }
> = {
  paid: { label: "Order Placed", color: "bg-blue-500", icon: Check },
  processing: {
    label: "Processing",
    color: "bg-yellow-500",
    icon: Package,
  },
  shipped: { label: "Shipped", color: "bg-green-500", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-600", icon: Check },
  failed: { label: "Failed", color: "bg-red-500", icon: AlertCircle },
  canceled: { label: "Canceled", color: "bg-gray-500", icon: AlertCircle },
};

export default function OrderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderNumber = params.orderNumber as string;
  const email = searchParams.get("email") || "";

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const url = email
      ? `/api/orders/${orderNumber}?email=${encodeURIComponent(email)}`
      : `/api/orders/${orderNumber}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setOrder(data.order);
        } else {
          setError(data.error || "Order not found");
        }
      })
      .catch(() => setError("Failed to load order"))
      .finally(() => setLoading(false));
  }, [orderNumber, email]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-brand-darkest/50">
          Loading order...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-brand-darkest mb-2">
            Order Not Found
          </h1>
          <p className="text-brand-darkest/60 mb-6">{error}</p>
          <Link href="/" className="text-brand-dark underline">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.paid;
  const StatusIcon = statusConfig.icon;
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const portalItems = order.items.filter((i) => i.portal);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div
            className={`w-16 h-16 ${statusConfig.color} rounded-full flex items-center justify-center mx-auto mb-4`}
          >
            <StatusIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-brand-darkest font-playfair mb-1">
            {order.status === "paid"
              ? "Thank You for Your Order!"
              : statusConfig.label}
          </h1>
          <p className="text-brand-darkest/60">
            Order{" "}
            <span className="font-mono font-semibold">
              {order.orderNumber}
            </span>
          </p>
          <p className="text-sm text-brand-darkest/40 mt-1">{orderDate}</p>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-brand-darkest mb-4">
            Order Status
          </h2>
          <div className="flex items-center gap-2">
            {["paid", "processing", "shipped", "delivered"].map(
              (s, i, arr) => {
                const isActive =
                  arr.indexOf(order.status) >= i ||
                  (order.status === "paid" && i === 0);
                return (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isActive
                          ? "bg-brand-dark text-white"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isActive ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <span
                      className={`text-xs hidden sm:block ${
                        isActive
                          ? "text-brand-darkest font-medium"
                          : "text-gray-400"
                      }`}
                    >
                      {STATUS_CONFIG[s]?.label || s}
                    </span>
                    {i < arr.length - 1 && (
                      <div
                        className={`flex-1 h-px ${
                          isActive ? "bg-brand-dark" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                );
              }
            )}
          </div>

          {/* Tracking info */}
          {order.trackingNumber && (
            <div className="mt-6 bg-green-50 rounded-xl p-4">
              <p className="text-sm font-medium text-green-800 mb-1">
                Tracking Information
              </p>
              <div className="flex items-center gap-2">
                {order.carrier && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {order.carrier}
                  </span>
                )}
                <span className="text-sm font-mono text-green-900">
                  {order.trackingNumber}
                </span>
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:text-green-900"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ArtKey Portals */}
        {portalItems.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-brand-darkest mb-4">
              Your ArtKey Portals
            </h2>
            <div className="space-y-4">
              {portalItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-brand-light rounded-xl p-4"
                >
                  <p className="font-medium text-brand-darkest text-sm mb-1">
                    {item.portal!.title}
                  </p>
                  <p className="text-xs text-brand-darkest/50 mb-3">
                    for &ldquo;{item.itemName}&rdquo;
                  </p>

                  {/* Portal URL */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-brand-darkest/40 w-12 shrink-0">
                      URL
                    </span>
                    <code className="text-xs bg-gray-50 px-2 py-1 rounded flex-1 text-brand-dark break-all">
                      {item.portal!.portalUrl}
                    </code>
                    <button
                      onClick={() =>
                        handleCopy(item.portal!.portalUrl, item.id + "-url")
                      }
                      className="text-brand-darkest/30 hover:text-brand-dark"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copied === item.id + "-url" && (
                      <span className="text-[10px] text-green-600">
                        Copied!
                      </span>
                    )}
                  </div>

                  {/* Edit link */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-brand-darkest/40 w-12 shrink-0">
                      Edit
                    </span>
                    <Link
                      href={item.portal!.editUrl}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit your portal &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-brand-darkest/40 mt-4">
              Your portals are live now. Guests who scan your product&apos;s QR
              code will see your portal. You can update the content anytime.
            </p>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-brand-darkest mb-4">
            Order Items
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-brand-darkest">
                    {item.itemName}
                  </p>
                  <p className="text-xs text-brand-darkest/50">
                    Qty: {item.quantity}{" "}
                    {item.itemType === "custom" && (
                      <span className="ml-1 bg-brand-light/50 text-brand-dark px-1.5 py-0.5 rounded-full text-[10px]">
                        ArtKey
                      </span>
                    )}
                  </p>
                </div>
                <p className="font-medium text-brand-darkest text-sm">
                  ${((item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-brand-darkest/60">Subtotal</span>
              <span>${(order.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-darkest/60">Shipping</span>
              <span>
                {(order.shippingCost || 0) > 0
                  ? `$${order.shippingCost!.toFixed(2)}`
                  : "Free"}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-gray-100 pt-3">
              <span>Total</span>
              <span className="text-brand-dark">
                ${(order.total || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Confirmation details */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-brand-darkest mb-3">
            Order Details
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-brand-darkest/50 text-xs mb-1">
                Confirmation sent to
              </p>
              <p className="text-brand-darkest">{order.customerEmail}</p>
            </div>
            {order.customerName && (
              <div>
                <p className="text-brand-darkest/50 text-xs mb-1">Name</p>
                <p className="text-brand-darkest">{order.customerName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className="bg-brand-dark text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-darkest transition-colors text-sm"
          >
            Continue Shopping
          </Link>
          {order.trackingUrl && (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-brand-dark text-brand-dark px-8 py-3 rounded-full font-semibold hover:bg-brand-dark hover:text-white transition-colors text-sm flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              Track Package
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
