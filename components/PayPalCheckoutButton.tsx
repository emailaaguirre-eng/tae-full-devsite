'use client';

/**
 * PayPal Checkout Button Component
 * Copyright (c) 2026 B&D Servicing LLC. All rights reserved.
 *
 * Uses the PayPal JS SDK to render the PayPal button.
 * On approval, calls our capture endpoint to finalize the payment.
 *
 * Props:
 *  - orderId: our internal order ID (used to create the PayPal order server-side)
 *  - amount: total amount (for display)
 *  - onSuccess: callback after successful payment
 *  - onError: callback on error
 *  - onCancel: callback if user cancels
 *  - disabled: disable the button
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

interface PayPalCheckoutButtonProps {
  orderId: string;
  amount?: number;
  currency?: string;
  onSuccess?: (details: {
    paypalOrderId: string;
    captureId: string;
    payerEmail: string;
    payerName: string;
  }) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function PayPalCheckoutButton({
  orderId,
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  onCancel,
  disabled = false,
  className = '',
}: PayPalCheckoutButtonProps) {
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const buttonsRenderedRef = useRef(false);

  // Load the PayPal JS SDK
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.paypal) {
      setSdkReady(true);
      setLoading(false);
      return;
    }

    // Fetch client ID from our API
    fetch('/api/checkout/paypal/client-id')
      .then(res => res.json())
      .then(data => {
        if (!data.success || !data.clientId) {
          setError('PayPal is not configured');
          setLoading(false);
          return;
        }

        // Load the PayPal JS SDK script
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${data.clientId}&currency=${currency}&intent=capture`;
        script.async = true;

        script.onload = () => {
          setSdkReady(true);
          setLoading(false);
        };

        script.onerror = () => {
          setError('Failed to load PayPal SDK');
          setLoading(false);
        };

        document.head.appendChild(script);
      })
      .catch(err => {
        console.error('[PayPal] Failed to fetch client ID:', err);
        setError('Failed to initialize PayPal');
        setLoading(false);
      });
  }, [currency]);

  // Render PayPal buttons when SDK is ready
  useEffect(() => {
    if (!sdkReady || !window.paypal || !paypalContainerRef.current || disabled || buttonsRenderedRef.current) {
      return;
    }

    buttonsRenderedRef.current = true;

    try {
      window.paypal.Buttons({
        // Style the button
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 48,
        },

        // Called when the buyer clicks the PayPal button
        createOrder: async () => {
          try {
            const response = await fetch('/api/checkout/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId }),
            });

            const data = await response.json();

            if (!data.success) {
              throw new Error(data.error || 'Failed to create order');
            }

            return data.paypalOrderId;
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to create PayPal order';
            setError(msg);
            onError?.(msg);
            throw err;
          }
        },

        // Called after the buyer approves the payment
        onApprove: async (data: { orderID: string }) => {
          try {
            const response = await fetch('/api/checkout/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paypalOrderId: data.orderID,
                orderId,
              }),
            });

            const captureData = await response.json();

            if (!captureData.success) {
              throw new Error(captureData.error || 'Payment capture failed');
            }

            onSuccess?.({
              paypalOrderId: captureData.paypalOrderId,
              captureId: captureData.capture?.id || '',
              payerEmail: captureData.payer?.email || '',
              payerName: captureData.payer?.name || '',
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Payment capture failed';
            setError(msg);
            onError?.(msg);
          }
        },

        // Called if the buyer cancels the payment
        onCancel: () => {
          onCancel?.();
        },

        // Called on any error
        onError: (err: any) => {
          const msg = err?.message || 'An error occurred with PayPal';
          console.error('[PayPal Button Error]', err);
          setError(msg);
          onError?.(msg);
        },
      }).render(paypalContainerRef.current);
    } catch (err) {
      console.error('[PayPal] Failed to render buttons:', err);
      setError('Failed to render PayPal buttons');
    }
  }, [sdkReady, disabled, orderId, onSuccess, onError, onCancel]);

  // Reset buttons when orderId changes
  useEffect(() => {
    buttonsRenderedRef.current = false;
  }, [orderId]);

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 text-center ${className}`}>
        <p className="text-sm text-red-600 font-medium">PayPal Error</p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            buttonsRenderedRef.current = false;
            setSdkReady(false);
          }}
          className="mt-2 text-xs text-blue-600 hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading PayPal...</span>
        </div>
      )}
      <div
        ref={paypalContainerRef}
        className={loading ? 'hidden' : ''}
      />
      {amount != null && !loading && (
        <p className="text-center text-xs text-gray-500 mt-2">
          Total: ${amount.toFixed(2)} {currency}
        </p>
      )}
    </div>
  );
}
