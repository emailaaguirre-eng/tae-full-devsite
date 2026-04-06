"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { adminFetchJson, AdminUnauthorizedError } from "@/lib/admin/clientFetch";
import { AlertTriangle, ArrowLeft, ExternalLink, Package, Pencil, Save, X } from "lucide-react";

type ListingDetail = {
  id: string;
  listingCode: string;
  slug: string;
  name: string;
  description: string | null;
  heroImage: string | null;
  galleryImages: string | null;
  active: boolean;
  featured: boolean;
  customizable: boolean;
  requiresQrCode: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  categoryName: string;
  categorySlug: string;
  categoryPathLabel: string;
  assignmentCount: number;
  enabledAssignmentCount: number;
  mappedAssignmentCount: number;
};

type AssignmentRow = {
  assignmentId: string;
  assignmentSku: string;
  enabled: boolean;
  priceOverride: number | null;
  effectivePrice: number;
  proofTermsOverride: string | null;
  customizable: boolean | null;
  requiresQrCode: boolean | null;
  legacyShopProductId: string | null;
  legacyProductSlug: string | null;
  mediumTemplateId: string;
  mediumCode: string;
  mediumName: string;
  mediumSlug: string;
  mediumActive: boolean;
  variantId: string;
  variantCode: string;
  variantSku: string;
  variantName: string | null;
  sizeLabel: string | null;
  paperType: string | null;
  finishType: string | null;
  frameType: string | null;
  orientation: string | null;
  colorName: string | null;
  colorCode: string | null;
  basePrice: number;
  variantActive: boolean;
  printWidth: number | null;
  printHeight: number | null;
  printDpi: number | null;
  printfulProductId: number | null;
  printfulVariantId: number | null;
  printfulPrintfileId: number | null;
  mappingActive: boolean | null;
};

type ApiPayload = {
  listing: ListingDetail;
  assignments: AssignmentRow[];
};

type AssignmentEditForm = {
  id: string;
  assignmentSku: string;
  enabled: boolean;
  priceOverride: string;
  proofTermsOverride: string;
  requiresQrCode: "inherit" | "yes" | "no";
  customizable: "inherit" | "yes" | "no";
};

