'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle, ExternalLink, ArrowLeft } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderData {
  orderNumber: string;
  status: string;
  statusLabel: string;
  statusDescription: string;
  statusColor: string;
  total: number;
  createdAt: string;
  tracking: {
    number: string;
    url: string | null;
    carrier: string | null;
  } | null;
  gelatoStatus: string | null;
  items: OrderItem[];
  itemCount: number;
}

export default function OrderStatusPage() {
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<OrderData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await fetch('/api/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, orderNumber }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to find order');
      } else {
        setOrder(data.order);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'paid':
        return <Clock className="w-6 h-6" />;
      case 'processing':
        return <Package className="w-6 h-6" />;
      case 'shipped':
        return <Truck className="w-6 h-6" />;
      case 'delivered':
      case 'completed':
        return <CheckCircle className="w-6 h-6" />;
      case 'cancelled':
        return <AlertCircle className="w-6 h-6" />;
      default:
        return <Package className="w-6 h-6" />;
    }
  };

  const getStatusColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      red: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[color] || colors['yellow'];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600">Enter your email and order number to check your order status</p>
        </div>

        {/* Lookup Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Order Number
              </label>
              <input
                type="text"
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="TAE-ORD-20260120-001"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow font-mono"
              />
              <p className="mt-1 text-xs text-gray-500">
                You can find this in your order confirmation email
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Looking up order...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Track Order
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Result */}
        {order && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Status Header */}
            <div className={`p-6 border-b-4 ${getStatusColorClasses(order.statusColor)}`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/50 rounded-full">
                  {getStatusIcon(order.status)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{order.statusLabel}</h2>
                  <p className="text-sm opacity-80">{order.statusDescription}</p>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="font-mono font-semibold">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-semibold">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Items</p>
                  <p className="font-semibold">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-semibold text-lg">{formatCurrency(order.total)}</p>
                </div>
              </div>

              {/* Tracking Info */}
              {order.tracking && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Shipping Information
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-gray-600">Carrier:</span>{' '}
                      <span className="font-medium">{order.tracking.carrier || 'Standard Shipping'}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-600">Tracking Number:</span>{' '}
                      <span className="font-mono font-medium">{order.tracking.number}</span>
                    </p>
                    {order.tracking.url && (
                      <a
                        href={order.tracking.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 text-sm font-medium mt-2"
                      >
                        Track Package <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Items List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gelato Status (if available) */}
              {order.gelatoStatus && (
                <div className="text-xs text-gray-400 pt-4 border-t">
                  Production Status: {order.gelatoStatus}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4">
              <p className="text-sm text-gray-600">
                Questions about your order?{' '}
                <Link href="/contact" className="text-amber-600 hover:text-amber-700 font-medium">
                  Contact us
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Help Text */}
        {!order && (
          <div className="text-center text-sm text-gray-500">
            <p>Can&apos;t find your order confirmation email?</p>
            <Link href="/contact" className="text-amber-600 hover:text-amber-700 font-medium">
              Contact our support team
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
