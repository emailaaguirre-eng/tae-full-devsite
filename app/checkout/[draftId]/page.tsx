'use client';

/**
 * Checkout Page
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Draft {
  id: string;
  printSpecId: string;
  dpi: number;
  designJsonFront: any;
  designJsonBack: any;
  previewPngFront: string | null;
  previewPngBack: string | null;
  status: string;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postCode: string;
  country: string;
  email: string;
  phone: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.draftId as string;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  const [address, setAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postCode: '',
    country: 'US',
    email: '',
    phone: '',
  });

  // Fetch draft
  useEffect(() => {
    async function fetchDraft() {
      try {
        const response = await fetch(`/api/drafts/${draftId}`);
        const data = await response.json();
        
        if (!data.success) {
          setError(data.error || 'Draft not found');
          return;
        }
        
        setDraft(data.data);
      } catch (err) {
        setError('Failed to load order');
      } finally {
        setLoading(false);
      }
    }
    
    fetchDraft();
  }, [draftId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!draft) return;
    
    // Validate required fields
    const required = ['firstName', 'lastName', 'addressLine1', 'city', 'postCode', 'country', 'email'];
    for (const field of required) {
      if (!address[field as keyof ShippingAddress]) {
        setError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType: 'draft', // Create as draft first
          orderReferenceId: `TAE-${Date.now()}`,
          currency: 'USD',
          items: [
            {
              itemReferenceId: `item-${draftId}`,
              productUid: draft.printSpecId,
              files: [
                // Note: In production, these would be uploaded file URLs
                { type: 'default', url: 'https://placeholder.com/front.png' },
              ],
              quantity,
            },
          ],
          shippingAddress: {
            firstName: address.firstName,
            lastName: address.lastName,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 || undefined,
            city: address.city,
            postCode: address.postCode,
            state: address.state || undefined,
            country: address.country,
            email: address.email,
            phone: address.phone || undefined,
          },
          metadata: {
            draftId,
          },
        }),
      });
      
      const orderResult = await orderResponse.json();
      
      if (!orderResult.success) {
        setError(orderResult.error || 'Failed to create order');
        return;
      }
      
      // Update draft status
      await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draftId,
          status: 'checkout_ready',
        }),
      });
      
      // Redirect to confirmation
      router.push(`/checkout/confirmation?orderId=${orderResult.data.id}`);
    } catch (err) {
      console.error('Order error:', err);
      setError('Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error && !draft) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Error</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link href="/shop" className="text-amber-600 hover:underline">
            ← Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmitOrder} className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Shipping Address</h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={address.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={address.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={address.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={address.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={address.addressLine1}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={address.addressLine2}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State/Province</label>
                  <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Postal Code *</label>
                  <input
                    type="text"
                    name="postCode"
                    value={address.postCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
                  <select
                    name="country"
                    value={address.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                  </select>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </div>
          
          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>
              
              {/* Preview */}
              <div className="aspect-[4/3] bg-slate-100 rounded-lg mb-4 flex items-center justify-center">
                {draft?.previewPngFront ? (
                  <img 
                    src={draft.previewPngFront} 
                    alt="Design preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-slate-400">Your design</span>
                )}
              </div>
              
              {/* Quantity */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {[1, 5, 10, 25, 50, 100].map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              
              {/* Price breakdown */}
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Product</span>
                  <span className="text-slate-900">--</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Quantity</span>
                  <span className="text-slate-900">×{quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Shipping</span>
                  <span className="text-slate-900">Calculated at checkout</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>--</span>
                </div>
              </div>
              
              <p className="mt-4 text-xs text-slate-500 text-center">
                Pricing will be calculated based on your selections
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