function formatPrice(value: number | null | undefined): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export default function CatalogV2ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const listingCode = decodeURIComponent(String(params.listingCode || ""));

  const [detail, setDetail] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingAssignment, setEditingAssignment] = useState<AssignmentEditForm | null>(null);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [assignmentSaveError, setAssignmentSaveError] = useState("");

  const loadDetail = useCallback(async () => {
    if (!listingCode) {
      setError("Missing listing code");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { res, data } = await adminFetchJson(
        `/api/admin/catalog-v2/listings/${encodeURIComponent(listingCode)}`,
        undefined,
        () => router.push("/b_d_admn_tae/login")
      );

      if (res.ok && data?.success && data?.data) {
        setDetail(data.data);
      } else {
        setError(data?.error || `Failed to load listing (${res.status})`);
      }
    } catch (err) {
      if (err instanceof AdminUnauthorizedError) return;
      setError("Failed to load listing");
    } finally {
      setLoading(false);
    }
  }, [listingCode, router]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const fullyMapped = useMemo(() => {
    return !!detail &&
      detail.listing.assignmentCount > 0 &&
      detail.listing.assignmentCount === detail.listing.mappedAssignmentCount;
  }, [detail]);

  const priceSummary = useMemo(() => {
    if (!detail || detail.assignments.length === 0) {
      return { min: null as number | null, max: null as number | null };
    }
    const values = detail.assignments.map((a) => Number(a.effectivePrice || 0));
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [detail]);

  const unmappedAssignments = useMemo(() => {
    return detail ? detail.assignments.filter((a) => !a.mappingActive) : [];
  }, [detail]);

  const openAssignmentEditor = (assignment: AssignmentRow) => {
    setAssignmentSaveError("");
    setEditingAssignment({
      id: assignment.assignmentId,
      assignmentSku: assignment.assignmentSku,
      enabled: !!assignment.enabled,
      priceOverride:
        assignment.priceOverride === null || assignment.priceOverride === undefined
          ? ""
          : String(assignment.priceOverride),
      proofTermsOverride: assignment.proofTermsOverride || "",
      requiresQrCode:
        assignment.requiresQrCode === null
          ? "inherit"
          : assignment.requiresQrCode
          ? "yes"
          : "no",
      customizable:
        assignment.customizable === null
          ? "inherit"
          : assignment.customizable
          ? "yes"
          : "no",
    });
  };

  const saveAssignmentEdits = async () => {
    if (!editingAssignment) return;

    setSavingAssignment(true);
    setAssignmentSaveError("");

    try {
      const payload = {
        enabled: editingAssignment.enabled,
        priceOverride:
          editingAssignment.priceOverride.trim() === ""
            ? null
            : Number(editingAssignment.priceOverride),
        proofTermsOverride: editingAssignment.proofTermsOverride,
        requiresQrCode:
          editingAssignment.requiresQrCode === "inherit"
            ? null
            : editingAssignment.requiresQrCode === "yes",
        customizable:
          editingAssignment.customizable === "inherit"
            ? null
            : editingAssignment.customizable === "yes",
      };

      const { res, data } = await adminFetchJson(
        `/api/admin/catalog-v2/assignments/${encodeURIComponent(editingAssignment.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        () => router.push("/b_d_admn_tae/login")
      );

      if (!res.ok || !data?.success) {
        setAssignmentSaveError(data?.error || `Failed to save assignment (${res.status})`);
        return;
      }

      setEditingAssignment(null);
      await loadDetail();
    } catch (err) {
      if (err instanceof AdminUnauthorizedError) return;
      setAssignmentSaveError("Failed to save assignment");
    } finally {
      setSavingAssignment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-medium text-sm">Loading Catalog V2 listing...</div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="bg-white border border-brand-light p-8">
        <div className="text-center">
          <Package className="w-8 h-8 text-brand-medium mx-auto mb-2" />
          <h1 className="text-lg font-semibold text-brand-dark mb-2">Listing not available</h1>
          <p className="text-sm text-brand-medium mb-4">{error || "Unknown error"}</p>
          <Link
            href="/b_d_admn_tae/catalog-v2/listings"
            className="inline-flex items-center gap-2 border border-brand-dark text-brand-dark px-4 py-2 text-sm font-medium hover:bg-brand-dark/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog V2
          </Link>
        </div>
      </div>
    );
  }

  const { listing, assignments } = detail;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/b_d_admn_tae/catalog-v2/listings"
            className="inline-flex items-center gap-2 text-sm text-brand-medium hover:text-brand-dark transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog V2
          </Link>
          <h1 className="text-2xl font-normal text-brand-dark font-playfair">
            {listing.name}
          </h1>
          <p className="text-sm text-brand-medium mt-1">
            {listing.listingCode} · /shop/{listing.slug}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/shop/${listing.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 border border-brand-dark text-brand-dark px-4 py-2 text-sm font-medium hover:bg-brand-dark/10 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open Storefront
          </Link>
        </div>
      </div>

      {!fullyMapped && unmappedAssignments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-amber-900">
                Missing fulfillment mapping on {unmappedAssignments.length} assignment{unmappedAssignments.length === 1 ? "" : "s"}
              </h2>
              <p className="text-sm text-amber-800 mt-1">
                Checkout should not rely on these assignments until each one has an active fulfillment mapping.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white border border-brand-light p-4">
          <div className="text-[11px] uppercase tracking-wider text-brand-medium mb-1">Price Range</div>
          <div className="text-lg font-semibold text-brand-dark">
            ${formatPrice(priceSummary.min)}
            {priceSummary.max !== null && priceSummary.max !== priceSummary.min
              ? ` - $${formatPrice(priceSummary.max)}`
              : ""}
          </div>
        </div>
        <div className="bg-white border border-brand-light p-4">
          <div className="text-[11px] uppercase tracking-wider text-brand-medium mb-1">Assignments</div>
          <div className="text-lg font-semibold text-brand-dark">{listing.assignmentCount}</div>
        </div>
        <div className="bg-white border border-brand-light p-4">
          <div className="text-[11px] uppercase tracking-wider text-brand-medium mb-1">Enabled</div>
          <div className="text-lg font-semibold text-brand-dark">{listing.enabledAssignmentCount}</div>
        </div>
        <div className="bg-white border border-brand-light p-4">
          <div className="text-[11px] uppercase tracking-wider text-brand-medium mb-1">Mapped</div>
          <div className="text-lg font-semibold text-brand-dark">{listing.mappedAssignmentCount}</div>
        </div>
        <div className="bg-white border border-brand-light p-4">
          <div className="text-[11px] uppercase tracking-wider text-brand-medium mb-1">Status</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 font-medium ${listing.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {listing.active ? "Active" : "Inactive"}
            </span>
            <span className={`text-[10px] px-2 py-0.5 font-medium ${fullyMapped ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {fullyMapped ? "Fully mapped" : "Needs review"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white border border-brand-light p-5">
          <h2 className="text-sm font-semibold text-brand-dark uppercase tracking-wider mb-4">
            Listing Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-brand-medium text-xs uppercase tracking-wider mb-1">Category</div>
              <div className="text-brand-dark">{listing.categoryPathLabel || listing.categoryName}</div>
            </div>
            <div>
              <div className="text-brand-medium text-xs uppercase tracking-wider mb-1">Flags</div>
              <div className="text-brand-dark">
                Customizable: {listing.customizable ? "Yes" : "No"} · ArtKey required: {listing.requiresQrCode ? "Yes" : "No"}
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="text-brand-medium text-xs uppercase tracking-wider mb-1">Description</div>
              <div className="text-brand-dark">{listing.description || "—"}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-brand-light p-5">
          <h2 className="text-sm font-semibold text-brand-dark uppercase tracking-wider mb-4">
            Assignment Health
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-brand-medium">Total assignments</span>
              <span className="font-medium text-brand-dark">{listing.assignmentCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-medium">Enabled</span>
              <span className="font-medium text-brand-dark">{listing.enabledAssignmentCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-medium">Mapped</span>
              <span className="font-medium text-brand-dark">{listing.mappedAssignmentCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-medium">Unmapped</span>
              <span className="font-medium text-brand-dark">{unmappedAssignments.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-brand-light">
        <div className="px-5 py-4 border-b border-brand-light">
          <h2 className="text-sm font-semibold text-brand-dark uppercase tracking-wider">
            Assignments
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1360px]">
            <thead className="bg-brand-lightest">
              <tr className="text-[10px] uppercase tracking-wider text-brand-medium">
                <th className="text-left px-4 py-3">Assignment</th>
                <th className="text-left px-4 py-3">Option</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Fulfillment</th>
                <th className="text-left px-4 py-3">Legacy</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-light">
              {assignments.map((a) => {
                const studioHref = (() => {
                  const params = new URLSearchParams({
                    assignment_id: a.assignmentId,
                    product_name: listing.name,
                  });
                  if (a.legacyProductSlug) {
                    params.set("slug", a.legacyProductSlug);
                  }
                  if (a.legacyShopProductId) {
                    params.set("product_id", a.legacyShopProductId);
                  }
                  if (a.printfulVariantId) {
                    params.set("variant_id", String(a.printfulVariantId));
                  }
                  if ((a.requiresQrCode ?? listing.requiresQrCode) === true) {
                    params.set("requires_qr", "1");
                    params.set("force_artkey", "1");
                  }
                  return `/studio?${params.toString()}`;
                })();

                return (
                  <tr key={a.assignmentId} className="hover:bg-brand-lightest/40">
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm font-medium text-brand-dark">{a.assignmentSku}</div>
                      <div className="text-[10px] text-brand-medium mt-1">{a.variantSku}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-brand-dark">
                      <div>{a.sizeLabel || a.variantName || a.variantCode}</div>
                      <div className="text-[11px] text-brand-medium mt-1">
                        {[a.paperType, a.finishType, a.frameType, a.orientation].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-brand-dark">
                      <div>${formatPrice(a.effectivePrice)}</div>
                      <div className="text-[11px] text-brand-medium mt-1">
                        Base ${formatPrice(a.basePrice)}
                        {a.priceOverride !== null ? ` · Override $${formatPrice(a.priceOverride)}` : ""}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className={`text-[10px] px-2 py-0.5 font-medium inline-block w-fit ${
                          a.priceOverride !== null ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {a.priceOverride !== null ? "Price Override" : "Base Price"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-brand-dark">
                      <div>PF Product: {a.printfulProductId ?? "—"}</div>
                      <div className="text-[11px] text-brand-medium mt-1">
                        PF Variant: {a.printfulVariantId ?? "—"} · Printfile: {a.printfulPrintfileId ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-brand-dark">
                      <div className="break-all">{a.legacyShopProductId || "—"}</div>
                      <div className="text-[11px] text-brand-medium mt-1 break-all">
                        {a.legacyProductSlug || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] px-2 py-0.5 font-medium inline-block w-fit ${a.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {a.enabled ? "Enabled" : "Disabled"}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 font-medium inline-block w-fit ${a.mappingActive ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {a.mappingActive ? "Mapped" : "Unmapped"}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 font-medium inline-block w-fit ${
                          a.requiresQrCode === null ? "bg-gray-100 text-gray-500" : a.requiresQrCode ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                        }`}>
                          {a.requiresQrCode === null ? "QR Inherit" : a.requiresQrCode ? "QR On" : "QR Off"}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 font-medium inline-block w-fit ${
                          a.customizable === null ? "bg-gray-100 text-gray-500" : a.customizable ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700"
                        }`}>
                          {a.customizable === null ? "Custom Inherit" : a.customizable ? "Custom On" : "Custom Off"}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 font-medium inline-block w-fit ${
                          a.proofTermsOverride ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {a.proofTermsOverride ? "Proof Override" : "Proof Inherit"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col items-start gap-2">
                        <button
                          onClick={() => openAssignmentEditor(a)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-dark hover:text-brand-accent transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        {studioHref ? (
                          <Link
                            href={studioHref}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-accent hover:text-brand-dark transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Test in Studio
                          </Link>
                        ) : (
                          <span className="text-xs text-brand-medium">No studio link</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingAssignment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl border border-brand-light">
            <div className="px-5 py-4 border-b border-brand-light flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-brand-dark">Edit Assignment</h2>
                <p className="text-sm text-brand-medium mt-1">{editingAssignment.assignmentSku}</p>
              </div>
              <button
                onClick={() => {
                  setEditingAssignment(null);
                  setAssignmentSaveError("");
                }}
                className="text-brand-medium hover:text-brand-dark transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {assignmentSaveError && (
                <div className="bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {assignmentSaveError}
                </div>
              )}

              <label className="flex items-center gap-3 text-sm text-brand-dark">
                <input
                  type="checkbox"
                  checked={editingAssignment.enabled}
                  onChange={(e) =>
                    setEditingAssignment({
                      ...editingAssignment,
                      enabled: e.target.checked,
                    })
                  }
                />
                Enabled
              </label>

              <div>
                <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                  Price Override
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingAssignment.priceOverride}
                  onChange={(e) =>
                    setEditingAssignment({
                      ...editingAssignment,
                      priceOverride: e.target.value,
                    })
                  }
                  className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  placeholder="Leave blank to use variant base price"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                  Proof Terms Override
                </label>
                <textarea
                  rows={4}
                  value={editingAssignment.proofTermsOverride}
                  onChange={(e) =>
                    setEditingAssignment({
                      ...editingAssignment,
                      proofTermsOverride: e.target.value,
                    })
                  }
                  className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  placeholder="Leave blank to inherit existing flow behavior"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                    Requires ArtKey / QR
                  </label>
                  <select
                    value={editingAssignment.requiresQrCode}
                    onChange={(e) =>
                      setEditingAssignment({
                        ...editingAssignment,
                        requiresQrCode: e.target.value as "inherit" | "yes" | "no",
                      })
                    }
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  >
                    <option value="inherit">Inherit listing default ({listing.requiresQrCode ? "Yes" : "No"})</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                    Customizable
                  </label>
                  <select
                    value={editingAssignment.customizable}
                    onChange={(e) =>
                      setEditingAssignment({
                        ...editingAssignment,
                        customizable: e.target.value as "inherit" | "yes" | "no",
                      })
                    }
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  >
                    <option value="inherit">Inherit listing default ({listing.customizable ? "Yes" : "No"})</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-brand-light flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setEditingAssignment(null);
                  setAssignmentSaveError("");
                }}
                className="inline-flex items-center gap-2 border border-brand-dark text-brand-dark px-4 py-2 text-sm font-medium hover:bg-brand-dark/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveAssignmentEdits}
                disabled={savingAssignment}
                className="inline-flex items-center gap-2 bg-brand-dark text-white px-4 py-2 text-sm font-medium hover:bg-brand-dark/90 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingAssignment ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
