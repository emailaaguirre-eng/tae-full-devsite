// app/studio/page.tsx
// Customization Studio — real products via ?slug=...; optional ?demo=1 for hardcoded samples only.
"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ProductSpec, Placement, DesignState } from "@/customization-studio/types";
import Link from "next/link";
import { ARTKEY_TEMPLATES } from "@/lib/artkeyTemplates";
import { parseVariantMatrix } from "@/lib/product-watermark";
import { encodeDesignFilesForStudioRegister } from "@/lib/studio-register-compress";
import { customerPlacementLabel } from "@/lib/customer-placement-label";
import { customerStudioProofMessageFromApi } from "@/lib/customer-proof-errors";

/** Shown in the studio when live preview can’t run (avoid provider jargon in customer UI). */
const STUDIO_PREVIEW_UNAVAILABLE_HINT =
  "We can’t show a live print preview for this product in the studio yet. You can still save your design and continue to your ArtKey\u2122.";

const CustomizationStudio = dynamic(
  () => import("@/customization-studio").then((m) => m.CustomizationStudio),
  { ssr: false, loading: () => (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-3 border-gray-300 border-t-gray-800 rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Loading design studio...</p>
      </div>
    </div>
  )}
);

// =============================================================================
// BUILT-IN DEMO CATALOG (?demo=1 only — not linked to admin shop products)
// =============================================================================

type Orientation = "portrait" | "landscape";

type ProductDefinition = {
  id: string;
  name: string;
  printfulProductId: number;
  variants: {
    id: string;
    name: string;
    printfulVariantId: number;
    landscapeWidth: number;
    landscapeHeight: number;
  }[];
  printDpi: number;
  placements: ProductSpec["placements"];
  requiresQrCode: boolean;
  supportsOrientation: boolean;
  defaultOrientation: Orientation;
  qrSizeInches: number;
};

const PRODUCTS: ProductDefinition[] = [
  {
    id: "TAE-CARD",
    name: "ArtKey\u2122 Card",
    printfulProductId: 568,
    variants: [
      { id: "TAE-CARD-SM", name: 'Small (4.25" x 5.5")', printfulVariantId: 14457, landscapeWidth: 1842, landscapeHeight: 1240 },
      { id: "TAE-CARD-MD", name: 'Medium (5" x 7")', printfulVariantId: 14458, landscapeWidth: 2146, landscapeHeight: 1546 },
      { id: "TAE-CARD-LG", name: 'Large (A5 - 5.83" x 8.27")', printfulVariantId: 14460, landscapeWidth: 2526, landscapeHeight: 1794 },
    ],
    printDpi: 300,
    placements: ["front", "inside1", "inside2", "back"],
    requiresQrCode: true,
    supportsOrientation: true,
    defaultOrientation: "portrait",
    qrSizeInches: 0.5,
  },
  {
    id: "TAE-POST",
    name: "Postcard",
    printfulProductId: 156,
    variants: [
      { id: "TAE-POST-4x6", name: '4" x 6"', printfulVariantId: 4545, landscapeWidth: 1872, landscapeHeight: 1272 },
      { id: "TAE-POST-5x7", name: '5" x 7"', printfulVariantId: 4546, landscapeWidth: 2172, landscapeHeight: 1572 },
    ],
    printDpi: 300,
    placements: ["front", "back"],
    requiresQrCode: true,
    supportsOrientation: true,
    defaultOrientation: "landscape",
    qrSizeInches: 0.5,
  },
  {
    id: "TAE-WALL",
    name: "Poster",
    printfulProductId: 1,
    variants: [
      { id: "TAE-WALL-12x18", name: '12" x 18"', printfulVariantId: 8630, landscapeWidth: 5400, landscapeHeight: 3600 },
      { id: "TAE-WALL-18x24", name: '18" x 24"', printfulVariantId: 8631, landscapeWidth: 7200, landscapeHeight: 5400 },
      { id: "TAE-WALL-24x36", name: '24" x 36"', printfulVariantId: 8632, landscapeWidth: 10800, landscapeHeight: 7200 },
    ],
    printDpi: 300,
    placements: ["front"],
    requiresQrCode: true,
    supportsOrientation: true,
    defaultOrientation: "portrait",
    qrSizeInches: 0.5,
  },
];

function pickFallbackProductIndex(
  products: ProductDefinition[],
  productNameHint: string | null
): number {
  if (!productNameHint) return 0;
  const hint = productNameHint.toLowerCase();
  const idx = products.findIndex((p) => {
    const name = p.name.toLowerCase();
    if (name.includes("card") && (hint.includes("card") || hint.includes("artkey"))) return true;
    if (name.includes("postcard") && hint.includes("postcard")) return true;
    if (name.includes("poster") && (hint.includes("poster") || hint.includes("print"))) return true;
    return false;
  });
  return idx >= 0 ? idx : 0;
}

