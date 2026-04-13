"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import type { CartItem } from "@/contexts/CartContext";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { customerPlacementLabel } from "@/lib/customer-placement-label";
import {
  CUSTOMER_CHECKOUT_PROOF_NETWORK,
  CUSTOMER_CHECKOUT_PROOF_SERVER,
} from "@/lib/customer-proof-errors";
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
  /** Server CheckoutProofSnapshot id — required for approve + orders */
  proofSnapshotId: string;
  portalToken: string | null;
  ownerToken: string | null;
  portalUrl: string | null;
  editUrl: string | null;
  qrCodeDataUrl?: string | null;
  reusedPortal?: boolean;
  /** Watermarked — customer review only */
  displayProofFiles: { placement: string; dataUrl: string }[];
  /** Present after generate response; omitted in GET snapshot (approve uses snapshot id only). */
  productionFiles: { placement: string; dataUrl: string }[];
}

function normalizeProofPayload(raw: Record<string, unknown>): ProofItem {
  const display = raw.displayProofFiles ?? raw.proofFiles;
  const production = raw.productionFiles ?? raw.proofFiles;
  return {
    cartItemId: String(raw.cartItemId ?? ""),
    proofSnapshotId: String(raw.proofSnapshotId ?? ""),
    portalToken: (raw.portalToken as string) ?? null,
    ownerToken: (raw.ownerToken as string) ?? null,
    portalUrl: (raw.portalUrl as string) ?? null,
    editUrl: (raw.editUrl as string) ?? null,
    qrCodeDataUrl: raw.qrCodeDataUrl as string | null | undefined,
    reusedPortal: raw.reusedPortal as boolean | undefined,
    displayProofFiles: Array.isArray(display) ? (display as ProofItem["displayProofFiles"]) : [],
    productionFiles: Array.isArray(production) ? (production as ProofItem["productionFiles"]) : [],
  };
}

function snapshotApiToProofItem(data: Record<string, unknown>): ProofItem {
  const display = data.displayProofFiles;
  return {
    cartItemId: String(data.cartItemId ?? ""),
    proofSnapshotId: String(data.proofSnapshotId ?? ""),
    portalToken: (data.portalToken as string) ?? null,
    ownerToken: (data.ownerToken as string) ?? null,
    portalUrl: (data.portalUrl as string) ?? null,
    editUrl: (data.editUrl as string) ?? null,
    qrCodeDataUrl: data.qrCodeDataUrl as string | null | undefined,
    reusedPortal: data.reusedPortal as boolean | undefined,
    displayProofFiles: Array.isArray(display) ? (display as ProofItem["displayProofFiles"]) : [],
    productionFiles: [],
  };
}

interface ShippingRate {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
}

type CheckoutStep = "shipping" | "proof" | "payment" | "complete";

const safeNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

