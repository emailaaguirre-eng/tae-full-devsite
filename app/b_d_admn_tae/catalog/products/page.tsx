"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { adminFetchJson, AdminUnauthorizedError } from "@/lib/admin/clientFetch";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Package,
  ExternalLink,
  Wand2,
  Check,
  ChevronDown,
  Upload,
  ImageIcon,
  GripVertical,
} from "lucide-react";

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  heroImage: string | null;
  galleryImages: string | null;
  basePrice: number;
  printfulBasePrice: number;
  taeAddOnFee: number;
  active: boolean;
  sortOrder: number;
  printProvider: string;
  printfulProductId: number | null;
  printfulVariantId: number | null;
  sizeLabel: string | null;
  paperType: string | null;
  finishType: string | null;
  taeId: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  requiresQrCode?: boolean;
  proofTerms?: string | null;
  pricing?: {
    marginTarget: number;
    artistRoyalty: number;
    lastPrintfulSyncAt: string | null;
  };
  watermark?: {
    enabled: boolean;
    text: string;
    color: string;
    opacity: number;
    transform: {
      x: number;
      y: number;
      scale: number;
      rotation: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  taeBaseFee: number;
  requiresQrCode?: boolean;
  productCount: number;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  proofTerms: "",
  categoryId: "",
  printProvider: "printful",
  printfulProductId: "",
  printfulVariantId: "",
  printfulBasePrice: "0",
  taeAddOnFee: "0",
  marginTarget: "0.45",
  artistRoyalty: "0",
  sizeLabel: "",
  paperType: "",
  finishType: "",
  heroImage: "",
  watermarkEnabled: false,
  watermarkText: "tAE",
  watermarkColor: "#ffffff",
  watermarkOpacity: "0.12",
  watermarkX: "0.50",
  watermarkY: "0.50",
  watermarkScale: "0.12",
  watermarkRotation: "-18",
  requiresQrCode: false,
  active: true,
  sortOrder: "0",
};

const DEFAULT_MARGIN_TARGET = 0.45;
const DEFAULT_ARTIST_ROYALTY = 0;
const BTN_PRIMARY =
  "bg-brand-dark text-white px-4 py-2 text-sm font-medium inline-flex items-center gap-2 hover:bg-brand-dark/90 transition-colors disabled:opacity-50";
const BTN_SECONDARY =
  "border border-brand-dark text-brand-dark px-4 py-2 text-sm font-medium inline-flex items-center gap-2 hover:bg-brand-dark/10 transition-colors disabled:opacity-50";
const BTN_SUBTLE =
  "border border-brand-light text-brand-dark px-4 py-2 text-sm inline-flex items-center gap-2 hover:bg-brand-lightest transition-colors disabled:opacity-50";
const BTN_ICON =
  "p-1.5 text-brand-medium hover:text-brand-dark transition-colors disabled:opacity-50";
const BTN_ICON_DANGER =
  "p-1.5 text-brand-medium hover:text-red-600 transition-colors disabled:opacity-50";

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<string | null>(null);
  const [checkingBackfill, setCheckingBackfill] = useState(false);
  const [syncingSpecs, setSyncingSpecs] = useState(false);
  const [syncingSurfaceMaps, setSyncingSurfaceMaps] = useState(false);
  const [generatingMockupFor, setGeneratingMockupFor] = useState<string | null>(null);
  const [mockupPreview, setMockupPreview] = useState<{
    productName: string;
    mockupUrl: string;
    placement: string;
    cached: boolean;
  } | null>(null);

  // Image editor modal
  const [imageEditProduct, setImageEditProduct] = useState<Product | null>(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [showWatermarkEditor, setShowWatermarkEditor] = useState(false);
  const [wmDraft, setWmDraft] = useState<{ x: number; y: number; scale: number; rotation: number } | null>(null);
  const [wmDragging, setWmDragging] = useState(false);
  const [wmResizing, setWmResizing] = useState(false);

  const getCategoryRequiresQrDefault = useCallback(
    (categoryId?: string) => categories.find((c) => c.id === categoryId)?.requiresQrCode ?? false,
    [categories]
  );

  const handleBackfillImages = async () => {
    setBackfilling(true);
    setBackfillResult(null);
    try {
      const res = await fetch("/api/admin/products/backfill-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false, dryRun: false, syncGallery: true }),
      });
      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const reason =
          data?.error ||
          data?.message ||
          (raw ? raw.slice(0, 240) : `HTTP ${res.status}`);
        setBackfillResult(`Error (${res.status}): ${reason}`);
        return;
      }

      if (data.success) {
        const errMsg = data.errors?.length
          ? ` (${data.errors.length} errors)`
          : "";
        const firstError = data.errors?.[0]?.message
          ? ` First error: ${data.errors[0].message}`
          : "";
        setBackfillResult(
          `Synced image sets for ${data.updatedCount} products, skipped ${data.skippedCount}${errMsg}.${firstError}`
        );
        loadProducts();
      } else {
        setBackfillResult(`Error: ${data?.error || "Backfill failed"}`);
      }
    } catch {
      setBackfillResult("Failed to backfill images");
    } finally {
      setBackfilling(false);
    }
  };

  const handleBackfillPreflight = async () => {
    setCheckingBackfill(true);
    setBackfillResult(null);
    try {
      const res = await fetch("/api/admin/products/backfill-images", {
        method: "GET",
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setBackfillResult(`Backfill preflight failed (${res.status}): ${data?.error || "Unknown error"}`);
        return;
      }
      const totals = data.preflight?.totals;
      const missingEnv = (data.preflight?.missingEnv || []) as string[];
      if (missingEnv.length > 0) {
        setBackfillResult(`Backfill not configured. Missing env: ${missingEnv.join(", ")}`);
        return;
      }
      setBackfillResult(
        `Backfill preflight: ${totals?.eligibleForBackfill || 0} eligible of ${totals?.activeMappedProducts || 0} active mapped products (${totals?.alreadyHasHero || 0} already have images).`
      );
    } catch {
      setBackfillResult("Failed to run backfill preflight");
    } finally {
      setCheckingBackfill(false);
    }
  };

  const handleSyncPrintSpecs = async () => {
    setSyncingSpecs(true);
    setBackfillResult(null);
    try {
      const res = await fetch("/api/admin/products/sync-printspecs", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        const synced = data.results.filter((r: any) => r.status === "synced").length;
        const errors = data.results.filter((r: any) => r.status.startsWith("error")).length;
        setBackfillResult(
          `Print specs synced for ${synced} product types` +
          (errors > 0 ? ` (${errors} errors)` : "")
        );
        loadProducts();
      } else {
        setBackfillResult(`Error: ${data.error}`);
      }
    } catch {
      setBackfillResult("Failed to sync print specs");
    } finally {
      setSyncingSpecs(false);
    }
  };

  const handleSyncSurfaceMaps = async () => {
    setSyncingSurfaceMaps(true);
    setBackfillResult(null);
    try {
      const res = await fetch("/api/admin/products/sync-surface-maps", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        const { created, updated, skipped } = data.summary;
        setBackfillResult(
          `Surface maps: ${created} created, ${updated} updated` +
          (skipped > 0 ? `, ${skipped} skipped` : "")
        );
      } else {
        setBackfillResult(`Error: ${data.error}`);
      }
    } catch {
      setBackfillResult("Failed to sync surface maps");
    } finally {
      setSyncingSurfaceMaps(false);
    }
  };

  const handleGenerateMockupPreview = async (product: Product) => {
    setGeneratingMockupFor(product.id);
    setBackfillResult(null);
    try {
      const exportsRes = await fetch(
        `/api/admin/studio-exports?shopProductId=${encodeURIComponent(product.id)}&limit=10`
      );
      const exportsData = await exportsRes.json().catch(() => ({}));
      const latestExport = exportsData?.exports?.[0];
      if (!exportsRes.ok || !latestExport) {
        setBackfillResult(
          "No studio export found for this product. Open Studio, click Save & Continue, then retry."
        );
        return;
      }
      const availablePlacements: string[] = Array.isArray(latestExport.placements)
        ? latestExport.placements
        : [];
      const defaultPlacement = availablePlacements[0] || "default";
      const placementInput = window.prompt(
        `Placement from latest studio export (${availablePlacements.join(", ")}):`,
        defaultPlacement
      );
      if (!placementInput) return;
      const placement = placementInput.trim();
      if (!availablePlacements.includes(placement)) {
        setBackfillResult(
          `Placement "${placement}" is not in latest studio export. Available: ${availablePlacements.join(", ")}`
        );
        return;
      }

      const res = await fetch("/api/admin/mockups/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopProductId: product.id,
          studioExportId: latestExport.exportId,
          placement,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setBackfillResult(
          `Mockup preview failed (${res.status}): ${data?.error || "Unknown error"}`
        );
        return;
      }
      setMockupPreview({
        productName: product.name,
        mockupUrl: data.mockup?.mockupUrl,
        placement: data.mockup?.placement || placement,
        cached: !!data.cached,
      });
      setBackfillResult(
        `Mockup preview ready for ${product.name} using studio export ${latestExport.exportId} (${data.cached ? "cached" : "new"})`
      );
    } catch {
      setBackfillResult("Failed to generate mockup preview");
    } finally {
      setGeneratingMockupFor(null);
    }
  };

  // Image upload helpers
  const uploadProductImage = async (file: File, productId: string, kind: "hero" | "gallery") => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("productId", productId);
    fd.append("kind", kind);
    const { res, data } = await adminFetchJson(
      "/api/admin/products/upload-image",
      { method: "POST", body: fd },
      () => router.push("/b_d_admn_tae/login")
    );
    return { success: !!(res.ok && data?.success), data };
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !imageEditProduct) return;
    setHeroUploading(true);
    setImgError(null);
    try {
      const result = await uploadProductImage(file, imageEditProduct.id, "hero");
      if (result.success) {
        setImageEditProduct({ ...imageEditProduct, heroImage: result.data.url });
        loadProducts();
      } else {
        setImgError(result.data?.error || "Upload failed");
      }
    } catch (err) {
      if (!(err instanceof AdminUnauthorizedError)) setImgError("Upload failed");
    }
    finally { setHeroUploading(false); }
    e.target.value = "";
  };

  const handleRemoveHero = async () => {
    if (!imageEditProduct) return;
    try {
      const { res, data } = await adminFetchJson(`/api/admin/store-products/${imageEditProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroImage: null }),
      }, () => router.push("/b_d_admn_tae/login"));
      if (!res.ok || !data?.success) {
        setImgError(data?.error || "Failed to remove hero image");
        return;
      }
      setImageEditProduct({ ...imageEditProduct, heroImage: null });
      loadProducts();
    } catch (err) {
      if (!(err instanceof AdminUnauthorizedError)) setImgError("Failed to remove hero image");
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !imageEditProduct) return;
    setGalleryUploading(true);
    setImgError(null);
    let current: string[] = [];
    try { current = imageEditProduct.galleryImages ? JSON.parse(imageEditProduct.galleryImages) : []; } catch { /* ok */ }

    for (const file of Array.from(files)) {
      try {
        const result = await uploadProductImage(file, imageEditProduct.id, "gallery");
        if (result.success) {
          current.push(result.data.url);
        } else {
          setImgError(result.data?.error || "Upload failed");
          break;
        }
      } catch (err) {
        if (!(err instanceof AdminUnauthorizedError)) setImgError("Upload failed");
        break;
      }
    }
    setImageEditProduct({ ...imageEditProduct, galleryImages: JSON.stringify(current) });
    loadProducts();
    setGalleryUploading(false);
    e.target.value = "";
  };

  const handleRemoveGalleryImage = async (idx: number) => {
    if (!imageEditProduct) return;
    let gallery: string[] = [];
    try { gallery = imageEditProduct.galleryImages ? JSON.parse(imageEditProduct.galleryImages) : []; } catch { /* ok */ }
    gallery.splice(idx, 1);
    const json = JSON.stringify(gallery);
    try {
      const { res, data } = await adminFetchJson(`/api/admin/store-products/${imageEditProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ galleryImages: json }),
      }, () => router.push("/b_d_admn_tae/login"));
      if (!res.ok || !data?.success) {
        setImgError(data?.error || "Failed to remove gallery image");
        return;
      }
      setImageEditProduct({ ...imageEditProduct, galleryImages: json });
      loadProducts();
    } catch (err) {
      if (!(err instanceof AdminUnauthorizedError)) setImgError("Failed to remove gallery image");
    }
  };

  const handleGalleryReorder = async (fromIdx: number, toIdx: number) => {
    if (!imageEditProduct) return;
    let gallery: string[] = [];
    try { gallery = imageEditProduct.galleryImages ? JSON.parse(imageEditProduct.galleryImages) : []; } catch { /* ok */ }
    const [moved] = gallery.splice(fromIdx, 1);
    gallery.splice(toIdx, 0, moved);
    const json = JSON.stringify(gallery);
    try {
      const { res, data } = await adminFetchJson(`/api/admin/store-products/${imageEditProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ galleryImages: json }),
      }, () => router.push("/b_d_admn_tae/login"));
      if (!res.ok || !data?.success) {
        setImgError(data?.error || "Failed to reorder gallery images");
        return;
      }
      setImageEditProduct({ ...imageEditProduct, galleryImages: json });
      loadProducts();
    } catch (err) {
      if (!(err instanceof AdminUnauthorizedError)) setImgError("Failed to reorder gallery images");
    }
  };

  const openWatermarkEditor = () => {
    setWmDraft({
      x: Math.max(0, Math.min(1, parseFloat(form.watermarkX) || 0.5)),
      y: Math.max(0, Math.min(1, parseFloat(form.watermarkY) || 0.5)),
      scale: Math.max(0.05, Math.min(0.5, parseFloat(form.watermarkScale) || 0.12)),
      rotation: Math.max(-180, Math.min(180, parseFloat(form.watermarkRotation) || -18)),
    });
    setShowWatermarkEditor(true);
  };

  const closeWatermarkEditor = () => {
    setShowWatermarkEditor(false);
    setWmDragging(false);
    setWmResizing(false);
  };

  const commitWatermarkEditor = () => {
    if (!wmDraft) return closeWatermarkEditor();
    setForm((prev) => ({
      ...prev,
      watermarkX: wmDraft.x.toFixed(3),
      watermarkY: wmDraft.y.toFixed(3),
      watermarkScale: wmDraft.scale.toFixed(3),
      watermarkRotation: wmDraft.rotation.toFixed(1),
    }));
    closeWatermarkEditor();
  };

  const providerCost = Math.max(0, parseFloat(form.printfulBasePrice) || 0);
  const currentRetail = Math.max(0, providerCost + (parseFloat(form.taeAddOnFee) || 0));
  const marginTarget = Math.max(0, Math.min(0.9, parseFloat(form.marginTarget) || DEFAULT_MARGIN_TARGET));
  const artistRoyalty = Math.max(0, parseFloat(form.artistRoyalty) || DEFAULT_ARTIST_ROYALTY);
  const suggestedRetailRaw = (providerCost + artistRoyalty) / Math.max(0.1, 1 - marginTarget);
  const suggestedRetail = Number.isFinite(suggestedRetailRaw) ? suggestedRetailRaw : 0;
  const suggestedTaeAddon = Math.max(0, suggestedRetail - providerCost);
  const expectedProfit = Math.max(0, suggestedRetail - providerCost - artistRoyalty);
  const currentProfit = Math.max(0, currentRetail - providerCost - artistRoyalty);
  const currentMargin = currentRetail > 0 ? currentProfit / currentRetail : 0;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { res, data } = await adminFetchJson(
        "/api/admin/store-products",
        undefined,
        () => router.push("/b_d_admn_tae/login")
      );
      if (res.ok && data?.success) {
        setProducts(data.data || []);
        setCategories(data.categories || []);
      } else {
        setError(data?.error || `Failed to load products (${res.status})`);
      }
    } catch (err) {
      if (err instanceof AdminUnauthorizedError) return;
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setShowForm(true);
      setEditId(null);
      const defaultCategoryId = categories[0]?.id || "";
      setForm({
        ...EMPTY_FORM,
        categoryId: defaultCategoryId,
        requiresQrCode: getCategoryRequiresQrDefault(defaultCategoryId),
      });
    }
  }, [categories, getCategoryRequiresQrDefault, searchParams]);

  const handleEdit = (p: Product) => {
    const wm = p.watermark || {
      enabled: false,
      text: "tAE",
      color: "#ffffff",
      opacity: 0.12,
      transform: { x: 0.5, y: 0.5, scale: 0.12, rotation: -18 },
    };
    const pricing = p.pricing || {
      marginTarget: DEFAULT_MARGIN_TARGET,
      artistRoyalty: DEFAULT_ARTIST_ROYALTY,
      lastPrintfulSyncAt: null,
    };
    setEditId(p.id);
    setForm({
      name: p.name,
      description: p.description || "",
      proofTerms: p.proofTerms || "",
      categoryId: p.categoryId || "",
      printProvider: p.printProvider || "printful",
      printfulProductId: p.printfulProductId?.toString() || "",
      printfulVariantId: p.printfulVariantId?.toString() || "",
      printfulBasePrice: (p.printfulBasePrice || 0).toString(),
      taeAddOnFee: (p.taeAddOnFee || 0).toString(),
      marginTarget: String(pricing.marginTarget ?? DEFAULT_MARGIN_TARGET),
      artistRoyalty: String(pricing.artistRoyalty ?? DEFAULT_ARTIST_ROYALTY),
      sizeLabel: p.sizeLabel || "",
      paperType: p.paperType || "",
      finishType: p.finishType || "",
      heroImage: p.heroImage || "",
      watermarkEnabled: !!wm.enabled,
      watermarkText: wm.text || "tAE",
      watermarkColor: wm.color || "#ffffff",
      watermarkOpacity: String(wm.opacity ?? 0.12),
      watermarkX: String(wm.transform?.x ?? 0.5),
      watermarkY: String(wm.transform?.y ?? 0.5),
      watermarkScale: String(wm.transform?.scale ?? 0.12),
      watermarkRotation: String(wm.transform?.rotation ?? -18),
      requiresQrCode: !!p.requiresQrCode,
      active: p.active,
      sortOrder: (p.sortOrder || 0).toString(),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, any> = {
        name: form.name,
        description: form.description || null,
        proofTerms: form.proofTerms || "",
        categoryId: form.categoryId || undefined,
        printProvider: form.printProvider,
        printfulProductId: form.printfulProductId ? parseInt(form.printfulProductId) : null,
        printfulVariantId: form.printfulVariantId ? parseInt(form.printfulVariantId) : null,
        printfulBasePrice: parseFloat(form.printfulBasePrice) || 0,
        taeAddOnFee: parseFloat(form.taeAddOnFee) || 0,
        pricing: {
          marginTarget: Math.max(0, Math.min(0.9, parseFloat(form.marginTarget) || DEFAULT_MARGIN_TARGET)),
          artistRoyalty: Math.max(0, parseFloat(form.artistRoyalty) || DEFAULT_ARTIST_ROYALTY),
          lastPrintfulSyncAt: null,
        },
        sizeLabel: form.sizeLabel || null,
        paperType: form.paperType || null,
        finishType: form.finishType || null,
        heroImage: form.heroImage || null,
        watermark: {
          enabled: !!form.watermarkEnabled,
          text: (form.watermarkText || "tAE").trim() || "tAE",
          color: form.watermarkColor || "#ffffff",
          opacity: Math.max(0.03, Math.min(0.3, parseFloat(form.watermarkOpacity) || 0.12)),
          transform: {
            x: Math.max(0, Math.min(1, parseFloat(form.watermarkX) || 0.5)),
            y: Math.max(0, Math.min(1, parseFloat(form.watermarkY) || 0.5)),
            scale: Math.max(0.05, Math.min(0.5, parseFloat(form.watermarkScale) || 0.12)),
            rotation: Math.max(-180, Math.min(180, parseFloat(form.watermarkRotation) || -18)),
          },
        },
        requiresQrCode: !!form.requiresQrCode,
        active: form.active,
        sortOrder: parseInt(form.sortOrder) || 0,
      };

      let res;
      let data: any = null;
      if (editId) {
        ({ res, data } = await adminFetchJson(`/api/admin/store-products/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }, () => router.push("/b_d_admn_tae/login")));
      } else {
        ({ res, data } = await adminFetchJson("/api/admin/store-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }, () => router.push("/b_d_admn_tae/login")));
      }

      if (res.ok && data?.success) {
        setShowForm(false);
        setEditId(null);
        setForm(EMPTY_FORM);
        await loadProducts();
      } else {
        setError(data?.error || `Save failed (${res.status})`);
      }
    } catch (err) {
      if (err instanceof AdminUnauthorizedError) return;
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { res, data } = await adminFetchJson(
        `/api/admin/store-products/${id}`,
        { method: "DELETE" },
        () => router.push("/b_d_admn_tae/login")
      );
      if (res.ok && data?.success) {
        setDeleteId(null);
        await loadProducts();
      } else {
        setError(data?.error || `Delete failed (${res.status})`);
      }
    } catch (err) {
      if (err instanceof AdminUnauthorizedError) return;
      setError("Network error");
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || p.categoryId === filterCat;
    return matchSearch && matchCat;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-brand-medium text-sm">Loading products...</div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-playfair">Products</h1>
          <p className="text-sm text-brand-medium mt-1">
            {products.length} products total. Manage pricing, preview watermarking, and studio mappings.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <button
            onClick={handleBackfillPreflight}
            disabled={checkingBackfill || backfilling}
            className={BTN_SECONDARY}
          >
            {checkingBackfill ? (
              <div className="animate-spin w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {checkingBackfill ? "Checking..." : "Check Backfill"}
          </button>
          <button
            onClick={handleBackfillImages}
            disabled={backfilling || checkingBackfill}
            className={BTN_SECONDARY}
          >
            {backfilling ? (
              <div className="animate-spin w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full" />
            ) : (
              <Package className="w-4 h-4" />
            )}
            {backfilling ? "Backfilling..." : "Backfill Images"}
          </button>
          <button
            onClick={handleSyncPrintSpecs}
            disabled={syncingSpecs}
            className={BTN_SECONDARY}
          >
            {syncingSpecs ? (
              <div className="animate-spin w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full" />
            ) : (
              <Package className="w-4 h-4" />
            )}
            {syncingSpecs ? "Syncing..." : "Sync Print Specs"}
          </button>
          <button
            onClick={handleSyncSurfaceMaps}
            disabled={syncingSurfaceMaps}
            className={BTN_SECONDARY}
          >
            {syncingSurfaceMaps ? (
              <div className="animate-spin w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full" />
            ) : (
              <Package className="w-4 h-4" />
            )}
            {syncingSurfaceMaps ? "Syncing..." : "Sync Surface Maps"}
          </button>
          <button
            onClick={() => {
              const defaultCategoryId = categories[0]?.id || "";
              setShowForm(true);
              setEditId(null);
              setForm({
                ...EMPTY_FORM,
                categoryId: defaultCategoryId,
                requiresQrCode: getCategoryRequiresQrDefault(defaultCategoryId),
              });
            }}
            className={BTN_PRIMARY}
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {backfillResult && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 mb-4 flex items-center justify-between">
          {backfillResult}
          <button onClick={() => setBackfillResult(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {mockupPreview?.mockupUrl && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              Mockup preview: {mockupPreview.productName} ({mockupPreview.placement})
              {mockupPreview.cached ? " [cached]" : ""}
            </div>
            <button onClick={() => setMockupPreview(null)}><X className="w-4 h-4" /></button>
          </div>
          <a
            href={mockupPreview.mockupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-brand-accent hover:underline"
          >
            Open mockup image
          </a>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4 flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-medium" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-brand-light text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-medium"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="border border-brand-light px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-medium"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.productCount})</option>
          ))}
        </select>
        <span className="text-xs text-brand-medium">
          Tip: use row action icons to test in studio, generate mockups, or edit media.
        </span>
      </div>

      {/* Product list */}
      <div className="bg-white border border-brand-light">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-8 h-8 text-brand-medium mx-auto mb-2" />
            <div className="text-sm text-brand-medium">No products found</div>
            <button
              onClick={() => {
                const defaultCategoryId = categories[0]?.id || "";
                setShowForm(true);
                setEditId(null);
                setForm({
                  ...EMPTY_FORM,
                  categoryId: defaultCategoryId,
                  requiresQrCode: getCategoryRequiresQrDefault(defaultCategoryId),
                });
              }}
              className="text-xs text-brand-accent hover:underline mt-2"
            >
              Create your first product
            </button>
          </div>
        ) : (
          <div className="divide-y divide-brand-light">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-brand-medium font-medium bg-brand-lightest">
              <div className="col-span-4">Product</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Provider</div>
              <div className="col-span-1">Actions</div>
            </div>
            {filtered.map((p) => (
              <div key={p.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-brand-lightest/50 transition-colors">
                <div className="col-span-12 md:col-span-4">
                  <div className="text-sm font-medium text-brand-dark">{p.name}</div>
                  <div className="text-[10px] text-brand-medium mt-0.5">{p.taeId}</div>
                </div>
                <div className="col-span-6 md:col-span-2 text-xs text-brand-medium">
                  {p.categoryName}
                </div>
                <div className="col-span-6 md:col-span-2 text-sm font-medium text-brand-dark">
                  ${(p.basePrice || 0).toFixed(2)}
                  {p.pricing && (
                    <div className="text-[10px] text-brand-medium mt-0.5">
                      Target {Math.round((p.pricing.marginTarget || 0) * 100)}% · Royalty ${(p.pricing.artistRoyalty || 0).toFixed(2)}
                    </div>
                  )}
                </div>
                <div className="col-span-4 md:col-span-1">
                  <span className={`text-[10px] px-2 py-0.5 font-medium ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="col-span-4 md:col-span-2 text-xs text-brand-medium capitalize">
                  {p.printProvider === "printful" ? "Print Partner" : (p.printProvider || "Print Partner")}
                </div>
                <div className="col-span-4 md:col-span-1 flex items-center gap-1 justify-end">
                  {p.slug && (
                    <a
                      href={`/studio?slug=${encodeURIComponent(p.slug)}&product_id=${encodeURIComponent(p.id)}${p.printfulVariantId ? `&variant_id=${p.printfulVariantId}` : ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={BTN_ICON}
                      title="Test in Studio (print from browser)"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleGenerateMockupPreview(p)}
                    disabled={generatingMockupFor === p.id}
                    className={BTN_ICON}
                    title="Generate mockup preview from latest studio export"
                  >
                    {generatingMockupFor === p.id ? (
                      <div className="animate-spin w-3.5 h-3.5 border border-brand-dark border-t-transparent rounded-full" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button onClick={() => { setImageEditProduct(p); setImgError(null); }} className={BTN_ICON} title="Images">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleEdit(p)} className={BTN_ICON} title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(p.id)} className={BTN_ICON_DANGER} title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 max-w-sm w-full">
            <h3 className="text-sm font-semibold text-brand-dark mb-2">Delete Product</h3>
            <p className="text-sm text-brand-medium mb-4">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className={BTN_SUBTLE}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl my-8">
            <div className="px-6 py-4 border-b border-brand-light flex items-center justify-between">
              <h3 className="text-lg font-semibold text-brand-dark">
                {editId ? "Edit Product" : "New Product"}
              </h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-brand-medium hover:text-brand-dark">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  placeholder="e.g. Holiday Greeting Card 5x7"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                  Proof Terms &amp; Conditions
                </label>
                <textarea
                  value={form.proofTerms}
                  onChange={(e) => setForm({ ...form, proofTerms: e.target.value })}
                  rows={4}
                  className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  placeholder="Shown during proof approval before payment for this product."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Category *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  >
                    <option value="">Select...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Print Provider</label>
                  <select
                    value={form.printProvider}
                    onChange={(e) => setForm({ ...form, printProvider: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  >
                    <option value="printful">Print Partner</option>
                    <option value="custom">Custom / In-house</option>
                  </select>
                </div>
              </div>

              <div className="border border-brand-light rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-brand-dark/70 uppercase tracking-wider">
                      ArtKey Requirement
                    </div>
                    <p className="text-[11px] mt-1 text-brand-medium">
                      Controls whether studio requires the ArtKey Portal step for this product.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, requiresQrCode: !form.requiresQrCode })}
                    className={`px-2.5 py-1 text-xs rounded border ${form.requiresQrCode ? "bg-brand-dark text-white border-brand-dark" : "bg-white text-brand-dark border-brand-light"}`}
                    title="Toggle ArtKey requirement for this product"
                  >
                    {form.requiresQrCode ? "Required" : "Not Required"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Provider Product ID</label>
                  <input
                    type="text"
                    value={form.printfulProductId}
                    onChange={(e) => setForm({ ...form, printfulProductId: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    placeholder="e.g. 358"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Provider Variant ID</label>
                  <input
                    type="text"
                    value={form.printfulVariantId}
                    onChange={(e) => setForm({ ...form, printfulVariantId: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    placeholder="e.g. 10163"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Provider Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.printfulBasePrice}
                    onChange={(e) => setForm({ ...form, printfulBasePrice: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">TAE Add-on Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.taeAddOnFee}
                    onChange={(e) => setForm({ ...form, taeAddOnFee: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  />
                </div>
              </div>

              <div className="border border-brand-light rounded-lg p-4 space-y-3">
                <div className="text-xs font-medium text-brand-dark/70 uppercase tracking-wider">Pricing Builder</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">
                      Margin Target ({Math.round(marginTarget * 100)}%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="0.9"
                      step="0.01"
                      value={form.marginTarget}
                      onChange={(e) => setForm({ ...form, marginTarget: e.target.value })}
                      className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">Artist Royalty ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.artistRoyalty}
                      onChange={(e) => setForm({ ...form, artistRoyalty: e.target.value })}
                      className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-brand-lightest border border-brand-light p-2">
                    <div className="text-brand-medium">Suggested Retail</div>
                    <div className="text-brand-dark font-semibold">${suggestedRetail.toFixed(2)}</div>
                  </div>
                  <div className="bg-brand-lightest border border-brand-light p-2">
                    <div className="text-brand-medium">Suggested Add-on</div>
                    <div className="text-brand-dark font-semibold">${suggestedTaeAddon.toFixed(2)}</div>
                  </div>
                  <div className="bg-brand-lightest border border-brand-light p-2">
                    <div className="text-brand-medium">Expected Profit</div>
                    <div className="text-brand-dark font-semibold">${expectedProfit.toFixed(2)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white border border-brand-light p-2">
                    <div className="text-brand-medium">Current Retail</div>
                    <div className="text-brand-dark font-semibold">${currentRetail.toFixed(2)}</div>
                  </div>
                  <div className="bg-white border border-brand-light p-2">
                    <div className="text-brand-medium">Current Profit</div>
                    <div className="text-brand-dark font-semibold">${currentProfit.toFixed(2)}</div>
                  </div>
                  <div className="bg-white border border-brand-light p-2">
                    <div className="text-brand-medium">Current Margin</div>
                    <div className="text-brand-dark font-semibold">{Math.round(currentMargin * 100)}%</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, taeAddOnFee: suggestedTaeAddon.toFixed(2) })}
                    className="px-3 py-1.5 text-xs border border-brand-dark text-brand-dark hover:bg-brand-dark/10"
                  >
                    Apply Suggested Add-on
                  </button>
                  <span className="text-[11px] text-brand-medium self-center">
                    Printful cost is source-of-truth; margin/royalty stay editable.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Size Label</label>
                  <input
                    type="text"
                    value={form.sizeLabel}
                    onChange={(e) => setForm({ ...form, sizeLabel: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    placeholder='e.g. 5" x 7"'
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Paper Type</label>
                  <input
                    type="text"
                    value={form.paperType}
                    onChange={(e) => setForm({ ...form, paperType: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    placeholder="e.g. Matte"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Finish Type</label>
                  <input
                    type="text"
                    value={form.finishType}
                    onChange={(e) => setForm({ ...form, finishType: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    placeholder="e.g. Glossy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Hero Image URL</label>
                <input
                  type="text"
                  value={form.heroImage}
                  onChange={(e) => setForm({ ...form, heroImage: e.target.value })}
                  className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  placeholder="https://..."
                />
              </div>

              <div className="border border-brand-light rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-brand-dark/70 uppercase tracking-wider">Watermark</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, watermarkEnabled: !form.watermarkEnabled })}
                    className={`px-2.5 py-1 text-xs rounded border ${form.watermarkEnabled ? "bg-brand-dark text-white border-brand-dark" : "bg-white text-brand-dark border-brand-light"}`}
                  >
                    {form.watermarkEnabled ? "On" : "Off"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">Watermark Text</label>
                    <input
                      type="text"
                      value={form.watermarkText}
                      onChange={(e) => setForm({ ...form, watermarkText: e.target.value })}
                      className="w-full border border-brand-light px-3 py-2 text-sm bg-brand-lightest"
                      placeholder="tAE"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">Color</label>
                    <input
                      type="color"
                      value={form.watermarkColor}
                      onChange={(e) => setForm({ ...form, watermarkColor: e.target.value })}
                      className="w-full h-10 border border-brand-light bg-brand-lightest"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">
                    Opacity ({Math.round((parseFloat(form.watermarkOpacity) || 0.12) * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.03"
                    max="0.30"
                    step="0.01"
                    value={form.watermarkOpacity}
                    onChange={(e) => setForm({ ...form, watermarkOpacity: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={openWatermarkEditor}
                    className="px-3 py-1.5 text-xs border border-brand-dark text-brand-dark hover:bg-brand-dark/10"
                  >
                    Edit Placement
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        watermarkX: "0.5",
                        watermarkY: "0.5",
                        watermarkScale: "0.12",
                        watermarkRotation: "-18",
                      })
                    }
                    className="px-3 py-1.5 text-xs border border-brand-light text-brand-dark hover:bg-brand-lightest"
                  >
                    Reset Placement
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, watermarkEnabled: false })}
                    className="px-3 py-1.5 text-xs border border-red-200 text-red-700 hover:bg-red-50"
                  >
                    Remove Watermark
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={`w-5 h-5 border flex items-center justify-center transition-colors ${
                    form.active ? "bg-brand-dark border-brand-dark text-white" : "border-brand-light"
                  }`}
                >
                  {form.active && <Check className="w-3 h-3" />}
                </button>
                <span className="text-sm text-brand-dark">Active (visible in shop)</span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-brand-light flex items-center justify-end gap-2">
              <button
                onClick={() => { setShowForm(false); setEditId(null); }}
                className={BTN_SUBTLE}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className={BTN_PRIMARY}
              >
                {saving ? "Saving..." : editId ? "Update Product" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWatermarkEditor && wmDraft && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-brand-light flex items-center justify-between">
              <h3 className="text-sm font-semibold text-brand-dark">Watermark Placement</h3>
              <button onClick={closeWatermarkEditor} className="text-brand-medium hover:text-brand-dark">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div
                className="relative w-full max-w-xl mx-auto aspect-[4/3] border border-brand-light bg-gray-100 overflow-hidden touch-none"
                onPointerMove={(e) => {
                  if (!wmDragging && !wmResizing) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
                  if (wmDragging) {
                    setWmDraft((prev) => (prev ? { ...prev, x: relX, y: relY } : prev));
                  } else if (wmResizing) {
                    const dx = relX - wmDraft.x;
                    const dy = relY - wmDraft.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    setWmDraft((prev) => (prev ? { ...prev, scale: Math.max(0.05, Math.min(0.5, distance * 2)) } : prev));
                  }
                }}
                onPointerUp={() => {
                  setWmDragging(false);
                  setWmResizing(false);
                }}
                onPointerLeave={() => {
                  setWmDragging(false);
                  setWmResizing(false);
                }}
              >
                {form.heroImage ? (
                  <img src={form.heroImage} alt="Watermark preview" className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-brand-medium">No hero image yet</div>
                )}
                <div
                  className="absolute select-none cursor-move"
                  style={{
                    left: `${wmDraft.x * 100}%`,
                    top: `${wmDraft.y * 100}%`,
                    transform: `translate(-50%, -50%) rotate(${wmDraft.rotation}deg)`,
                    color: form.watermarkColor || "#ffffff",
                    opacity: Math.max(0.03, Math.min(0.3, parseFloat(form.watermarkOpacity) || 0.12)),
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontWeight: 700,
                    fontSize: `${Math.max(18, Math.round(wmDraft.scale * 160))}px`,
                    textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setWmDragging(true);
                  }}
                >
                  {form.watermarkText || "tAE"}
                  <span
                    className="absolute -right-4 -bottom-4 w-4 h-4 rounded-full bg-white border border-brand-dark cursor-se-resize"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setWmResizing(true);
                    }}
                    aria-label="Resize watermark"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-brand-medium mb-1">Rotation</label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={wmDraft.rotation}
                    onChange={(e) => setWmDraft({ ...wmDraft, rotation: parseFloat(e.target.value) || 0 })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-brand-medium mb-1">Scale</label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.5"
                    step="0.01"
                    value={wmDraft.scale}
                    onChange={(e) => setWmDraft({ ...wmDraft, scale: parseFloat(e.target.value) || 0.12 })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-brand-light flex justify-end gap-2">
              <button onClick={closeWatermarkEditor} className={BTN_SUBTLE}>Cancel</button>
              <button onClick={commitWatermarkEditor} className={BTN_PRIMARY}>Save Placement</button>
            </div>
          </div>
        </div>
      )}

      {/* Image editor modal */}
      {imageEditProduct && (() => {
        let gallery: string[] = [];
        try { gallery = imageEditProduct.galleryImages ? JSON.parse(imageEditProduct.galleryImages) : []; } catch { /* ok */ }
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-3xl my-8">
              <div className="px-6 py-4 border-b border-brand-light flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-brand-dark">Product Images</h3>
                  <p className="text-xs text-brand-medium mt-0.5">{imageEditProduct.name}</p>
                </div>
                <button onClick={() => setImageEditProduct(null)} className="text-brand-medium hover:text-brand-dark">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {imgError && (
                <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 flex items-center justify-between">
                  {imgError}
                  <button onClick={() => setImgError(null)}><X className="w-4 h-4" /></button>
                </div>
              )}

              <div className="p-6 space-y-6">
                {/* Hero image */}
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-2 uppercase tracking-wider">Hero Image</label>
                  <div className="flex items-start gap-4">
                    {imageEditProduct.heroImage ? (
                      <div className="relative group">
                        <img
                          src={imageEditProduct.heroImage}
                          alt="Hero"
                          className="w-40 h-28 object-cover border border-brand-light"
                          onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                        />
                        <button
                          onClick={handleRemoveHero}
                          className="absolute top-1 right-1 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-40 h-28 border-2 border-dashed border-brand-light flex items-center justify-center text-brand-medium">
                        <ImageIcon className="w-8 h-8 opacity-30" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-brand-dark text-brand-dark cursor-pointer hover:bg-brand-dark/10 transition-colors">
                        <Upload className="w-4 h-4" />
                        {heroUploading ? "Uploading..." : imageEditProduct.heroImage ? "Replace" : "Upload Hero"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleHeroUpload}
                          disabled={heroUploading}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-brand-medium mt-2">JPEG, PNG, or WebP. Max 15 MB.</p>
                    </div>
                  </div>
                </div>

                {/* Gallery images */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-brand-dark/70 uppercase tracking-wider">
                      Gallery Images ({gallery.length}/30)
                    </label>
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border border-brand-dark text-brand-dark cursor-pointer hover:bg-brand-dark/10 transition-colors">
                      <Upload className="w-3 h-3" />
                      {galleryUploading ? "Uploading..." : "Add Images"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleGalleryUpload}
                        disabled={galleryUploading || gallery.length >= 30}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {gallery.length === 0 ? (
                    <div className="border-2 border-dashed border-brand-light p-8 text-center text-sm text-brand-medium">
                      No gallery images yet. Click "Add Images" to upload.
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                      {gallery.map((url, idx) => (
                        <div
                          key={`${url}-${idx}`}
                          draggable
                          onDragStart={() => setDragIdx(idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => { if (dragIdx !== null && dragIdx !== idx) handleGalleryReorder(dragIdx, idx); setDragIdx(null); }}
                          className={`relative group aspect-square border ${dragIdx === idx ? "border-blue-500 opacity-50" : "border-brand-light"}`}
                        >
                          <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          <button
                            onClick={() => handleRemoveGalleryImage(idx)}
                            className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-0.5 left-0.5 opacity-0 group-hover:opacity-80 transition-opacity cursor-grab">
                            <GripVertical className="w-3 h-3 text-white drop-shadow" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-brand-medium mt-2">Drag to reorder. Hover and click X to remove.</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-brand-light flex justify-end">
                <button
                  onClick={() => setImageEditProduct(null)}
                  className={BTN_PRIMARY}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