function formatProofFailure(
  data: {
    error?: string;
    code?: string;
    hint?: string;
    placements?: string[];
  } | null | undefined,
  httpStatus?: number,
  rawBody?: string
): string {
  const chunks: string[] = [];
  if (data?.error) chunks.push(String(data.error));
  if (data?.code) chunks.push(`[${String(data.code)}]`);
  if (Array.isArray(data?.placements) && data.placements.length) {
    chunks.push(`Exported placements: ${data.placements.join(", ")}.`);
  }
  if (data?.hint) chunks.push(String(data.hint));
  const fromJson = chunks.join(" ").replace(/\s+/g, " ").trim();
  if (fromJson) return fromJson;
  const raw = (rawBody || "").trim();
  if (raw) return raw.length > 600 ? `${raw.slice(0, 600)}…` : raw;
  if (httpStatus != null) return `Request failed (HTTP ${httpStatus}).`;
  return "";
}

async function readResponseJson(res: Response): Promise<{ data: any; raw: string }> {
  const raw = await res.text();
  if (!raw) return { data: {}, raw: "" };
  try {
    return { data: JSON.parse(raw), raw };
  } catch {
    return {
      data: { error: `Non-JSON response (HTTP ${res.status}): ${raw.slice(0, 280)}` },
      raw,
    };
  }
}

function buildProductSpec(
  product: ProductDefinition,
  variantIndex: number,
  orientation: Orientation
): ProductSpec {
  const variant = product.variants[variantIndex];
  const isPortrait = orientation === "portrait";
  const printWidth = isPortrait ? variant.landscapeHeight : variant.landscapeWidth;
  const printHeight = isPortrait ? variant.landscapeWidth : variant.landscapeHeight;

  const qrSize = Math.round(product.qrSizeInches * product.printDpi);
  const qrInTemplateFraction = 0.55;
  const templateSize = Math.round(qrSize / qrInTemplateFraction);
  const margin = Math.round(0.5 * product.printDpi);
  const qrPlacement = (product.placements as string[]).includes("back") ? "back" : "front";

  return {
    id: variant.id,
    name: `${product.name} - ${variant.name} (${orientation})`,
    printfulProductId: product.printfulProductId,
    printfulVariantId: variant.printfulVariantId,
    printWidth,
    printHeight,
    printDpi: product.printDpi,
    placements: product.placements,
    requiresQrCode: product.requiresQrCode,
    qrDefaultPosition: product.requiresQrCode
      ? {
          placement: qrPlacement as Placement,
          top: printHeight - templateSize - margin,
          left: printWidth - templateSize - margin,
          width: templateSize,
          height: templateSize,
        }
      : undefined,
  };
}

// =============================================================================
// Build ProductSpec from API product data + print specs (including surface map)
// =============================================================================

interface PrintSpecsData {
  printAreas?: Record<string, any>;
  surfaceMap?: {
    uxSurfaces: Array<{ id: string; label: string; printfulPlacement: string; role?: string; order: number }>;
    exportRules: Array<{ printfulPlacement: string; uxSurfaceIds: string[]; composite?: { type: string } }>;
  } | null;
}

