'use client';

/**
 * Order Confirmation Page
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 */

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Received!</h1>
        <p className="text-slate-600 mb-6">
          Thank you for your order. We've received your design and will begin processing it shortly.
        </p>
        
        {orderId && (
          <div className="bg-slate-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-500">Order Reference</p>
            <p className="font-mono font-semibold text-slate-900">{orderId}</p>
          </div>
        )}
        
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            A confirmation email will be sent to you with tracking information once your order ships.
          </p>
          
          <div className="border-t border-slate-200 pt-4 mt-4">
            <Link
              href="/shop"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