// ─── Checkout Page ───────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, getTotalPrice, getItemCount, clearCart, updateCartItem } = useCart();

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
  const [proofApproving, setProofApproving] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [shippingRatesLoading, setShippingRatesLoading] = useState(false);
  const [shippingRatesError, setShippingRatesError] = useState<string | null>(null);
  const [selectedShippingRateId, setSelectedShippingRateId] = useState<string | null>(null);
  const [finalProofAcknowledged, setFinalProofAcknowledged] = useState(false);
  const [checkoutProofSurfaceKey, setCheckoutProofSurfaceKey] = useState<Record<string, string>>({});

  const subtotal = getTotalPrice();
  const selectedShippingRate = useMemo(
    () => shippingRates.find((r) => r.id === selectedShippingRateId) || null,
    [shippingRates, selectedShippingRateId]
  );
  const shippingCost = selectedShippingRate ? safeNumber(selectedShippingRate.rate, 0) : 0;
  const total = subtotal + shippingCost;
  const hasMissingDesignRenders = useMemo(
    () =>
      cart.some(
        (item) =>
          !!item.printfulVariantId &&
          (!item.designFiles?.length ||
            item.designFiles.some((df) => !df.dataUrl || !df.dataUrl.startsWith("data:")))
      ),
    [cart]
  );
  const hasInvalidProofRenders = useMemo(
    () =>
      proofs.some((p) => {
        const badDisplay =
          !p.displayProofFiles?.length ||
          p.displayProofFiles.some((pf) => !pf.dataUrl || !pf.dataUrl.startsWith("data:"));
        if (!p.proofSnapshotId) return true;
        if (p.productionFiles.length === 0) return badDisplay;
        const badProd =
          p.productionFiles.some((pf) => !pf.dataUrl || !pf.dataUrl.startsWith("data:"));
        return badDisplay || badProd;
      }),
    [proofs]
  );

  const hasQrItems = cart.some((item) => item.requiresQrCode);

  /** Blocks PayPal until server-approved proof snapshot id is on the cart line */
  const paymentBlockedForQr = useMemo(() => {
    if (!hasQrItems) return false;
    return cart.some(
      (item) =>
        item.requiresQrCode &&
        !!item.printfulVariantId &&
        !String(item.approvedProofSnapshotId || "").trim()
    );
  }, [cart, hasQrItems]);

  const paymentDisabledReason = useMemo(() => {
    if (hasMissingDesignRenders) {
      return "Design render data is missing for one or more items. Please return to cart/studio and re-save your design.";
    }
    if (paymentBlockedForQr) {
      return "Final proof must be approved before payment for ArtKey / QR products. Use the proof step or return to shipping to continue.";
    }
    return undefined;
  }, [hasMissingDesignRenders, paymentBlockedForQr]);
  const hasShippablePrintfulItems = cart.some((item) => !!item.printfulVariantId);

  const fetchShippingRates = useCallback(async () => {
    if (!hasShippablePrintfulItems) {
      setShippingRates([]);
      setSelectedShippingRateId(null);
      setShippingRatesError(null);
      return true;
    }

    setShippingRatesLoading(true);
    setShippingRatesError(null);
    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            name: shipping.name,
            email: shipping.email,
            phone: shipping.phone,
            line1: shipping.line1,
            line2: shipping.line2,
            city: shipping.city,
            state: shipping.state,
            zip: shipping.zip,
            country: shipping.country,
          },
          items: cart
            .filter((item) => !!item.printfulVariantId)
            .map((item) => ({
              variant_id: item.printfulVariantId,
              quantity: Math.max(1, Math.trunc(safeNumber(item.quantity, 1))),
            })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setShippingRates([]);
        setSelectedShippingRateId(null);
        setShippingRatesError(data.error || "Unable to get shipping rates right now.");
        return false;
      }

      const rates = (Array.isArray(data.rates) ? data.rates : [])
        .filter((r) => Number.isFinite(Number(r?.rate)))
        .sort((a, b) => safeNumber(a.rate, 0) - safeNumber(b.rate, 0));
      setShippingRates(rates);
      if (rates.length === 0) {
        setSelectedShippingRateId(null);
        setShippingRatesError("No shipping options returned for this address.");
        return false;
      }
      setSelectedShippingRateId((prev) =>
        prev && rates.some((r) => r.id === prev) ? prev : rates[0].id
      );
      return true;
    } catch {
      setShippingRates([]);
      setSelectedShippingRateId(null);
      setShippingRatesError("Network error while fetching shipping rates.");
      return false;
    } finally {
      setShippingRatesLoading(false);
    }
  }, [cart, hasShippablePrintfulItems, shipping]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0 && step !== "complete") {
      router.push("/cart");
    }
  }, [cart, step, router]);

  useEffect(() => {
    if (step !== "proof") setFinalProofAcknowledged(false);
  }, [step]);

  useEffect(() => {
    setFinalProofAcknowledged(false);
  }, [proofs]);

  const pendingSnapshotHydrateKey = useMemo(() => {
    return cart
      .filter(
        (i) =>
          i.requiresQrCode &&
          String(i.pendingProofSnapshotId || "").trim() &&
          !String(i.approvedProofSnapshotId || "").trim()
      )
      .map((i) => `${i.id}:${i.pendingProofSnapshotId}`)
      .sort()
      .join("|");
  }, [cart]);

  useEffect(() => {
    if (!hasQrItems || !pendingSnapshotHydrateKey) return;
    if (proofs.length > 0) return;

    let cancelled = false;
    void (async () => {
      const toLoad = cart.filter(
        (i) =>
          i.requiresQrCode &&
          String(i.pendingProofSnapshotId || "").trim() &&
          !String(i.approvedProofSnapshotId || "").trim()
      );
      const results: ProofItem[] = [];
      for (const item of toLoad) {
        const sid = String(item.pendingProofSnapshotId).trim();
        try {
          const res = await fetch(`/api/proof/snapshot/${encodeURIComponent(sid)}`);
          const data = (await res.json()) as Record<string, unknown>;
          if (!res.ok || !data.success) continue;
          results.push(snapshotApiToProofItem(data));
        } catch {
          /* ignore */
        }
      }
      if (cancelled || results.length === 0) return;
      setProofs(results);
    })();

    return () => {
      cancelled = true;
    };
  }, [hasQrItems, pendingSnapshotHydrateKey, cart, proofs.length]);

  // ─── Shipping Form ──────────────────────────────────────────────────────

  const handleShippingSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const shippingOk = await fetchShippingRates();
      if (!shippingOk) return;

      if (hasQrItems) {
        const qrCartItems = cart.filter((item) => item.requiresQrCode);
        const allPreApproved =
          qrCartItems.length > 0 &&
          qrCartItems.every((item) => String(item.approvedProofSnapshotId || "").trim());

        if (allPreApproved) {
          setStep("payment");
          return;
        }

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
              existingPortal: item.proofPortal || null,
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
            const normalized = (data.proofs as Record<string, unknown>[]).map(normalizeProofPayload);
            setProofs(normalized);
            for (const proof of normalized) {
              const portalPatch =
                proof.portalToken &&
                proof.ownerToken &&
                proof.portalUrl &&
                proof.editUrl
                  ? {
                      proofPortal: {
                        portalToken: proof.portalToken,
                        ownerToken: proof.ownerToken,
                        portalUrl: proof.portalUrl,
                        editUrl: proof.editUrl,
                        qrCodeDataUrl: proof.qrCodeDataUrl || undefined,
                      },
                    }
                  : {};
              updateCartItem(proof.cartItemId, {
                ...portalPatch,
                pendingProofSnapshotId: proof.proofSnapshotId || undefined,
                approvedProofSnapshotId: undefined,
              });
            }
          } else {
            console.error("[checkout] proof generate failed", data?.error, data);
            setProofError(CUSTOMER_CHECKOUT_PROOF_SERVER);
          }
        } catch (err) {
          console.error("[checkout] proof generate network", err);
          setProofError(CUSTOMER_CHECKOUT_PROOF_NETWORK);
        } finally {
          setProofLoading(false);
        }
      } else {
        setStep("payment");
      }
    },
    [cart, fetchShippingRates, hasQrItems, shipping.email, updateCartItem]
  );

  const handleApproveProofs = async () => {
    if (hasInvalidProofRenders || !finalProofAcknowledged || proofApproving) return;
    setProofApproving(true);
    setProofError(null);
    try {
      for (const p of proofs) {
        if (!p.proofSnapshotId) {
          setProofError(CUSTOMER_CHECKOUT_PROOF_SERVER);
          return;
        }
        const res = await fetch("/api/proof/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proofSnapshotId: p.proofSnapshotId,
            customerEmail: shipping.email,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setProofError(
            typeof data?.error === "string" ? data.error : CUSTOMER_CHECKOUT_PROOF_SERVER
          );
          return;
        }
        updateCartItem(p.cartItemId, {
          approvedProofSnapshotId: p.proofSnapshotId,
        });
      }
      setStep("payment");
    } catch {
      setProofError(CUSTOMER_CHECKOUT_PROOF_NETWORK);
    } finally {
      setProofApproving(false);
    }
  };

  const handleRejectAndEdit = useCallback((cartItemId: string) => {
    const shouldEdit = window.confirm(
      "Would you like to edit your design?"
    );
    if (!shouldEdit) return;

    const item = cart.find((c) => c.id === cartItemId);
    if (!item) return;

    updateCartItem(cartItemId, {
      pendingProofSnapshotId: undefined,
      approvedProofSnapshotId: undefined,
    });
    setProofs((prev) => prev.filter((p) => p.cartItemId !== cartItemId));

    const searchParams = new URLSearchParams({
      product_id: item.id,
      product_name: item.name,
      cart_item_id: item.id,
      restore_design: "1",
    });
    if (item.assignmentId) searchParams.set("assignment_id", item.assignmentId);
    if (item.productSlug) searchParams.set("slug", item.productSlug);
    if (item.proofPortal?.portalToken) searchParams.set("portal_token", item.proofPortal.portalToken);
    if (item.proofPortal?.ownerToken) searchParams.set("owner_token", item.proofPortal.ownerToken);
    if (item.requiresQrCode) {
      searchParams.set("requires_qr", "1");
      searchParams.set("force_artkey", "1");
    }
    if (item.printfulProductId) {
      searchParams.set("printful_id", String(item.printfulProductId));
    }
    if (item.printfulVariantId) {
      searchParams.set("variant_id", String(item.printfulVariantId));
    }
    router.push(`/studio?${searchParams.toString()}`);
  }, [cart, router, updateCartItem]);

  // ─── Payment ────────────────────────────────────────────────────────────

  const handlePayment = useCallback(async (
    paypalOrderId: string,
    paypalTransactionId: string,
  ) => {
    setPaymentLoading(true);

    try {
      const qrLineMissingApproval = cart.some(
        (item) =>
          item.requiresQrCode &&
          !!item.printfulVariantId &&
          !String(item.approvedProofSnapshotId || "").trim()
      );
      if (qrLineMissingApproval) {
        alert(
          "Final proof approval is required before payment. Return to the proof step from shipping."
        );
        return;
      }

      const orderItems = cart.map((item) => {
        const portal = item.proofPortal;
        return {
          cartItemId: item.id,
          name: item.name,
          price: safeNumber(item.price, 0),
          quantity: Math.max(1, Math.trunc(safeNumber(item.quantity, 1))),
          priceAdjustments: item.priceAdjustments || [],
          printfulProductId: item.printfulProductId,
          printfulVariantId: item.printfulVariantId,
          assignmentId: item.assignmentId,
          productSlug: item.productSlug,
          designDraftId: item.designDraftId,
          designFiles: item.designFiles,
          studioRenderSignature: item.studioRenderSignature,
          requiresQrCode: item.requiresQrCode,
          approvedProofSnapshotId: item.requiresQrCode
            ? String(item.approvedProofSnapshotId || "").trim() || undefined
            : undefined,
          portalToken: portal?.portalToken,
          portalUrl: portal?.portalUrl,
          artKeyData: item.artKeyData,
        };
      });

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paypalOrderId,
          paypalTransactionId,
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
          shippingRate: selectedShippingRate,
          items: orderItems,
          subtotal,
          shippingCost,
          total,
        }),
      });

      const data = await res.json();
      if (data.success) {
        clearCart();
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
  }, [cart, shipping, selectedShippingRate, subtotal, shippingCost, total, clearCart, router]);

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
              <h2 className="text-xl font-normal text-brand-darkest mb-6">
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

              {hasShippablePrintfulItems && (
                <div className="mb-6 rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-brand-darkest">
                      Shipping Options
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        void fetchShippingRates();
                      }}
                      disabled={shippingRatesLoading}
                      className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {shippingRatesLoading ? "Refreshing..." : "Refresh Rates"}
                    </button>
                  </div>
                  {shippingRatesLoading && (
                    <p className="text-xs text-brand-darkest/60">Loading shipping rates...</p>
                  )}
                  {!shippingRatesLoading && shippingRatesError && (
                    <p className="text-xs text-red-600">{shippingRatesError}</p>
                  )}
                  {!shippingRatesLoading && !shippingRatesError && shippingRates.length > 0 && (
                    <div className="space-y-2">
                      {shippingRates.map((rate) => (
                        <label
                          key={rate.id}
                          className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 cursor-pointer ${
                            selectedShippingRateId === rate.id
                              ? "border-brand-dark bg-brand-light/30"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="shippingRate"
                              checked={selectedShippingRateId === rate.id}
                              onChange={() => setSelectedShippingRateId(rate.id)}
                            />
                            <div>
                              <p className="text-sm font-medium text-brand-darkest">{rate.name}</p>
                              <p className="text-xs text-brand-darkest/60">
                                {rate.minDeliveryDays && rate.maxDeliveryDays
                                  ? `${rate.minDeliveryDays}-${rate.maxDeliveryDays} business days`
                                  : "Estimated delivery provided at checkout"}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-brand-dark">
                            ${safeNumber(rate.rate, 0).toFixed(2)}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={shippingRatesLoading}
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

        {/* ─── STEP: Final proof approval (QR / ArtKey products) ─────────────── */}
        {step === "proof" && (
          <div className="max-w-3xl lg:max-w-4xl mx-auto">
            <div className="rounded-3xl border border-stone-200/90 bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] overflow-hidden">
              <div className="px-6 sm:px-10 pt-8 pb-6 border-b border-stone-100 bg-gradient-to-b from-stone-50/80 to-white">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-brand-dark/10 p-2 text-brand-dark">
                    <ShieldCheck className="w-5 h-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-darkest/45 mb-1">
                      Step 2 of checkout
                    </p>
                    <h2 className="text-2xl sm:text-[1.65rem] font-semibold text-brand-darkest tracking-tight">
                      Final proof approval
                    </h2>
                    <p className="text-sm text-brand-darkest/65 mt-2 max-w-2xl leading-relaxed">
                      Review your design before payment. This is the version we&apos;ll use for production,
                      including your ArtKey QR where it appears on the artwork. Take a moment to confirm
                      everything looks right.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 sm:px-10 py-8">
                {proofLoading && (
                  <div className="text-center py-16 sm:py-20">
                    <Loader2 className="w-11 h-11 text-brand-dark animate-spin mx-auto mb-5" />
                    <p className="text-base font-medium text-brand-darkest">
                      Preparing your final proof
                    </p>
                    <p className="text-sm text-brand-darkest/55 mt-2 max-w-md mx-auto leading-relaxed">
                      Finalizing your ArtKey details and generating your print-ready proof. This usually
                      takes just a moment.
                    </p>
                  </div>
                )}

                {proofError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50/80 p-8 text-center">
                    <AlertCircle className="w-9 h-9 text-red-400 mx-auto mb-3" />
                    <p className="text-red-800 font-medium">{proofError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("shipping");
                        setProofError(null);
                      }}
                      className="mt-5 text-sm font-semibold text-red-700 underline underline-offset-2 hover:text-red-900"
                    >
                      Back to shipping to try again
                    </button>
                  </div>
                )}

                {!proofLoading && !proofError && proofs.length > 0 && (
                  <>
                    {hasInvalidProofRenders && (
                      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
                        Some proof images are missing or incomplete. Go back to shipping and continue again,
                        or edit your design from the cart.
                      </div>
                    )}

                    <div className="space-y-10">
                      {proofs.map((proof) => {
                        const cartItem = cart.find((c) => c.id === proof.cartItemId);
                        const selectedPlacement =
                          checkoutProofSurfaceKey[proof.cartItemId] ||
                          proof.displayProofFiles[0]?.placement ||
                          "";
                        const activeFile =
                          proof.displayProofFiles.find((pf) => pf.placement === selectedPlacement) ||
                          proof.displayProofFiles[0];

                        return (
                          <div
                            key={proof.cartItemId}
                            className="rounded-2xl border border-stone-200 bg-stone-50/40 overflow-hidden"
                          >
                            <div className="px-4 sm:px-6 py-4 border-b border-stone-200/80 bg-white/90">
                              <h3 className="font-semibold text-brand-darkest text-lg">
                                {cartItem?.name || "Your item"}
                              </h3>
                              {proof.portalUrl ? (
                                <p className="text-sm text-brand-darkest/60 mt-2 leading-relaxed">
                                  Your personal ArtKey is part of this design. You&apos;ll get access details
                                  in your order confirmation—we don&apos;t show private links on this screen.
                                </p>
                              ) : null}
                              {proof.reusedPortal ? (
                                <p className="text-xs text-brand-darkest/50 mt-2">
                                  Using your saved ArtKey from an earlier step.
                                </p>
                              ) : null}
                            </div>

                            <div className="p-4 sm:p-6">
                              {proof.displayProofFiles.length > 1 ? (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {proof.displayProofFiles.map((pf) => {
                                    const active = pf.placement === selectedPlacement;
                                    return (
                                      <button
                                        key={pf.placement}
                                        type="button"
                                        onClick={() =>
                                          setCheckoutProofSurfaceKey((prev) => ({
                                            ...prev,
                                            [proof.cartItemId]: pf.placement,
                                          }))
                                        }
                                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors border ${
                                          active
                                            ? "bg-brand-dark text-white border-brand-dark"
                                            : "bg-white text-brand-darkest/75 border-stone-200 hover:border-stone-300"
                                        }`}
                                      >
                                        {customerPlacementLabel(pf.placement)}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : null}

                              {activeFile ? (
                                <div className="rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-inner">
                                  <div className="bg-stone-100/80 px-3 py-2 border-b border-stone-200/80">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                                      {customerPlacementLabel(activeFile.placement)}
                                    </p>
                                  </div>
                                  <div className="flex justify-center items-center p-4 sm:p-8 min-h-[220px] max-h-[min(62vh,520px)]">
                                    <img
                                      src={activeFile.dataUrl}
                                      alt={`Final proof — ${customerPlacementLabel(activeFile.placement)}`}
                                      className="max-w-full max-h-[min(58vh,480px)] w-auto object-contain"
                                    />
                                  </div>
                                </div>
                              ) : null}

                              <div className="mt-4 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleRejectAndEdit(proof.cartItemId)}
                                  className="text-sm font-semibold text-red-700 border border-red-200 bg-white px-4 py-2 rounded-full hover:bg-red-50 transition-colors"
                                >
                                  Back to edit design
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <label className="mt-10 flex items-start gap-3 p-4 sm:p-5 rounded-2xl border border-stone-200 bg-stone-50/60 cursor-pointer hover:border-stone-300/90 transition-colors">
                      <input
                        type="checkbox"
                        checked={finalProofAcknowledged}
                        onChange={(e) => setFinalProofAcknowledged(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-stone-300 text-brand-dark focus:ring-brand-dark"
                      />
                      <span className="text-sm text-brand-darkest leading-snug">
                        <span className="font-semibold block">
                          I approve this artwork for production
                        </span>
                        <span className="text-brand-darkest/65 text-xs mt-1.5 block leading-relaxed">
                          I&apos;ve reviewed each surface. The artwork shown—including the ArtKey QR where it
                          appears—is what I want submitted to fulfill my order.
                        </span>
                      </span>
                    </label>

                    <div className="flex flex-col sm:flex-row gap-3 mt-8">
                      <button
                        type="button"
                        onClick={() => setStep("shipping")}
                        className="sm:flex-1 order-2 sm:order-1 border-2 border-stone-200 text-brand-darkest py-3.5 rounded-full font-semibold hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Edit shipping
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const firstProof = proofs[0];
                          if (firstProof) handleRejectAndEdit(firstProof.cartItemId);
                        }}
                        className="sm:flex-1 order-3 sm:order-2 border-2 border-red-200 text-red-700 py-3.5 rounded-full font-semibold hover:bg-red-50/80 transition-colors"
                      >
                        Edit design instead
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleApproveProofs()}
                        disabled={
                          hasInvalidProofRenders ||
                          !finalProofAcknowledged ||
                          proofApproving
                        }
                        className="sm:flex-[1.15] order-1 sm:order-3 bg-brand-dark text-white py-3.5 rounded-full font-semibold hover:bg-brand-darkest transition-colors flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed shadow-sm"
                      >
                        {proofApproving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        {proofApproving ? "Approving…" : "Approve & continue to payment"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP: Payment ──────────────────────────────────────── */}
        {step === "payment" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-xl font-normal text-brand-darkest mb-6">
                Payment
              </h2>

              <PayPalSection
                total={total}
                onPaymentComplete={handlePayment}
                loading={paymentLoading}
                disabled={hasMissingDesignRenders || paymentBlockedForQr}
                disabledReason={paymentDisabledReason}
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
      <h3 className="font-normal text-brand-darkest mb-4">Order Summary</h3>
      <div className="space-y-3 mb-4">
        {cart.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-brand-darkest/70 truncate mr-2">
              {item.name} x{Math.max(1, Math.trunc(safeNumber(item.quantity, 1)))}
            </span>
            <span className="font-medium text-brand-darkest whitespace-nowrap">
              ${(
                safeNumber(item.price, 0) *
                Math.max(1, Math.trunc(safeNumber(item.quantity, 1)))
              ).toFixed(2)}
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
  onPaymentComplete,
  loading,
  disabled,
  disabledReason,
}: {
  total: number;
  onPaymentComplete: (paypalOrderId: string, transactionId: string) => void;
  loading: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const [paypalError, setPaypalError] = useState<string | null>(null);

  if (paypalClientId) {
    return (
      <div className="py-4">
        {paypalError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {paypalError}
          </div>
        )}
        {disabled ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {disabledReason || "Payment is disabled until all design renders are available."}
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-dark" />
            <p className="text-sm text-brand-darkest/60">Processing your order...</p>
          </div>
        ) : (
          <PayPalScriptProvider
            options={{
              "client-id": paypalClientId,
              components: "buttons",
              currency: "USD",
              intent: "capture",
            }}
          >
            <PayPalButtons
              style={{ layout: "vertical", shape: "pill", label: "pay" }}
              createOrder={async () => {
                setPaypalError(null);
                const res = await fetch("/api/paypal/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ total }),
                });
                const data = await res.json();
                if (!res.ok || !data.orderId) {
                  setPaypalError(data.error || "Failed to create PayPal order");
                  throw new Error(data.error || "PayPal create failed");
                }
                return data.orderId;
              }}
              onApprove={async (data) => {
                setPaypalError(null);
                const captureRes = await fetch("/api/paypal/capture-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId: data.orderID }),
                });
                const captureData = await captureRes.json();
                if (!captureRes.ok || !captureData.success) {
                  setPaypalError(captureData.error || "Payment capture failed");
                  return;
                }
                onPaymentComplete(
                  captureData.paypalOrderId,
                  captureData.transactionId,
                );
              }}
              onError={(err) => {
                console.error("[PayPal] Button error:", err);
                setPaypalError("PayPal encountered an error. Please try again.");
              }}
            />
          </PayPalScriptProvider>
        )}
      </div>
    );
  }

  // Demo mode: no PayPal credentials configured
  return (
    <div className="text-center py-8">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-xs text-amber-800">
          Demo mode — Set <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px]">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code>, <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px]">PAYPAL_CLIENT_ID</code>, and <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px]">PAYPAL_CLIENT_SECRET</code> to enable real PayPal payments.
        </p>
      </div>
      <button
        onClick={() => onPaymentComplete(`DEMO-${Date.now()}`, `DEMO-TXN-${Date.now()}`)}
        disabled={loading || disabled}
        className="bg-brand-dark text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-brand-darkest transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mx-auto shadow-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          `Complete Demo Order — $${total.toFixed(2)}`
        )}
      </button>
    </div>
  );
}