function buildSpecFromApiProduct(
  apiProduct: any,
  printSpecsData?: PrintSpecsData | null,
  selectedPrintfulVariantId?: number | null
): ProductSpec {
  const resolvePrintfulProductId = (productInput: any): number | undefined => {
    const direct = Math.trunc(Number(productInput?.printfulProductId));
    if (Number.isFinite(direct) && direct > 0) return direct;

    const rows = parseVariantMatrix(productInput?.printfulDataJson);
    const selectedVariantId = Math.trunc(
      Number(selectedPrintfulVariantId ?? productInput?.printfulVariantId)
    );

    if (Number.isFinite(selectedVariantId) && selectedVariantId > 0) {
      const matchedRow = rows.find((row: any) => {
        const rowVariantId = Math.trunc(Number(row?.printfulVariantId));
        const rowProductId = Math.trunc(Number(row?.printfulProductId));
        return (
          row?.active !== false &&
          Number.isFinite(rowVariantId) &&
          rowVariantId === selectedVariantId &&
          Number.isFinite(rowProductId) &&
          rowProductId > 0
        );
      });
      if (matchedRow?.printfulProductId) {
        return Math.trunc(Number(matchedRow.printfulProductId));
      }
    }

    const fallbackRow = rows.find((row: any) => {
      const rowProductId = Math.trunc(Number(row?.printfulProductId));
      return row?.active !== false && Number.isFinite(rowProductId) && rowProductId > 0;
    });
    if (fallbackRow?.printfulProductId) {
      return Math.trunc(Number(fallbackRow.printfulProductId));
    }
    return undefined;
  };
  const resolvePrintfulVariantId = (productInput: any): number | undefined => {
    const direct = Math.trunc(Number(productInput?.printfulVariantId));
    if (Number.isFinite(direct) && direct > 0) return direct;

    const rows = parseVariantMatrix(productInput?.printfulDataJson);
    const selectedVariantId = Math.trunc(
      Number(selectedPrintfulVariantId ?? productInput?.printfulVariantId)
    );

    if (Number.isFinite(selectedVariantId) && selectedVariantId > 0) {
      const matchedRow = rows.find((row: any) => {
        const rowVariantId = Math.trunc(Number(row?.printfulVariantId));
        return (
          row?.active !== false &&
          Number.isFinite(rowVariantId) &&
          rowVariantId === selectedVariantId
        );
      });
      if (matchedRow?.printfulVariantId) {
        return Math.trunc(Number(matchedRow.printfulVariantId));
      }
    }

    const fallbackRow = rows.find((row: any) => {
      const rowVariantId = Math.trunc(Number(row?.printfulVariantId));
      return row?.active !== false && Number.isFinite(rowVariantId) && rowVariantId > 0;
    });
    if (fallbackRow?.printfulVariantId) {
      return Math.trunc(Number(fallbackRow.printfulVariantId));
    }
    return undefined;
  };
  const numOr = (value: unknown, fallback: number) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  const printWidth = numOr(apiProduct?.printWidth, 2146);
  const printHeight = numOr(apiProduct?.printHeight, 1546);
  const printDpi = numOr(apiProduct?.printDpi, 300);
  const basePrice = Number(apiProduct?.basePrice);

  let placements: Placement[] = ["front"];
  let placementLabels: Record<string, string> | undefined = undefined;
  let exportRules: ProductSpec["exportRules"] = undefined;
  let surfacePlacementMap: Record<string, string> | undefined = undefined;

  // Priority 1: SurfaceMap from DB (authoritative source of truth)
  const surfaceMap = printSpecsData?.surfaceMap;
  if (surfaceMap && surfaceMap.uxSurfaces.length > 0) {
    const sorted = [...surfaceMap.uxSurfaces].sort((a, b) => a.order - b.order);
    placements = sorted.map((s) => s.id);
    placementLabels = {};
    surfacePlacementMap = {};
    for (const s of sorted) {
      placementLabels[s.id] = s.label;
      surfacePlacementMap[s.id] = s.printfulPlacement;
    }
    if (surfaceMap.exportRules?.length > 0) {
      exportRules = surfaceMap.exportRules as ProductSpec["exportRules"];
    }
  } else {
    // Fallback: DB requiredPlacements field
    if (apiProduct.requiredPlacements) {
      try {
        placements = JSON.parse(apiProduct.requiredPlacements);
      } catch { /* fall through */ }
    }
  }

  // Build per-placement dimensions from Printful print specs
  let placementDimensions: ProductSpec["placementDimensions"] = undefined;
  const printAreas = printSpecsData?.printAreas;
  if (printAreas && Object.keys(printAreas).length > 0) {
    placementDimensions = {};
    for (const [pfPlacement, area] of Object.entries(printAreas)) {
      const a = area as any;
      placementDimensions[pfPlacement] = {
        width: numOr(a?.width, printWidth),
        height: numOr(a?.height, printHeight),
        dpi: numOr(a?.dpi, printDpi),
        printfulPlacement: pfPlacement,
      };
    }
  }

  let qrDefaultPosition: ProductSpec["qrDefaultPosition"] = undefined;
  if (apiProduct.requiresQrCode) {
    if (apiProduct.qrDefaultPosition) {
      try {
        qrDefaultPosition = JSON.parse(apiProduct.qrDefaultPosition);
      } catch { /* compute below */ }
    }
    if (!qrDefaultPosition) {
      const qrSizeInches = 0.5;
      const qrSize = Math.round(qrSizeInches * printDpi);
      const templateSize = Math.round(qrSize / 0.55);
      const margin = Math.round(0.5 * printDpi);
      const qrPlacement = placements.includes("back") ? "back" : "front";
      qrDefaultPosition = {
        placement: qrPlacement,
        top: printHeight - templateSize - margin,
        left: printWidth - templateSize - margin,
        width: templateSize,
        height: templateSize,
      };
    }
  }

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    printfulProductId: resolvePrintfulProductId(apiProduct),
    printfulVariantId: resolvePrintfulVariantId(apiProduct),
    productSlug: apiProduct.slug,
    basePrice: Number.isFinite(basePrice) ? basePrice : 0,
    printWidth,
    printHeight,
    printDpi,
    placements,
    placementLabels,
    placementDimensions,
    exportRules,
    surfacePlacementMap,
    requiresQrCode: apiProduct.requiresQrCode || false,
    qrDefaultPosition,
  };
}

