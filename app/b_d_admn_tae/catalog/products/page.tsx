"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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

interface ProductVariantMatrixRow {
  id: string;
  paperType?: string | null;
  size?: string | null;
  frame?: string | null;
  frameColor?: string | null;
  printfulProductId?: number | null;
  printfulVariantId?: number | null;
  providerCost?: number | null;
  variationUpcharge?: number | null;
  artistRoyalty?: number | null;
  taeAddOnFee?: number | null;
  sellPrice?: number | null;
  image?: string | null;
  active?: boolean;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  heroImage: string | null;
  galleryImages: string | null;
  artworkSourceUrl?: string | null;
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
  categoryPathLabel?: string;
  requiresQrCode?: boolean;
  customizable?: boolean;
  artistSlug?: string | null;
  coCreatorSlug?: string | null;
  familyKey?: string | null;
  productType?: string | null;
  variantMatrix?: ProductVariantMatrixRow[];
  proofTerms?: string | null;
  pricing?: {
    marginTarget: number;
    artistRoyalty: number;
    variationUpcharge?: number;
    taePrice?: number;
    salePrice?: number | null;
    discountPercent?: number;
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
  parentId?: string | null;
  categoryType?: string;
  pathLabel?: string;
  icon: string;
  taeBaseFee: number;
  requiresQrCode?: boolean;
  productCount: number;
}

interface CreatorOption {
  slug: string;
  name: string;
  sourceImageUrl?: string | null;
}

interface PrintfulCatalogProduct {
  id: number;
  title: string;
  type?: string;
  variantCount?: number;
}

interface PrintfulVariantOption {
  id: number;
  name: string;
  size?: string | null;
  retailPrice?: string | null;
}

const PRINTFUL_FALLBACK_PRODUCTS: PrintfulCatalogProduct[] = [
  { id: 568, title: "Greeting Card", type: "Greeting Cards", variantCount: 3 },
  { id: 433, title: "Postcard", type: "Postcards / Invitations / Announcements", variantCount: 1 },
  { id: 3, title: "Canvas", type: "Canvas Prints" },
  { id: 614, title: "Framed Canvas", type: "Framed Canvas Prints" },
  { id: 1, title: "Enhanced Matte Paper Poster", type: "Wall Art / Posters" },
  { id: 2, title: "Enhanced Matte Paper Framed Poster", type: "Framed Prints" },
  { id: 171, title: "Premium Luster Paper Poster", type: "Wall Art / Posters" },
  { id: 172, title: "Premium Luster Paper Framed Poster", type: "Framed Prints" },
];

const PRINTFUL_FALLBACK_VARIANTS: Record<number, PrintfulVariantOption[]> = {
  1: [
    { id: 4463, name: "Enhanced Matte Paper Poster", size: '8" x 10"' },
    { id: 14125, name: "Enhanced Matte Paper Poster", size: '11" x 14"' },
    { id: 3876, name: "Enhanced Matte Paper Poster", size: '12" x 18"' },
    { id: 3877, name: "Enhanced Matte Paper Poster", size: '16" x 20"' },
    { id: 1, name: "Enhanced Matte Paper Poster", size: '18" x 24"' },
    { id: 2, name: "Enhanced Matte Paper Poster", size: '24" x 36"' },
  ],
  171: [
    { id: 6871, name: "Premium Luster Paper Poster", size: '8" x 10"' },
    { id: 14028, name: "Premium Luster Paper Poster", size: '11" x 14"' },
    { id: 6876, name: "Premium Luster Paper Poster", size: '12" x 18"' },
    { id: 6878, name: "Premium Luster Paper Poster", size: '16" x 20"' },
    { id: 6880, name: "Premium Luster Paper Poster", size: '18" x 24"' },
    { id: 7845, name: "Premium Luster Paper Poster", size: '24" x 36"' },
  ],
  568: [
    { id: 14457, name: "Greeting Card - Small", size: '4.25" x 5.5"' },
    { id: 14458, name: "Greeting Card - Medium", size: '5" x 7"' },
    { id: 14460, name: "Greeting Card - Large", size: '5.83" x 8.27" / A5' },
  ],
  433: [{ id: 11513, name: "Postcard", size: '5" x 7"' }],
};

const PRINTFUL_FRAMED_FALLBACK_VARIANTS: Record<number, Record<string, PrintfulVariantOption[]>> = {
  2: {
    Black: [
      { id: 4651, name: "Enhanced Matte Paper Framed Poster - Black", size: '8" x 10"' },
      { id: 14292, name: "Enhanced Matte Paper Framed Poster - Black", size: '11" x 14"' },
      { id: 4398, name: "Enhanced Matte Paper Framed Poster - Black", size: '12" x 18"' },
      { id: 4399, name: "Enhanced Matte Paper Framed Poster - Black", size: '16" x 20"' },
      { id: 3, name: "Enhanced Matte Paper Framed Poster - Black", size: '18" x 24"' },
      { id: 4, name: "Enhanced Matte Paper Framed Poster - Black", size: '24" x 36"' },
    ],
    Oak: [
      { id: 15021, name: "Enhanced Matte Paper Framed Poster - Oak", size: '8" x 10"' },
      { id: 15023, name: "Enhanced Matte Paper Framed Poster - Oak", size: '11" x 14"' },
      { id: 15026, name: "Enhanced Matte Paper Framed Poster - Oak", size: '12" x 18"' },
      { id: 15029, name: "Enhanced Matte Paper Framed Poster - Oak", size: '16" x 20"' },
      { id: 15031, name: "Enhanced Matte Paper Framed Poster - Oak", size: '18" x 24"' },
      { id: 15032, name: "Enhanced Matte Paper Framed Poster - Oak", size: '24" x 36"' },
    ],
    White: [
      { id: 10754, name: "Enhanced Matte Paper Framed Poster - White", size: '8" x 10"' },
      { id: 14293, name: "Enhanced Matte Paper Framed Poster - White", size: '11" x 14"' },
      { id: 10752, name: "Enhanced Matte Paper Framed Poster - White", size: '12" x 18"' },
      { id: 10753, name: "Enhanced Matte Paper Framed Poster - White", size: '16" x 20"' },
      { id: 10749, name: "Enhanced Matte Paper Framed Poster - White", size: '18" x 24"' },
      { id: 10750, name: "Enhanced Matte Paper Framed Poster - White", size: '24" x 36"' },
    ],
  },
  172: {
    Black: [
      { id: 6882, name: "Premium Luster Paper Framed Poster - Black", size: '8" x 10"' },
      { id: 14290, name: "Premium Luster Paper Framed Poster - Black", size: '11" x 14"' },
      { id: 6887, name: "Premium Luster Paper Framed Poster - Black", size: '12" x 18"' },
      { id: 6889, name: "Premium Luster Paper Framed Poster - Black", size: '16" x 20"' },
      { id: 6891, name: "Premium Luster Paper Framed Poster - Black", size: '18" x 24"' },
      { id: 7846, name: "Premium Luster Paper Framed Poster - Black", size: '24" x 36"' },
    ],
    Oak: [
      { id: 15006, name: "Premium Luster Paper Framed Poster - Oak", size: '8" x 10"' },
      { id: 15008, name: "Premium Luster Paper Framed Poster - Oak", size: '11" x 14"' },
      { id: 15011, name: "Premium Luster Paper Framed Poster - Oak", size: '12" x 18"' },
      { id: 15014, name: "Premium Luster Paper Framed Poster - Oak", size: '16" x 20"' },
      { id: 15017, name: "Premium Luster Paper Framed Poster - Oak", size: '18" x 24"' },
      { id: 15018, name: "Premium Luster Paper Framed Poster - Oak", size: '24" x 36"' },
    ],
    White: [
      { id: 10760, name: "Premium Luster Paper Framed Poster - White", size: '8" x 10"' },
      { id: 14291, name: "Premium Luster Paper Framed Poster - White", size: '11" x 14"' },
      { id: 10765, name: "Premium Luster Paper Framed Poster - White", size: '12" x 18"' },
      { id: 10767, name: "Premium Luster Paper Framed Poster - White", size: '16" x 20"' },
      { id: 10769, name: "Premium Luster Paper Framed Poster - White", size: '18" x 24"' },
      { id: 10770, name: "Premium Luster Paper Framed Poster - White", size: '24" x 36"' },
    ],
  },
};

const VARIANT_DROPDOWN_OPTIONS: Record<
  string,
  {
    sizes?: string[];
    paperTypes?: string[];
    frames?: string[];
    frameColors?: string[];
    printfulProducts?: Array<{ id: number; label: string }>;
  }
> = {
  "art-print": {
    sizes: ['8″×10″', '11″×14″', '12″×18″', '16″×20″', '18″×24″', '24″×36″'],
    paperTypes: ["Enhanced Matte Paper", "Premium Luster Paper"],
    frames: ["Unframed", "Framed"],
    frameColors: ["Black", "White", "Oak"],
    printfulProducts: [
      { id: 1, label: "Enhanced Matte Paper Poster" },
      { id: 2, label: "Enhanced Matte Paper Framed Poster" },
      { id: 171, label: "Premium Luster Paper Poster" },
      { id: 172, label: "Premium Luster Paper Framed Poster" },
    ],
  },
  "greeting-card": {
    sizes: ['4″×6″', '5″×7″', '5.83″×8.27″'],
    paperTypes: ["Greeting Card Stock"],
    printfulProducts: [{ id: 568, label: "Greeting Card" }],
  },
  "postcard": {
    sizes: ['4″×6″'],
    paperTypes: ["Matte Postcard Stock"],
    printfulProducts: [{ id: 433, label: "Standard Postcard" }],
  },
  "invitation": {
    sizes: ['4″×6″'],
    paperTypes: ["Matte Postcard Stock"],
    printfulProducts: [{ id: 433, label: "Standard Postcard" }],
  },
  "announcement": {
    sizes: ['4″×6″'],
    paperTypes: ["Matte Postcard Stock"],
    printfulProducts: [{ id: 433, label: "Standard Postcard" }],
  },
};

const PRODUCT_TYPE_MATRIX_FIELDS: Record<
  string,
  {
    label: string;
    fields: Array<
      | "size"
      | "paperType"
      | "frame"
      | "frameColor"
      | "printfulProductId"
      | "printfulVariantId"
      | "providerCost"
      | "variationUpcharge"
      | "artistRoyalty"
      | "taeAddOnFee"
      | "sellPrice"
    >;
  }
> = {
  "art-print": {
    label: "Art Prints / Posters",
    fields: [
      "size",
      "paperType",
      "frame",
      "frameColor",
      "printfulProductId",
      "printfulVariantId",
      "providerCost",
      "variationUpcharge",
      "artistRoyalty",
      "taeAddOnFee",
      "sellPrice",
    ],
  },
  "canvas-print": {
    label: "Canvas Prints",
    fields: [
      "size",
      "frame",
      "frameColor",
      "printfulProductId",
      "printfulVariantId",
      "providerCost",
      "variationUpcharge",
      "artistRoyalty",
      "taeAddOnFee",
      "sellPrice",
    ],
  },
  "greeting-card": {
    label: "Greeting Cards",
    fields: [
      "size",
      "paperType",
      "printfulProductId",
      "printfulVariantId",
      "providerCost",
      "variationUpcharge",
      "artistRoyalty",
      "taeAddOnFee",
      "sellPrice",
    ],
  },
  "postcard": {
    label: "Postcards",
    fields: [
      "size",
      "paperType",
      "printfulProductId",
      "printfulVariantId",
      "providerCost",
      "variationUpcharge",
      "artistRoyalty",
      "taeAddOnFee",
      "sellPrice",
    ],
  },
  "invitation": {
    label: "Invitations",
    fields: [
      "size",
      "paperType",
      "printfulProductId",
      "printfulVariantId",
      "providerCost",
      "variationUpcharge",
      "artistRoyalty",
      "taeAddOnFee",
      "sellPrice",
    ],
  },
  "announcement": {
    label: "Announcements",
    fields: [
      "size",
      "paperType",
      "printfulProductId",
      "printfulVariantId",
      "providerCost",
      "variationUpcharge",
      "artistRoyalty",
      "taeAddOnFee",
      "sellPrice",
    ],
  },
};

const EMPTY_FORM = {
  name: "",
  description: "",
  proofTerms: "",
  productType: "art-print",
  variantMatrix: [] as ProductVariantMatrixRow[],
  categoryId: "",
  printProvider: "printful",
  printfulProductId: "",
  printfulVariantId: "",
  printfulBasePrice: "0",
  variationUpcharge: "0",
  taePrice: "0",
  taeAddOnFee: "0",
  artistRoyalty: "0",
  salePrice: "",
  discountPercent: "0",
  marginTarget: "0.45",
  sizeLabel: "",
  paperType: "",
  finishType: "",
  artistSlug: "",
  coCreatorSlug: "",
  familyKey: "",
  heroImage: "",
  artworkSourceUrl: "",
  watermarkEnabled: false,
  watermarkText: "tAE",
  watermarkColor: "#ffffff",
  watermarkOpacity: "0.12",
  watermarkX: "0.50",
  watermarkY: "0.50",
  watermarkScale: "0.12",
  watermarkRotation: "-18",
  requiresQrCode: false,
  customizable: true,
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
  const [artists, setArtists] = useState<CreatorOption[]>([]);
  const [coCreators, setCoCreators] = useState<CreatorOption[]>([]);
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
  const [artworkSourceUploading, setArtworkSourceUploading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [showWatermarkEditor, setShowWatermarkEditor] = useState(false);
  const [wmDraft, setWmDraft] = useState<{ x: number; y: number; scale: number; rotation: number } | null>(null);
  const [wmDragging, setWmDragging] = useState(false);
  const [wmResizing, setWmResizing] = useState(false);
  const [draftHeroFile, setDraftHeroFile] = useState<File | null>(null);
  const [draftGalleryFiles, setDraftGalleryFiles] = useState<File[]>([]);
  const [rowPrintfulVariants, setRowPrintfulVariants] = useState<Record<string, PrintfulVariantOption[]>>({});
  const [rowPrintfulLoadingVariants, setRowPrintfulLoadingVariants] = useState<Record<string, boolean>>({});

  const selectedProductTypeConfig =
    PRODUCT_TYPE_MATRIX_FIELDS[form.productType || "art-print"] ||
    PRODUCT_TYPE_MATRIX_FIELDS["art-print"];

  const variantFieldEnabled = (
    field:
      | "size"
      | "paperType"
      | "frame"
      | "frameColor"
      | "printfulProductId"
      | "printfulVariantId"
      | "providerCost"
      | "variationUpcharge"
      | "artistRoyalty"
      | "taeAddOnFee"
      | "sellPrice"
  ) => selectedProductTypeConfig.fields.includes(field);

  const variantDropdownConfig =
    VARIANT_DROPDOWN_OPTIONS[form.productType || "art-print"] || null;

  const variantPrintfulProducts =
    Array.isArray(variantDropdownConfig?.printfulProducts) && variantDropdownConfig.printfulProducts.length > 0
      ? variantDropdownConfig.printfulProducts
      : form.productType === "art-print"
        ? PRINTFUL_FALLBACK_PRODUCTS.filter(
            (product) =>
              product.id === 1 ||
              product.id === 2 ||
              product.id === 171 ||
              product.id === 172
          ).map((product) => ({ id: product.id, label: product.title }))
        : [];

  const getVariantPrintfulProductsForRow = (row: ProductVariantMatrixRow) => {
    if (form.productType !== "art-print") return variantPrintfulProducts;

    return variantPrintfulProducts.filter((product) => {
      const label = product.label.toLowerCase();
      const paperType = (row.paperType || "").trim();
      const frame = (row.frame || "").trim();

      if (paperType === "Enhanced Matte Paper" && !label.includes("enhanced matte")) {
        return false;
      }

      if (paperType === "Premium Luster Paper" && !label.includes("premium luster")) {
        return false;
      }

      if (frame === "Framed" && !label.includes("framed")) {
        return false;
      }

      if (frame === "Unframed" && label.includes("framed")) {
        return false;
      }

      return true;
    });
  };

  const getVariantOptionsForRow = (row: ProductVariantMatrixRow) => {
    const productId = row.printfulProductId;
    if (!productId) return [];

    const frameColor = row.frameColor || "Black";
    const liveVariants = rowPrintfulVariants[row.id];

    if (liveVariants?.length) {
      if (row.frame === "Framed") {
        const filteredLiveVariants = liveVariants.filter((variant) =>
          (variant.name || "").toLowerCase().includes(frameColor.toLowerCase())
        );

        if (filteredLiveVariants.length) return filteredLiveVariants;
      }

      return liveVariants;
    }

    if (row.frame === "Framed") {
      return PRINTFUL_FRAMED_FALLBACK_VARIANTS[productId]?.[frameColor] || [];
    }

    return PRINTFUL_FALLBACK_VARIANTS[productId] || [];
  };

  const leafCategories = useMemo(
    () => categories.filter((c) => (c.categoryType || "leaf") === "leaf"),
    [categories]
  );
  const getDefaultCategoryId = useCallback(() => {
    return leafCategories[0]?.id || categories[0]?.id || "";
  }, [categories, leafCategories]);

  const getCategoryRequiresQrDefault = useCallback(
    (categoryId?: string) => categories.find((c) => c.id === categoryId)?.requiresQrCode ?? false,
    [categories]
  );
  const currentEditProduct = useMemo(
    () => products.find((p) => p.id === editId) || null,
    [products, editId]
  );

  const loadCreatorOptions = useCallback(async () => {
    try {
      const [artistsRes, coCreatorsRes] = await Promise.all([
        fetch("/api/gallery"),
        fetch("/api/cocreators"),
      ]);

      const artistsJson = await artistsRes.json().catch(() => null);
      const coCreatorsJson = await coCreatorsRes.json().catch(() => null);

      if (artistsJson?.data && Array.isArray(artistsJson.data)) {
        setArtists(
          artistsJson.data
            .filter((item: any) => item?.slug && item?.name)
            .map((item: any) => ({
              slug: item.slug,
              name: item.name,
              sourceImageUrl: item?.portfolio?.[0]?.image || null,
            }))
        );
      }

      if (coCreatorsJson?.data && Array.isArray(coCreatorsJson.data)) {
        setCoCreators(
          coCreatorsJson.data
            .filter((item: any) => item?.slug && item?.name)
            .map((item: any) => ({
              slug: item.slug,
              name: item.name,
              sourceImageUrl: item?.heroImage || null,
            }))
        );
      }
    } catch {
      // Convenience fill buttons remain hidden if source lists cannot be loaded.
    }
  }, []);

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
  const uploadProductImage = async (file: File, productId: string, kind: "hero" | "gallery" | "artworkSource") => {
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

  const handleArtworkSourceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !imageEditProduct) return;
    setArtworkSourceUploading(true);
    setImgError(null);
    try {
      const result = await uploadProductImage(file, imageEditProduct.id, "artworkSource");
      if (result.success) {
        setImageEditProduct({ ...imageEditProduct, artworkSourceUrl: result.data.url });
        if (editId === imageEditProduct.id) {
          setForm((prev) => ({ ...prev, artworkSourceUrl: result.data.url || "" }));
        }
        loadProducts();
      } else {
        setImgError(result.data?.error || "Upload failed");
      }
    } catch (err) {
      if (!(err instanceof AdminUnauthorizedError)) setImgError("Upload failed");
    } finally {
      setArtworkSourceUploading(false);
    }
    e.target.value = "";
  };

  const handleRemoveArtworkSource = async () => {
    if (!imageEditProduct) return;
    try {
      const { res, data } = await adminFetchJson(`/api/admin/store-products/${imageEditProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkSourceUrl: null }),
      }, () => router.push("/b_d_admn_tae/login"));
      if (!res.ok || !data?.success) {
        setImgError(data?.error || "Failed to remove artwork source");
        return;
      }
      setImageEditProduct({ ...imageEditProduct, artworkSourceUrl: null });
      if (editId === imageEditProduct.id) {
        setForm((prev) => ({ ...prev, artworkSourceUrl: "" }));
      }
      loadProducts();
    } catch (err) {
      if (!(err instanceof AdminUnauthorizedError)) setImgError("Failed to remove artwork source");
    }
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
  const variationUpcharge = Math.max(0, parseFloat(form.variationUpcharge) || 0);
  const artistRoyalty = Math.max(0, parseFloat(form.artistRoyalty) || DEFAULT_ARTIST_ROYALTY);
  const taePrice = Math.max(0, parseFloat(form.taePrice) || 0);
  const salePrice = Math.max(0, parseFloat(form.salePrice) || 0);
  const discountPercent = Math.max(0, Math.min(100, parseFloat(form.discountPercent) || 0));
  const totalRetail = Math.max(0, providerCost + variationUpcharge + artistRoyalty + taePrice);
  const discountedRetail = salePrice > 0
    ? salePrice
    : Math.max(0, totalRetail * (1 - discountPercent / 100));

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

  const loadRowPrintfulVariants = useCallback(async (rowId: string, productId: number) => {
    const fallbackVariants = PRINTFUL_FALLBACK_VARIANTS[productId] || [];

    setRowPrintfulLoadingVariants((prev) => ({ ...prev, [rowId]: true }));
    setRowPrintfulVariants((prev) => ({ ...prev, [rowId]: [] }));
    setError("");

    try {
      const res = await fetch(
        `/api/admin/test-printful?action=product&productId=${productId}`,
        { credentials: "same-origin" }
      );
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error) {
        if (fallbackVariants.length > 0) {
          setRowPrintfulVariants((prev) => ({ ...prev, [rowId]: fallbackVariants }));
          return;
        }
        throw new Error(data?.error || `Variant load failed (${res.status})`);
      }

      const body = data?.body?.result || {};
      const variants = Array.isArray(body?.sync_variants)
        ? body.sync_variants
        : Array.isArray(body?.variants)
          ? body.variants
          : [];

      const mappedVariants = variants
        .map((variant: any) => {
          const id = Number(
            variant?.id ??
            variant?.variant_id ??
            variant?.sync_variant_id ??
            0
          );
          if (!id) return null;

          return {
            id,
            name:
              variant?.name ||
              variant?.size ||
              variant?.sku ||
              `Variant ${id}`,
            size: variant?.size || null,
            retailPrice:
              variant?.retail_price ??
              variant?.price ??
              null,
          };
        })
        .filter(Boolean) as PrintfulVariantOption[];

      setRowPrintfulVariants((prev) => ({
        ...prev,
        [rowId]: mappedVariants.length > 0 ? mappedVariants : fallbackVariants,
      }));
    } catch (err: any) {
      if (fallbackVariants.length > 0) {
        setRowPrintfulVariants((prev) => ({ ...prev, [rowId]: fallbackVariants }));
      } else {
        setError(err?.message || "Failed to load Printful variants");
      }
    } finally {
      setRowPrintfulLoadingVariants((prev) => ({ ...prev, [rowId]: false }));
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadCreatorOptions();
  }, [loadCreatorOptions]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setShowForm(true);
      setEditId(null);
      setDraftHeroFile(null);
      setDraftGalleryFiles([]);
      setRowPrintfulVariants({});
      setRowPrintfulLoadingVariants({});
      const defaultCategoryId = getDefaultCategoryId();
      setForm({
        ...EMPTY_FORM,
        categoryId: defaultCategoryId,
        requiresQrCode: getCategoryRequiresQrDefault(defaultCategoryId),
      });
    }
  }, [getCategoryRequiresQrDefault, getDefaultCategoryId, searchParams]);

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
      variationUpcharge: 0,
      taePrice: 0,
      salePrice: null,
      discountPercent: 0,
      lastPrintfulSyncAt: null,
    };
    setEditId(p.id);
    setDraftHeroFile(null);
    setDraftGalleryFiles([]);
    setRowPrintfulVariants({});
    setRowPrintfulLoadingVariants({});
    setForm({
      name: p.name,
      description: p.description || "",
      proofTerms: p.proofTerms || "",
      productType: p.productType || "art-print",
      variantMatrix: Array.isArray(p.variantMatrix) ? p.variantMatrix.map((r) => ({ ...r })) : [],
      categoryId: p.categoryId || "",
      printProvider: p.printProvider || "printful",
      printfulProductId: p.printfulProductId?.toString() || "",
      printfulVariantId: p.printfulVariantId?.toString() || "",
      printfulBasePrice: (p.printfulBasePrice || 0).toString(),
      variationUpcharge: String(pricing.variationUpcharge ?? 0),
      taePrice: String(pricing.taePrice ?? (p.taeAddOnFee || 0)),
      taeAddOnFee: (p.taeAddOnFee || 0).toString(),
      marginTarget: String(pricing.marginTarget ?? DEFAULT_MARGIN_TARGET),
      artistRoyalty: String(pricing.artistRoyalty ?? DEFAULT_ARTIST_ROYALTY),
      salePrice: pricing.salePrice ? String(pricing.salePrice) : "",
      discountPercent: String(pricing.discountPercent ?? 0),
      sizeLabel: p.sizeLabel || "",
      paperType: p.paperType || "",
      finishType: p.finishType || "",
      artistSlug: p.artistSlug || "",
      coCreatorSlug: p.coCreatorSlug || "",
      familyKey: p.familyKey || "",
      heroImage: p.heroImage || "",
      artworkSourceUrl: p.artworkSourceUrl || "",
      watermarkEnabled: !!wm.enabled,
      watermarkText: wm.text || "tAE",
      watermarkColor: wm.color || "#ffffff",
      watermarkOpacity: String(wm.opacity ?? 0.12),
      watermarkX: String(wm.transform?.x ?? 0.5),
      watermarkY: String(wm.transform?.y ?? 0.5),
      watermarkScale: String(wm.transform?.scale ?? 0.12),
      watermarkRotation: String(wm.transform?.rotation ?? -18),
      requiresQrCode: !!p.requiresQrCode,
      customizable: p.customizable !== false,
      active: p.active,
      sortOrder: (p.sortOrder || 0).toString(),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const mergedTaeAddon = variationUpcharge + taePrice;
      const payload: Record<string, any> = {
        name: form.name,
        description: form.description || null,
        proofTerms: form.proofTerms || "",
        productType: form.productType || "art-print",
        variantMatrix: Array.isArray(form.variantMatrix) ? form.variantMatrix : [],
        categoryId: form.categoryId || undefined,
        printProvider: form.printProvider,
        printfulProductId: form.printfulProductId ? parseInt(form.printfulProductId) : null,
        printfulVariantId: form.printfulVariantId ? parseInt(form.printfulVariantId) : null,
        printfulBasePrice: parseFloat(form.printfulBasePrice) || 0,
        taeAddOnFee: mergedTaeAddon,
        pricing: {
          artistRoyalty: Math.max(0, parseFloat(form.artistRoyalty) || DEFAULT_ARTIST_ROYALTY),
          variationUpcharge,
          taePrice,
          salePrice: salePrice > 0 ? salePrice : null,
          discountPercent,
          marginTarget: Math.max(0, Math.min(0.9, parseFloat(form.marginTarget) || DEFAULT_MARGIN_TARGET)),
          lastPrintfulSyncAt: null,
        },
        sizeLabel: form.sizeLabel || null,
        paperType: form.paperType || null,
        finishType: form.finishType || null,
        artistSlug: form.artistSlug.trim() || null,
        coCreatorSlug: form.coCreatorSlug.trim() || null,
        familyKey: form.familyKey.trim() || null,
        heroImage: form.heroImage || null,
        artworkSourceUrl: form.artworkSourceUrl || null,
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
        customizable: form.customizable !== false,
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
        const savedId = editId || data?.data?.id;
        if (savedId && (draftHeroFile || draftGalleryFiles.length > 0)) {
          if (draftHeroFile) {
            await uploadProductImage(draftHeroFile, savedId, "hero");
          }
          for (const file of draftGalleryFiles) {
            await uploadProductImage(file, savedId, "gallery");
          }
        }
        setShowForm(false);
        setEditId(null);
        setForm(EMPTY_FORM);
        setDraftHeroFile(null);
        setDraftGalleryFiles([]);
        setRowPrintfulVariants({});
        setRowPrintfulLoadingVariants({});
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
            {products.length} products total. Manage category placement, fulfillment, and pricing.
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
              const defaultCategoryId = getDefaultCategoryId();
              setShowForm(true);
              setEditId(null);
              setDraftHeroFile(null);
              setDraftGalleryFiles([]);
              setRowPrintfulVariants({});
              setRowPrintfulLoadingVariants({});
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
            <option key={c.id} value={c.id}>{c.pathLabel || c.name} ({c.productCount})</option>
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
                const defaultCategoryId = getDefaultCategoryId();
                setShowForm(true);
                setEditId(null);
                setDraftHeroFile(null);
                setDraftGalleryFiles([]);
                setRowPrintfulVariants({});
                setRowPrintfulLoadingVariants({});
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
              <div key={p.id} className="px-4 py-3 hover:bg-brand-lightest/50 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 md:items-center">
                <div className="md:col-span-4">
                  <div className="text-sm font-medium text-brand-dark">{p.name}</div>
                  <div className="text-[10px] text-brand-medium mt-0.5">{p.taeId}</div>
                </div>
                <div className="md:col-span-2 text-xs text-brand-medium">
                  <div className="md:hidden text-[10px] uppercase tracking-wider text-brand-medium font-medium mb-1">Category</div>
                  {p.categoryPathLabel || p.categoryName}
                </div>
                <div className="md:col-span-2 text-sm font-medium text-brand-dark">
                  <div className="md:hidden text-[10px] uppercase tracking-wider text-brand-medium font-medium mb-1">Price</div>
                  ${(p.basePrice || 0).toFixed(2)}
                  {p.pricing && (
                    <div className="text-[10px] text-brand-medium mt-0.5">
                      Royalty ${(p.pricing.artistRoyalty || 0).toFixed(2)}
                      {typeof p.pricing.salePrice === "number" && p.pricing.salePrice > 0
                        ? ` · Sale $${p.pricing.salePrice.toFixed(2)}`
                        : (p.pricing.discountPercent || 0) > 0
                          ? ` · ${Math.round(p.pricing.discountPercent || 0)}% off`
                          : ""}
                    </div>
                  )}
                </div>
                <div className="md:col-span-1">
                  <div className="md:hidden text-[10px] uppercase tracking-wider text-brand-medium font-medium mb-1">Status</div>
                  <span className={`text-[10px] px-2 py-0.5 font-medium ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="md:col-span-2 text-xs text-brand-medium capitalize">
                  <div className="md:hidden text-[10px] uppercase tracking-wider text-brand-medium font-medium mb-1">Fulfillment</div>
                  {p.printProvider === "printful" ? "Printful" : (p.printProvider || "theAE")}
                </div>
                <div className="md:col-span-1">
                  <div className="md:hidden text-[10px] uppercase tracking-wider text-brand-medium font-medium mb-1">Actions</div>
                  <div className="flex items-center gap-1 flex-wrap md:justify-end">
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
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setDraftHeroFile(null);
                  setDraftGalleryFiles([]);
                  setRowPrintfulVariants({});
                  setRowPrintfulLoadingVariants({});
                }}
                className="text-brand-medium hover:text-brand-dark"
              >
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Product Type</label>
                  <select
                    value={form.productType || "art-print"}
                    onChange={(e) => setForm({ ...form, productType: e.target.value })}
                    className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                  >
                    <option value="art-print">Art Prints / Posters</option>
                    <option value="canvas-print">Canvas Prints</option>
                    <option value="greeting-card">Greeting Cards</option>
                    <option value="postcard">Postcards</option>
                    <option value="invitation">Invitations</option>
                    <option value="announcement">Announcements</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Hero Image Upload</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setDraftHeroFile(e.target.files?.[0] || null)}
                    className="w-full border border-brand-light px-3 py-2 text-sm bg-brand-lightest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Gallery Image Uploads</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => setDraftGalleryFiles(Array.from(e.target.files || []))}
                    className="w-full border border-brand-light px-3 py-2 text-sm bg-brand-lightest"
                  />
                </div>
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
                    {leafCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.pathLabel || c.name}</option>
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
                    <option value="printful">Printful</option>
                    <option value="custom">theAE</option>
                  </select>
                </div>
              </div>

              <div className="border border-brand-light rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-medium text-brand-dark/70 uppercase tracking-wider">
                    Variant Matrix · {selectedProductTypeConfig.label}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        variantMatrix: [
                          ...(Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []),
                          {
                            id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                            paperType: "",
                            size: "",
                            frame: "",
                            frameColor: "",
                            printfulProductId: null,
                            printfulVariantId: null,
                            providerCost: null,
                            variationUpcharge: null,
                            artistRoyalty: null,
                            taeAddOnFee: null,
                            sellPrice: null,
                            image: "",
                            active: true,
                          },
                        ],
                      }))
                    }
                    className="border border-brand-dark text-brand-dark px-3 py-1.5 text-xs font-medium hover:bg-brand-dark/10 transition-colors"
                  >
                    Add Variant Row
                  </button>
                </div>

                <div className="text-sm text-brand-medium">
                  Configure valid option rows for this {selectedProductTypeConfig.label.toLowerCase()} parent product.
                </div>

                {Array.isArray(form.variantMatrix) && form.variantMatrix.length > 0 ? (
                  <div className="space-y-4">
                    {form.variantMatrix.map((row, index) => (
                      <div
                        key={row.id || index}
                        className="border border-brand-light/70 rounded-lg p-4 space-y-3 bg-brand-lightest/40"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs font-semibold text-brand-dark">Variant Row {index + 1}</div>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).filter(
                                  (item) => item.id !== row.id
                                ),
                              }))
                            }
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">Size</label>
                            {variantDropdownConfig?.sizes?.length ? (
                              <select
                                value={row.size || ""}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                      (item) => (item.id === row.id ? { ...item, size: e.target.value } : item)
                                    ),
                                  }))
                                }
                                className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                              >
                                <option value="">Select size...</option>
                                {variantDropdownConfig.sizes.map((size) => (
                                  <option key={size} value={size}>
                                    {size}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={row.size || ""}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                      (item) => (item.id === row.id ? { ...item, size: e.target.value } : item)
                                    ),
                                  }))
                                }
                                className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">
                              Material / Paper Type
                            </label>
                            {variantDropdownConfig?.paperTypes?.length ? (
                              <select
                                value={row.paperType || ""}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                      (item) => (item.id === row.id ? { ...item, paperType: e.target.value } : item)
                                    ),
                                  }))
                                }
                                className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                              >
                                <option value="">Select material...</option>
                                {variantDropdownConfig.paperTypes.map((paperType) => (
                                  <option key={paperType} value={paperType}>
                                    {paperType}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={row.paperType || ""}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                      (item) => (item.id === row.id ? { ...item, paperType: e.target.value } : item)
                                    ),
                                  }))
                                }
                                className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                              />
                            )}
                          </div>
                          {variantFieldEnabled("frame") && (
                            <div>
                              <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">Frame</label>
                              {variantDropdownConfig?.frames?.length ? (
                                <select
                                  value={row.frame || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                        (item) =>
                                          item.id === row.id
                                            ? {
                                                ...item,
                                                frame: e.target.value,
                                                frameColor: e.target.value === "Framed" ? item.frameColor : "",
                                              }
                                            : item
                                      ),
                                    }))
                                  }
                                  className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                                >
                                  <option value="">Select frame option...</option>
                                  {variantDropdownConfig.frames.map((frameOption) => (
                                    <option key={frameOption} value={frameOption}>
                                      {frameOption}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={row.frame || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                        (item) => (item.id === row.id ? { ...item, frame: e.target.value } : item)
                                      ),
                                    }))
                                  }
                                  className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                                />
                              )}
                            </div>
                          )}
                          {variantFieldEnabled("frameColor") && row.frame === "Framed" && (
                            <div>
                              <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">
                                Frame Color
                              </label>
                              {variantDropdownConfig?.frameColors?.length ? (
                                <select
                                  value={row.frameColor || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                        (item) => (item.id === row.id ? { ...item, frameColor: e.target.value } : item)
                                      ),
                                    }))
                                  }
                                  className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                                >
                                  <option value="">Select frame color...</option>
                                  {variantDropdownConfig.frameColors.map((frameColor) => (
                                    <option key={frameColor} value={frameColor}>
                                      {frameColor}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={row.frameColor || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                        (item) => (item.id === row.id ? { ...item, frameColor: e.target.value } : item)
                                      ),
                                    }))
                                  }
                                  className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                                />
                              )}
                            </div>
                          )}
                          <div>
                            <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">
                              Printful Product
                            </label>
                            {getVariantPrintfulProductsForRow(row).length ? (
                              <select
                                value={row.printfulProductId ?? ""}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const pid = raw ? parseInt(raw, 10) : null;
                                  setForm((prev) => ({
                                    ...prev,
                                    variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                      (item) =>
                                        item.id === row.id
                                          ? {
                                              ...item,
                                              printfulProductId: pid,
                                              printfulVariantId: null,
                                            }
                                          : item
                                    ),
                                  }));
                                  if (pid) {
                                    loadRowPrintfulVariants(row.id, pid);
                                  } else {
                                    setRowPrintfulVariants((prev) => {
                                      const next = { ...prev };
                                      delete next[row.id];
                                      return next;
                                    });
                                  }
                                }}
                                className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                              >
                                <option value="">Select Printful product...</option>
                                {getVariantPrintfulProductsForRow(row).map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.label} ({product.id})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="number"
                                value={row.printfulProductId ?? ""}
                                onChange={(e) => {
                                  const pid = e.target.value ? parseInt(e.target.value, 10) : null;
                                  setForm((prev) => ({
                                    ...prev,
                                    variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                      (item) =>
                                        item.id === row.id
                                          ? {
                                              ...item,
                                              printfulProductId: Number.isFinite(pid as number) ? pid : null,
                                              printfulVariantId: null,
                                            }
                                          : item
                                    ),
                                  }));
                                  if (pid && Number.isFinite(pid)) {
                                    loadRowPrintfulVariants(row.id, pid);
                                  } else {
                                    setRowPrintfulVariants((prev) => {
                                      const next = { ...prev };
                                      delete next[row.id];
                                      return next;
                                    });
                                  }
                                }}
                                className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">
                              Printful Variant
                              {rowPrintfulLoadingVariants[row.id] ? (
                                <span className="ml-2 text-brand-medium font-normal">(loading…)</span>
                              ) : null}
                            </label>
                            {getVariantOptionsForRow(row).length ? (
                              <select
                                value={row.printfulVariantId ?? ""}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                      (item) =>
                                        item.id === row.id
                                          ? {
                                              ...item,
                                              printfulVariantId: e.target.value ? parseInt(e.target.value, 10) : null,
                                            }
                                          : item
                                    ),
                                  }))
                                }
                                className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                              >
                                <option value="">Select Printful variant...</option>
                                {getVariantOptionsForRow(row).map((variant) => (
                                  <option key={variant.id} value={variant.id}>
                                    {variant.name}
                                    {variant.size ? ` (${variant.size})` : ""}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="number"
                                value={row.printfulVariantId ?? ""}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                      (item) =>
                                        item.id === row.id
                                          ? {
                                              ...item,
                                              printfulVariantId: e.target.value
                                                ? parseInt(e.target.value, 10)
                                                : null,
                                            }
                                          : item
                                    ),
                                  }))
                                }
                                className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">
                              Provider Cost ($)
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={row.providerCost ?? ""}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                    (item) =>
                                      item.id === row.id
                                        ? {
                                            ...item,
                                            providerCost: e.target.value ? parseFloat(e.target.value) : null,
                                          }
                                        : item
                                  ),
                                }))
                              }
                              className="w-full border border-brand-light px-3 py-2 text-sm bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">
                              Variation upcharge ($)
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={row.variationUpcharge ?? ""}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                    (item) =>
                                      item.id === row.id
                                        ? {
                                            ...item,
                                            variationUpcharge: e.target.value ? parseFloat(e.target.value) : null,
                                          }
                                        : item
                                  ),
                                }))
                              }
                              className="w-full border border-brand-light px-3 py-2 text-sm bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">
                              Artist royalty ($)
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={row.artistRoyalty ?? ""}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                    (item) =>
                                      item.id === row.id
                                        ? {
                                            ...item,
                                            artistRoyalty: e.target.value ? parseFloat(e.target.value) : null,
                                          }
                                        : item
                                  ),
                                }))
                              }
                              className="w-full border border-brand-light px-3 py-2 text-sm bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">
                              theAE add-on ($)
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={row.taeAddOnFee ?? ""}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                    (item) =>
                                      item.id === row.id
                                        ? {
                                            ...item,
                                            taeAddOnFee: e.target.value ? parseFloat(e.target.value) : null,
                                          }
                                        : item
                                  ),
                                }))
                              }
                              className="w-full border border-brand-light px-3 py-2 text-sm bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">Sell Price ($)</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={row.sellPrice ?? ""}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                    (item) =>
                                      item.id === row.id
                                        ? {
                                            ...item,
                                            sellPrice: e.target.value ? parseFloat(e.target.value) : null,
                                          }
                                        : item
                                  ),
                                }))
                              }
                              className="w-full border border-brand-light px-3 py-2 text-sm bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">
                              Row Image URL
                            </label>
                            <input
                              type="text"
                              value={row.image ?? ""}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                    (item) =>
                                      item.id === row.id
                                        ? { ...item, image: e.target.value || null }
                                        : item
                                  ),
                                }))
                              }
                              className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-brand-medium">
                    No variant rows yet. Add one to start building valid option combinations for this parent product.
                  </div>
                )}
              </div>

              <div className="border border-brand-light rounded-lg p-4 space-y-3">
                <div className="text-xs font-medium text-brand-dark/70 uppercase tracking-wider">Pricing Builder</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">Printful Base Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.printfulBasePrice}
                      onChange={(e) => setForm({ ...form, printfulBasePrice: e.target.value })}
                      className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">Variation Upcharge ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.variationUpcharge}
                      onChange={(e) => setForm({ ...form, variationUpcharge: e.target.value })}
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
                  <div>
                    <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">theAE Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.taePrice}
                      onChange={(e) => setForm({ ...form, taePrice: e.target.value })}
                      className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">Sale Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.salePrice}
                      onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                      className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">% Discount</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={form.discountPercent}
                      onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                      className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-brand-lightest border border-brand-light p-2">
                    <div className="text-brand-medium">Total Retail</div>
                    <div className="text-brand-dark font-semibold">${totalRetail.toFixed(2)}</div>
                  </div>
                  <div className="bg-brand-lightest border border-brand-light p-2">
                    <div className="text-brand-medium">Discounted Price</div>
                    <div className="text-brand-dark font-semibold">${discountedRetail.toFixed(2)}</div>
                  </div>
                  <div className="bg-brand-lightest border border-brand-light p-2">
                    <div className="text-brand-medium">Printful + Variation</div>
                    <div className="text-brand-dark font-semibold">${(providerCost + variationUpcharge).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <details className="border border-brand-light rounded-lg p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-brand-dark/70">
                  Advanced (Optional)
                </summary>
                <div className="space-y-4 mt-3">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                        Artist
                      </label>
                      <select
                        value={form.artistSlug}
                        onChange={(e) => setForm({ ...form, artistSlug: e.target.value })}
                        className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                      >
                        <option value="">None</option>
                        {artists.map((artist) => (
                          <option key={artist.slug} value={artist.slug}>
                            {artist.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] mt-1 text-brand-medium">
                        Optional. Link this product to an artist page without typing the slug manually.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                        CoCreator
                      </label>
                      <select
                        value={form.coCreatorSlug}
                        onChange={(e) => setForm({ ...form, coCreatorSlug: e.target.value })}
                        className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                      >
                        <option value="">None</option>
                        {coCreators.map((creator) => (
                          <option key={creator.slug} value={creator.slug}>
                            {creator.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] mt-1 text-brand-medium">
                        Optional. Link this product to a co-creator page without typing the slug manually.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                      Product Family Key
                    </label>
                    <input
                      type="text"
                      value={form.familyKey}
                      onChange={(e) => setForm({ ...form, familyKey: e.target.value })}
                      className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                      placeholder="e.g. desert-bloom-art-print"
                    />
                    <p className="text-[11px] mt-1 text-brand-medium">
                      Use the same family key on related variants so one art print can offer multiple materials, sizes,
                      and frame options together.
                    </p>
                  </div>

                  <div className="border border-brand-light rounded-lg p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-medium text-brand-dark/70 uppercase tracking-wider">
                          Customizable
                        </div>
                        <p className="text-[11px] mt-1 text-brand-medium">
                          Controls whether this product can be customized in the studio.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, customizable: !form.customizable })}
                        className={`px-2.5 py-1 text-xs rounded border ${form.customizable ? "bg-brand-dark text-white border-brand-dark" : "bg-white text-brand-dark border-brand-light"}`}
                        title="Toggle customizable for this product"
                      >
                        {form.customizable ? "Enabled" : "Disabled"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-brand-light">
                      <div>
                        <div className="text-xs font-medium text-brand-dark/70 uppercase tracking-wider">
                          Requires QR Code
                        </div>
                        <p className="text-[11px] mt-1 text-brand-medium">
                          Controls whether studio requires the ArtKey Portal step for this product.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, requiresQrCode: !form.requiresQrCode })}
                        className={`px-2.5 py-1 text-xs rounded border ${form.requiresQrCode ? "bg-brand-dark text-white border-brand-dark" : "bg-white text-brand-dark border-brand-light"}`}
                        title="Toggle QR code requirement for this product"
                      >
                        {form.requiresQrCode ? "Required" : "Not Required"}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">

                    <div>
                      <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Printful Product ID</label>
                      <input
                        type="text"
                        value={form.printfulProductId}
                        onChange={(e) => setForm({ ...form, printfulProductId: e.target.value })}
                        className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                        placeholder="e.g. 358"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Printful Variant ID</label>
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
                  <div>
                    <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Artwork Source URL</label>
                    <input
                      type="text"
                      value={form.artworkSourceUrl}
                      onChange={(e) => setForm({ ...form, artworkSourceUrl: e.target.value })}
                      className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
                      placeholder="Canonical non-Printful artwork asset used for future mockup generation"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {currentEditProduct?.artistSlug && artists.find((artist) => artist.slug === currentEditProduct.artistSlug)?.sourceImageUrl && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({
                            ...prev,
                            artworkSourceUrl:
                              artists.find((artist) => artist.slug === currentEditProduct.artistSlug)?.sourceImageUrl ||
                              prev.artworkSourceUrl,
                          }))}
                          className={BTN_SUBTLE}
                        >
                          Use First Artist Portfolio Image
                        </button>
                      )}
                      {currentEditProduct?.coCreatorSlug && coCreators.find((creator) => creator.slug === currentEditProduct.coCreatorSlug)?.sourceImageUrl && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({
                            ...prev,
                            artworkSourceUrl:
                              coCreators.find((creator) => creator.slug === currentEditProduct.coCreatorSlug)?.sourceImageUrl ||
                              prev.artworkSourceUrl,
                          }))}
                          className={BTN_SUBTLE}
                        >
                          Use Co-Creator Hero Image
                        </button>
                      )}
                    </div>
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
                </div>
              </details>

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
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setDraftHeroFile(null);
                  setDraftGalleryFiles([]);
                  setRowPrintfulVariants({});
                  setRowPrintfulLoadingVariants({});
                }}
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
                <div>
                  <label className="block text-xs font-medium text-brand-dark/70 mb-2 uppercase tracking-wider">Artwork Source (Canonical)</label>
                  <div className="flex items-start gap-4">
                    {imageEditProduct.artworkSourceUrl ? (
                      <div className="relative group">
                        <img
                          src={imageEditProduct.artworkSourceUrl}
                          alt="Artwork source"
                          className="w-40 h-28 object-cover border border-brand-light"
                          onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                        />
                        <button
                          onClick={handleRemoveArtworkSource}
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
                        {artworkSourceUploading ? "Uploading..." : imageEditProduct.artworkSourceUrl ? "Replace" : "Upload Artwork Source"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleArtworkSourceUpload}
                          disabled={artworkSourceUploading}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-brand-medium mt-2">Use a non-Printful artwork asset here. This is the canonical source for future mockup generation.</p>
                    </div>
                  </div>
                </div>

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
