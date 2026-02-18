"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import type { CartItem } from "@/contexts/CartContext";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, AlertCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ShippingInfo {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface ProofItem {
  cartItemId: string;
  portalToken: string | null;
  ownerToken: string | null;
  portalUrl: string | null;
  editUrl: string | null;
  proofFiles: { placement: string; dataUrl: string }[];
}

type CheckoutStep = "shipping" | "proof" | "payment" | "complete";

// ─── Checkout Page ───────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, getTotalPrice, getItemCount, clearCart } = useCart();

  const [step, setStep] = useState<CheckoutStep>("shipping");
  const [shipping, setShipping] = useState<ShippingInfo>({
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });

  const [proofs, setProofs] = useState<ProofItem[]>([]);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const subtotal = getTotalPrice();
  const shippingCost = 0; // Calculated at fulfillment
  const total = subtotal + shippingCost;

  const hasQrItems = cart.some((item) => item.requiresQrCode);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0 && step !== "complete") {
      router.push("/cart");
    }
  }, [cart, step, router]);

  // ─── Shipping Form ──────────────────────────────────────────────────────

  const handleShippingSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (hasQrItems) {
        // Generate proofs for QR items
        setStep("proof");
        setProofLoading(true);
        setProofError(null);

        try {
          const qrItems = cart
            .filter((item) => item.requiresQrCode)
            .map((item) => ({
              cartItemId: item.id,
              designFiles: item.designFiles || [],
              artKeyData: item.artKeyData || {},
              artKeyTemplatePosition: item.artKeyTemplatePosition || null,
              requiresQrCode: true,
            }));

          const res = await fetch("/api/proof/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: qrItems,
              customerEmail: shipping.email,
            }),
          });

          const data = await res.json();
          if (data.success) {
            setProofs(data.proofs);
          } else {
            setProofError(data.error || "Failed to generate proofs");
          }
        } catch (err) {
          setProofError("Network error generating proofs");
        } finally {
          setProofLoading(false);
        }
      } else {
        // No QR items, skip to payment
        setStep("payment");
      }
    },
    [cart, hasQrItems]
  );

  const handleApproveProofs = () => {
    setStep("payment");
  };

  // ─── Payment (PayPal placeholder) ───────────────────────────────────────

  const handlePayment = useCallback(async () => {
    setPaymentLoading(true);

    try {
      // Build items with portal tokens from proofs
      const orderItems = cart.map((item) => {
        const proof = proofs.find((p) => p.cartItemId === item.id);
        return {
          cartItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          printfulProductId: item.printfulProductId,
          printfulVariantId: item.printfulVariantId,
          productSlug: item.productSlug,
          designFiles: proof?.proofFiles || item.designFiles,
          requiresQrCode: item.requiresQrCode,
          portalToken: proof?.portalToken,
          portalUrl: proof?.portalUrl,
          artKeyData: item.artKeyData,
        };
      });

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paypalOrderId: `DEMO-${Date.now()}`,
          paypalTransactionId: `DEMO-TXN-${Date.now()}`,
          customer: {
            name: shipping.name,
            email: shipping.email,
            phone: shipping.phone,
          },
          shipping: {
            line1: shipping.line1,
            line2: shipping.line2,
            city: shipping.city,
            state: shipping.state,
            zip: shipping.zip,
            country: shipping.country,
          },
          items: orderItems,
          subtotal,
          shippingCost,
          total,
        }),
      });

      const data = await res.json();
      if (data.success) {
        clearCart();
        // Redirect to the dedicated order confirmation page
        router.push(
          `/order/${data.order.orderNumber}?email=${encodeURIComponent(
            shipping.email
          )}`
        );
      } else {
        alert(data.error || "Order failed");
      }
    } catch (err) {
      alert("Payment processing failed");
    } finally {
      setPaymentLoading(false);
    }
  }, [cart, proofs, shipping, subtotal, shippingCost, total, clearCart]);

  // ─── Step Indicator ─────────────────────────────────────────────────────

  const steps: { key: CheckoutStep; label: string }[] = [
    { key: "shipping", label: "Shipping" },
    ...(hasQrItems ? [{ key: "proof" as CheckoutStep, label: "Proof" }] : []),
    { key: "payment", label: "Payment" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i <= currentStepIndex
                    ? "bg-brand-dark text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {i < currentStepIndex ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  i <= currentStepIndex
                    ? "text-brand-darkest"
                    : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className="w-12 h-px bg-gray-300 mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* ─── STEP: Shipping ─────────────────────────────────────── */}
        {step === "shipping" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <form
              onSubmit={handleShippingSubmit}
              className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-8"
            >
              <h2 className="text-xl font-bold text-brand-darkest mb-6">
                Shipping Information
              </h2>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-brand-darkest/70 mb-1">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={shipping.name}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, name: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-darkest/70 mb-1">
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    value={shipping.email}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, email: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-darkest/70 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={shipping.phone}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, phone: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-medium focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-brand-darkest/70 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    required
                    type="text"
                    value={shipping.line1}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, line1: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-medium focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-brand-darkest/70 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={shipping.line2}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, line2: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-darkest/70 mb-1">
                    City *
                  </label>
                  <input
                    required
                    type="text"
                    value={shipping.city}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, city: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-darkest/70 mb-1">
                    State / Province *
                  </label>
                  <input
                    required
                    type="text"
                    value={shipping.state}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, state: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-darkest/70 mb-1">
                    ZIP / Postal Code *
                  </label>
                  <input
                    required
                    type="text"
                    value={shipping.zip}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, zip: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-darkest/70 mb-1">
                    Country *
                  </label>
                  <select
                    required
                    value={shipping.country}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, country: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-medium focus:outline-none"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-dark text-white py-3 rounded-full font-semibold hover:bg-brand-darkest transition-colors"
              >
                {hasQrItems ? "Continue to Proof Review" : "Continue to Payment"}
              </button>
            </form>

            {/* Order Summary Sidebar */}
            <OrderSummary
              cart={cart}
              subtotal={subtotal}
              shippingCost={shippingCost}
              total={total}
            />
          </div>
        )}

        {/* ─── STEP: Proof Approval ───────────────────────────────── */}
        {step === "proof" && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-xl font-bold text-brand-darkest mb-2">
                Approve Your Proof
              </h2>
              <p className="text-sm text-brand-darkest/60 mb-8">
                We&apos;ve generated the real QR codes for your ArtKey portals.
                Review each design below — the QR code now links to your unique
                portal URL. Approve to continue to payment.
              </p>

              {proofLoading && (
                <div className="text-center py-16">
                  <Loader2 className="w-10 h-10 text-brand-dark animate-spin mx-auto mb-4" />
                  <p className="text-brand-darkest/60">
                    Generating your proofs with real QR codes...
                  </p>
                  <p className="text-xs text-brand-darkest/40 mt-1">
                    This is where the magic happens.
                  </p>
                </div>
              )}

              {proofError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                  <p className="text-red-700 font-medium">{proofError}</p>
                  <button
                    onClick={() => {
                      setStep("shipping");
                      setProofError(null);
                    }}
                    className="mt-4 text-sm text-red-600 underline"
                  >
                    Go back and try again
                  </button>
                </div>
              )}

              {!proofLoading && !proofError && proofs.length > 0 && (
                <>
                  <div className="space-y-8">
                    {proofs.map((proof) => {
                      const cartItem = cart.find(
                        (c) => c.id === proof.cartItemId
                      );
                      return (
                        <div
                          key={proof.cartItemId}
                          className="border border-gray-100 rounded-xl p-6"
                        >
                          <h3 className="font-semibold text-brand-darkest mb-1">
                            {cartItem?.name || "Product"}
                          </h3>
                          {proof.portalUrl && (
                            <p className="text-xs text-brand-medium mb-4 break-all">
                              Portal: {proof.portalUrl}
                            </p>
                          )}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {proof.proofFiles.map((pf) => (
                              <div
                                key={pf.placement}
                                className="bg-gray-50 rounded-lg overflow-hidden"
                              >
                                <img
                                  src={pf.dataUrl}
                                  alt={`${pf.placement} proof`}
                                  className="w-full aspect-[3/4] object-contain"
                                />
                                <p className="text-[10px] text-center text-brand-darkest/50 py-1 capitalize">
                                  {pf.placement}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={() => setStep("shipping")}
                      className="flex-1 border-2 border-gray-200 text-brand-darkest py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Edit Shipping
                    </button>
                    <button
                      onClick={handleApproveProofs}
                      className="flex-1 bg-brand-dark text-white py-3 rounded-full font-semibold hover:bg-brand-darkest transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approve &amp; Continue to Payment
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP: Payment ──────────────────────────────────────── */}
        {step === "payment" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-xl font-bold text-brand-darkest mb-6">
                Payment
              </h2>

              <div className="bg-brand-light/20 border border-brand-medium/20 rounded-xl p-6 mb-6">
                <p className="text-sm text-brand-darkest/70">
                  <span className="font-semibold">PayPal integration ready.</span>{" "}
                  When you set the{" "}
                  <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                    NEXT_PUBLIC_PAYPAL_CLIENT_ID
                  </code>{" "}
                  environment variable, the PayPal buttons will appear here
                  automatically. For now, use the demo button below.
                </p>
              </div>

              {/* PayPal buttons will be rendered here when configured */}
              <PayPalSection
                total={total}
                onSuccess={handlePayment}
                loading={paymentLoading}
              />
            </div>

            <OrderSummary
              cart={cart}
              subtotal={subtotal}
              shippingCost={shippingCost}
              total={total}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Order Summary Component ──────────────────────────────────────────────

function OrderSummary({
  cart,
  subtotal,
  shippingCost,
  total,
}: {
  cart: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="font-bold text-brand-darkest mb-4">Order Summary</h3>
      <div className="space-y-3 mb-4">
        {cart.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-brand-darkest/70 truncate mr-2">
              {item.name} x{item.quantity}
            </span>
            <span className="font-medium text-brand-darkest whitespace-nowrap">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 pt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-brand-darkest/60">Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-brand-darkest/60">Shipping</span>
          <span className="text-brand-darkest/60 text-xs">
            {shippingCost > 0
              ? `$${shippingCost.toFixed(2)}`
              : "Calculated after order"}
          </span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t border-gray-100 pt-3">
          <span>Total</span>
          <span className="text-brand-dark">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── PayPal Section ───────────────────────────────────────────────────────

function PayPalSection({
  total,
  onSuccess,
  loading,
}: {
  total: number;
  onSuccess: () => void;
  loading: boolean;
}) {
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (paypalClientId) {
    // When PayPal is configured, we'd render the PayPalScriptProvider here.
    // For now, we show a placeholder that will be swapped in Phase 7+.
    return (
      <div className="text-center py-8">
        <p className="text-sm text-brand-darkest/60 mb-4">
          PayPal checkout will appear here.
        </p>
        <button
          onClick={onSuccess}
          disabled={loading}
          className="bg-[#0070ba] text-white px-10 py-3 rounded-full font-semibold hover:bg-[#005ea6] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Pay with PayPal"
          )}
        </button>
      </div>
    );
  }

  // Demo mode: no PayPal configured
  return (
    <div className="text-center py-8">
      <p className="text-xs text-brand-darkest/40 mb-6">
        Demo mode — PayPal not configured
      </p>
      <button
        onClick={onSuccess}
        disabled={loading}
        className="bg-brand-dark text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-brand-darkest transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mx-auto shadow-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          `Complete Order — $${total.toFixed(2)}`
        )}
      </button>
    </div>
  );
}