// =============================================================================
// STUDIO CONTENT (uses searchParams)
// =============================================================================

interface ApiVariant {
  id: string;
  slug: string;
  name: string;
  sizeLabel: string | null;
  basePrice: number;
  printfulVariantId: number | null;
  printWidth: number | null;
  printHeight: number | null;
  isCurrent: boolean;
  pfSize: string | null;
  pfName: string | null;
  inStock: boolean;
}

function StudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const slugParam = searchParams.get("slug");
  const productIdParam = searchParams.get("product_id");
  const productNameParam = searchParams.get("product_name");
  const requiresQrParam = searchParams.get("requires_qr");
  const forceArtKeyParam = searchParams.get("force_artkey");
  const restoreDesignParam = searchParams.get("restore_design");
  const cartItemIdParam = searchParams.get("cart_item_id");
  const variantIdParam = searchParams.get("variant_id");
  const demoMode = searchParams.get("demo") === "1";
  const showChooseProduct = !slugParam && !demoMode;

  // API-loaded product state
  const [apiProduct, setApiProduct] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(!!slugParam);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiVariants, setApiVariants] = useState<ApiVariant[]>([]);
  const [printSpecsData, setPrintSpecsData] = useState<PrintSpecsData | null>(null);
  const [proofPreview, setProofPreview] = useState<{
    blobUrl: string;
    placement: string;
  } | null>(null);
  const proofBlobCleanupRef = useRef<string | null>(null);
  const [proofPreviewKey, setProofPreviewKey] = useState<string | null>(null);
  const [proofPreviewError, setProofPreviewError] = useState<string | null>(null);
  const [studioProofLightboxOpen, setStudioProofLightboxOpen] = useState(false);

  // Fallback catalog state
  const [selectedProductIndex, setSelectedProductIndex] = useState(() =>
    pickFallbackProductIndex(PRODUCTS, productNameParam)
  );
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(1);
  const [orientation, setOrientation] = useState<Orientation>(PRODUCTS[0].defaultOrientation);

  // Fetch product from API if slug is provided
  useEffect(() => {
    if (!slugParam) return;
    setApiLoading(true);
    fetch(`/api/products/${slugParam}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setApiProduct(data.data);
        } else {
          setApiError(data.error || "Product not found");
        }
      })
      .catch(() => setApiError("Failed to load product"))
      .finally(() => setApiLoading(false));
  }, [slugParam]);

  // Demo mode only: align sample product with optional name hint from URL.
  useEffect(() => {
    if (slugParam || !demoMode) return;
    setSelectedProductIndex(pickFallbackProductIndex(PRODUCTS, productNameParam));
  }, [slugParam, productNameParam, demoMode]);

  // Fetch sibling variants for API mode
  useEffect(() => {
    if (!slugParam) return;
    fetch(`/api/products/${slugParam}/variants`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setApiVariants(data.data);
        }
      })
      .catch(() => {});
  }, [slugParam]);

  // Fetch print area specs + surface map for API mode
  useEffect(() => {
    if (!slugParam) return;
    fetch(`/api/products/${slugParam}/print-specs`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setPrintSpecsData({
            printAreas: data.data.printAreas || {},
            surfaceMap: data.data.surfaceMap || null,
          });
        }
      })
      .catch(() => {});
  }, [slugParam]);

  // Determine product spec
  const isApiMode = !!slugParam && !!apiProduct;
  const selectedProduct = PRODUCTS[selectedProductIndex];

  /** Matrix SKUs use row-level prices from GET /variants; GET /products/[slug] basePrice is often 0 — align studio export with PDP. */
  const productSpec: ProductSpec = useMemo(() => {
    const base = isApiMode
      ? buildSpecFromApiProduct(
          apiProduct,
          printSpecsData,
          variantIdParam ? Math.trunc(Number(variantIdParam)) : null
        )
      : buildProductSpec(selectedProduct, selectedVariantIndex, orientation);

    if (!isApiMode || !Array.isArray(apiVariants) || apiVariants.length === 0) {
      return base;
    }

    const targetVid = base.printfulVariantId;
    if (targetVid == null || !Number.isFinite(Number(targetVid)) || Math.trunc(Number(targetVid)) <= 0) {
      return base;
    }

    const matched = apiVariants.find(
      (v) =>
        v.printfulVariantId != null &&
        Math.trunc(Number(v.printfulVariantId)) === Math.trunc(Number(targetVid))
    );
    if (!matched) return base;

    const variantPrice = Number(matched.basePrice);
    if (!Number.isFinite(variantPrice)) return base;

    return { ...base, basePrice: variantPrice };
  }, [
    isApiMode,
    apiProduct,
    apiVariants,
    printSpecsData,
    variantIdParam,
    selectedProduct,
    selectedVariantIndex,
    orientation,
  ]);

  const productName = isApiMode ? apiProduct.name : selectedProduct.name;

  const proofBlockReason = useMemo(() => {
    const pid = productSpec.printfulProductId;
    const vid = productSpec.printfulVariantId;
    const pidOk =
      pid != null && Number.isFinite(Number(pid)) && Math.trunc(Number(pid)) > 0;
    const vidOk =
      vid != null && Number.isFinite(Number(vid)) && Math.trunc(Number(vid)) > 0;
    if (!pidOk) {
      return "Print proof needs a Printful product ID on this product. In Admin → Catalog → Products, set the Printful product ID or an active variant matrix row with a product ID.";
    }
    if (!vidOk) {
      return "Print proof needs a Printful variant ID. In Admin → Catalog → Products, set the variant ID (or matrix row) for the SKU you opened in the studio.";
    }
    return null;
  }, [productSpec.printfulProductId, productSpec.printfulVariantId]);

  const proofBlockedUserHint = proofBlockReason ? STUDIO_PREVIEW_UNAVAILABLE_HINT : null;

  const initialDesigns: DesignState | undefined = useMemo(() => {
    if (restoreDesignParam !== "1") return undefined;
    const restoreKeys = cartItemIdParam
      ? [`tae-studio-design-${cartItemIdParam}`, `tae-studio-design-${productSpec.id}`]
      : [`tae-studio-design-${productSpec.id}`];
    try {
      for (const key of restoreKeys) {
        const raw = sessionStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") continue;
        return parsed as DesignState;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }, [cartItemIdParam, productSpec.id, restoreDesignParam]);

  const handleStudioSave = useCallback((designs: DesignState) => {
    const keys = new Set<string>([`tae-studio-design-${productSpec.id}`]);
    if (cartItemIdParam) keys.add(`tae-studio-design-${cartItemIdParam}`);
    for (const key of keys) {
      try {
        sessionStorage.setItem(key, JSON.stringify(designs));
      } catch {
        // Non-fatal: studio editing continues even if session storage is full.
      }
    }
  }, [cartItemIdParam, productSpec.id]);

  const computeRenderSignature = useCallback(
    (files: { placement: string; dataUrl: string }[]) =>
      files
        .map((f) => `${f.placement}:${f.dataUrl?.length || 0}:${(f.dataUrl || "").slice(0, 32)}`)
        .join("|"),
    []
  );

  useEffect(() => {
    setProofPreview((prev) => {
      if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return null;
    });
    proofBlobCleanupRef.current = null;
    setProofPreviewKey(null);
    setProofPreviewError(null);
  }, [productSpec.printfulProductId, productSpec.printfulVariantId]);

  useEffect(() => {
    proofBlobCleanupRef.current = proofPreview?.blobUrl ?? null;
  }, [proofPreview?.blobUrl]);

  useEffect(() => {
    return () => {
      if (proofBlobCleanupRef.current) {
        URL.revokeObjectURL(proofBlobCleanupRef.current);
        proofBlobCleanupRef.current = null;
      }
    };
  }, []);

  const handlePreviewPrintProof = useCallback(
    async (files: { placement: string; dataUrl: string }[]) => {
      const first = files[0];
      if (!first) {
        throw new Error("No design surface is ready to preview yet.");
      }
      if (proofBlockReason) {
        throw new Error(proofBlockedUserHint || STUDIO_PREVIEW_UNAVAILABLE_HINT);
      }
      if (!productSpec.printfulProductId) {
        throw new Error(
          "This product isn’t set up for live print preview yet. You can still save your design and continue."
        );
      }
      if (!productSpec.printfulVariantId) {
        throw new Error(
          "This product isn’t set up for live print preview yet. You can still save your design and continue."
        );
      }
      const previewKey = [
        productSpec.printfulProductId,
        productSpec.printfulVariantId,
        first.placement,
        computeRenderSignature(files),
      ].join("|");

      if (proofPreview && proofPreviewKey === previewKey) {
        setProofPreviewError(null);
        return;
      }

      setProofPreviewError(null);
      const registerFiles = await encodeDesignFilesForStudioRegister(files);
      const registerRes = await fetch("/api/studio/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopProductId: productSpec.id,
          productSlug: productSpec.productSlug || null,
          productName: productSpec.name,
          studioRenderSignature: computeRenderSignature(registerFiles),
          designFiles: registerFiles,
        }),
      });
      const registerParsed = await readResponseJson(registerRes);
      const registerData = registerParsed.data;
      if (!registerRes.ok || !registerData?.success || !registerData?.export?.exportId) {
        console.error(
          "[studio] export register failed",
          formatProofFailure(registerData, registerRes.status, registerParsed.raw),
          registerData
        );
        throw new Error(customerStudioProofMessageFromApi(registerData, registerRes.status));
      }

      const previewRes = await fetch("/api/studio/proof-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          printfulProductId: productSpec.printfulProductId,
          printfulVariantId: productSpec.printfulVariantId,
          studioExportId: registerData.export.exportId,
          placement: first.placement,
        }),
      });
      const previewParsed = await readResponseJson(previewRes);
      const previewData = previewParsed.data;
      if (!previewRes.ok || !previewData?.success || !previewData?.previewUrl) {
        console.error(
          "[studio] proof-preview failed",
          formatProofFailure(previewData, previewRes.status, previewParsed.raw),
          previewData
        );
        throw new Error(customerStudioProofMessageFromApi(previewData, previewRes.status));
      }

      const proxyRes = await fetch("/api/proof-image-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: previewData.previewUrl }),
      });
      if (!proxyRes.ok) {
        let proxyCode: string | undefined;
        try {
          const j = await proxyRes.json();
          proxyCode = j?.code;
        } catch {
          /* ignore */
        }
        console.error("[studio] proof-image-proxy failed", proxyRes.status, proxyCode);
        throw new Error(customerStudioProofMessageFromApi({ code: proxyCode }, proxyRes.status));
      }

      const blob = await proxyRes.blob();
      const blobUrl = URL.createObjectURL(blob);
      setProofPreview((prev) => {
        if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
        return {
          blobUrl,
          placement: previewData.placement || first.placement,
        };
      });
      setProofPreviewKey(previewKey);
    },
    [
      computeRenderSignature,
      productSpec,
      proofBlockReason,
      proofBlockedUserHint,
      proofPreview,
      proofPreviewKey,
    ]
  );

  // Handle export: save design files to sessionStorage, then navigate to ArtKey editor
  const handleExport = useCallback(
    async (
      files: { placement: string; dataUrl: string }[],
      artKeyTemplatePosition?: {
        placement: string;
        x: number;
        y: number;
        width: number;
        height: number;
        templateId: string;
      }
    ) => {
      const registerFiles = await encodeDesignFilesForStudioRegister(files);
      const studioRenderSignature = computeRenderSignature(registerFiles);
      let studioExportId: string | null = null;
      try {
        const registerRes = await fetch("/api/studio/exports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopProductId: productSpec.id,
            productSlug: productSpec.productSlug || null,
            productName: productSpec.name,
            studioRenderSignature,
            designFiles: registerFiles,
          }),
        });
        const registerData = await registerRes.json().catch(() => ({}));
        if (registerRes.ok && registerData?.success) {
          studioExportId = registerData.export?.exportId || null;
        }
      } catch {
        // Non-blocking: export flow still continues for checkout.
      }

      const studioData = {
        productSpec: {
          id: productSpec.id,
          name: productSpec.name,
          printfulProductId: productSpec.printfulProductId,
          printfulVariantId: productSpec.printfulVariantId,
          productSlug: productSpec.productSlug,
          basePrice: productSpec.basePrice,
          requiresQrCode: productSpec.requiresQrCode,
        },
        designFiles: registerFiles,
        studioRenderSignature,
        studioExportId,
        artKeyTemplatePosition: artKeyTemplatePosition || null,
        exportedAt: new Date().toISOString(),
      };

      try {
        sessionStorage.setItem("tae-studio-export", JSON.stringify(studioData));
      } catch (e) {
        console.error("[studio] tae-studio-export sessionStorage failed:", e);
        throw new Error(
          "Design too large to save — try reducing image size or number of surfaces."
        );
      }

      // Save & Continue always opens the ArtKey Portal Editor so sessionStorage handoff
      // (tae-studio-export + from_studio) matches ArtKeyEditor expectations. Checkout still
      // happens from the editor when the user finishes the portal.
      const params = new URLSearchParams({
        from_studio: "true",
        product_id: productSpec.id,
        product_name: productSpec.name,
      });
      if (cartItemIdParam) params.set("cart_item_id", cartItemIdParam);
      if (productSpec.productSlug) params.set("slug", productSpec.productSlug);
      router.push(`/artkey-editor?${params}`);
    },
    [cartItemIdParam, computeRenderSignature, productSpec, router]
  );

  const handleProductChange = (index: number) => {
    setSelectedProductIndex(index);
    setSelectedVariantIndex(0);
    setOrientation(PRODUCTS[index].defaultOrientation);
  };

  if (showChooseProduct) {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-6 bg-gray-50">
        <div className="max-w-lg w-full text-center">
          <h1 className="text-2xl font-normal text-gray-900 mb-2">Choose a product first</h1>
          <p className="text-gray-600 text-sm mb-8">
            The studio loads a real shop product from its URL. Open customize from a product page, or pick a
            product in admin and use &quot;Open in studio&quot; so the address includes{" "}
            <code className="bg-gray-200 px-1 rounded text-xs">?slug=...</code>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link
              href="/shop"
              className="inline-flex justify-center bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse shop
            </Link>
            <Link
              href="/b_d_admn_tae/catalog/products"
              className="inline-flex justify-center border border-gray-300 text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Admin catalog
            </Link>
          </div>
          <p className="text-xs text-gray-500">
            Internal demo (hardcoded sample Printful products):{" "}
            <Link href="/studio?demo=1" className="text-blue-600 underline">
              /studio?demo=1
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (slugParam && apiLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (slugParam && apiError) {
    return (
      <div className="h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-normal text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-6">{apiError}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shop"
              className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Shop
            </Link>
            <Link
              href="/b_d_admn_tae/catalog/products"
              className="border border-gray-300 text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Admin catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {demoMode && !slugParam && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-900 text-center">
          <strong>Demo mode</strong> — sample Printful products only (not your admin catalog). For real products,
          open the studio from the shop or admin with a <code className="mx-1 bg-amber-100 px-1 rounded">slug</code>{" "}
          parameter.
        </div>
      )}
      {/* Top Bar */}
      <div className="bg-gray-100 border-b px-4 py-3 flex items-center gap-6 flex-wrap">
        {isApiMode ? (
          <>
            <Link
              href={`/shop/${apiProduct.slug}`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              &larr; Back
            </Link>
            <span className="text-sm font-semibold text-gray-800" title={apiProduct.slug}>
              {productName}
            </span>
            <span className="text-xs text-gray-500 hidden sm:inline">/shop/{apiProduct.slug}</span>
            {/* Variant selector in API mode */}
            {apiVariants.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Size:</label>
                <select
                  value={slugParam || ""}
                  onChange={(e) => {
                    const variant = apiVariants.find((v) => v.slug === e.target.value);
                    if (variant && !variant.isCurrent) {
                      const params = new URLSearchParams({
                        product_id: variant.id,
                        slug: variant.slug,
                        product_name: variant.name,
                      });
                      if (requiresQrParam) {
                        params.set("requires_qr", requiresQrParam);
                      }
                      if (forceArtKeyParam) {
                        params.set("force_artkey", forceArtKeyParam);
                      }
                      if (variant.printfulVariantId) {
                        params.set("variant_id", String(variant.printfulVariantId));
                      }
                      router.push(`/studio?${params}`);
                    }
                  }}
                  className="border rounded px-3 py-1.5 text-sm bg-white"
                >
                  {apiVariants.map((v) => (
                    <option key={v.id} value={v.slug} disabled={!v.inStock}>
                      {v.sizeLabel || v.pfSize || v.name}
                      {Number.isFinite(Number(v.basePrice)) ? ` — $${Number(v.basePrice).toFixed(2)}` : ""}
                      {!v.inStock ? " (Out of stock)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {apiVariants.length <= 1 && apiProduct.sizeLabel && (
              <span className="text-sm text-gray-500">{apiProduct.sizeLabel}</span>
            )}
          </>
        ) : (
          <>
            {/* Demo mode only: hardcoded sample products */}
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-800 bg-amber-100 px-2 py-1 rounded">
              Demo
            </span>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sample product:</label>
              <select
                value={selectedProductIndex}
                onChange={(e) => handleProductChange(Number(e.target.value))}
                className="border rounded px-3 py-1.5 text-sm bg-white"
              >
                {PRODUCTS.map((p, i) => (
                  <option key={p.id} value={i}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Size:</label>
              <select
                value={selectedVariantIndex}
                onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
                className="border rounded px-3 py-1.5 text-sm bg-white"
              >
                {selectedProduct.variants.map((v, i) => (
                  <option key={v.id} value={i}>{v.name}</option>
                ))}
              </select>
            </div>
            {selectedProduct.supportsOrientation && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Orientation:</label>
                <div className="flex border rounded overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOrientation("portrait")}
                    className={`px-3 py-1.5 text-sm ${
                      orientation === "portrait" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation("landscape")}
                    className={`px-3 py-1.5 text-sm ${
                      orientation === "landscape" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Landscape
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="text-sm text-gray-500 ml-auto">
          {productSpec.printWidth} x {productSpec.printHeight} px @ {productSpec.printDpi} DPI
        </div>
      </div>

      {proofPreviewError && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-200 text-sm text-red-800 whitespace-pre-wrap">
          <p className="font-semibold text-red-900 mb-1">Preview couldn’t load</p>
          <p className="text-red-800/95">{proofPreviewError}</p>
        </div>
      )}
      {proofBlockReason && !proofPreviewError && (
        <div className="px-4 py-3 bg-amber-50/90 border-b border-amber-200/80">
          <p className="text-sm text-amber-950 font-medium">{proofBlockedUserHint}</p>
        </div>
      )}
      {!proofBlockReason && !proofPreviewError && !proofPreview && (
        <div className="px-4 py-2.5 bg-stone-50/80 border-b border-stone-200/80">
          <p className="text-xs text-stone-600 leading-relaxed">
            <span className="font-semibold text-stone-800">Tip:</span> use{" "}
            <span className="font-medium text-stone-800">Print preview</span> in the toolbar to review how
            the <span className="font-medium">currently selected surface</span> may look when printed—creative
            check only, not checkout.
          </p>
        </div>
      )}
      {proofPreview && (
        <div className="px-4 py-4 border-b border-stone-200 bg-gradient-to-b from-white to-stone-50/60">
          <div className="max-w-4xl mx-auto rounded-2xl border border-stone-200/90 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-stone-900">Print preview</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  Surface:{" "}
                  <span className="font-medium text-stone-700">
                    {customerPlacementLabel(proofPreview.placement)}
                  </span>
                  {" · "}
                  Approximate only
                </p>
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                Ready
              </span>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-xs text-stone-500 mb-3 leading-relaxed">
                Switch surfaces in the editor and run <strong>Print preview</strong> again to review other
                panels. After you change the design, generate a new preview so it stays accurate.
              </p>
              <div className="rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center min-h-[200px] max-h-[min(52vh,420px)] p-2 sm:p-4">
                <img
                  src={proofPreview.blobUrl}
                  alt={`Print preview — ${customerPlacementLabel(proofPreview.placement)}`}
                  className="max-h-[min(48vh,380px)] w-full object-contain rounded-lg shadow-inner bg-white"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStudioProofLightboxOpen(true)}
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                >
                  View larger
                </button>
                <p className="text-[11px] text-stone-400 self-center">
                  Preview loads securely through our site (full-screen overlay).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customization Studio */}
      <div className="flex-1">
        <CustomizationStudio
          key={`${productSpec.id}-${productSpec.printWidth}-${productSpec.printHeight}-${productSpec.placements.join("|")}-${restoreDesignParam === "1" ? "restore" : "new"}`}
          productSpec={productSpec}
          proofBlockedReason={proofBlockReason}
          proofBlockedUserHint={proofBlockedUserHint}
          placeholderQrCodeUrl="/images/placeholder-qr.svg"
          artKeyTemplates={ARTKEY_TEMPLATES}
          initialDesigns={initialDesigns}
          onPreviewPrintProof={async (files) => {
            try {
              await handlePreviewPrintProof(files);
            } catch (err: unknown) {
              console.error("[studio] print preview", err);
              const msg =
                err instanceof Error && err.message?.trim()
                  ? err.message.trim()
                  : customerStudioProofMessageFromApi(undefined, 0);
              setProofPreviewError(msg);
            }
          }}
          onExport={handleExport}
          onSave={handleStudioSave}
        />
      </div>

      {studioProofLightboxOpen && proofPreview && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged print preview"
          onClick={() => setStudioProofLightboxOpen(false)}
        >
          <div
            className="relative max-w-[min(96vw,56rem)] max-h-[90vh] rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-neutral-950"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setStudioProofLightboxOpen(false)}
              className="absolute top-3 right-3 z-10 rounded-full bg-white/90 text-stone-900 text-sm font-semibold px-3 py-1.5 shadow hover:bg-white"
            >
              Close
            </button>
            <img
              src={proofPreview.blobUrl}
              alt={`Enlarged print preview — ${customerPlacementLabel(proofPreview.placement)}`}
              className="block max-h-[85vh] w-auto object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// PAGE WRAPPER (Suspense boundary for useSearchParams)
// =============================================================================

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
