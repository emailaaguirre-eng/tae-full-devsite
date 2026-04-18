"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
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
  Star,
} from "lucide-react";
import {
  STATIONERY_PRODUCT_TYPES,
  getRowStationeryFormat,
  getStationeryPrintfulProducts,
  type StationeryPrintfulPickerProduct,
} from "@/lib/stationery-printful-catalog";
import { AdminAccordionSection } from "@/components/admin/AdminAccordionSection";
import { normalizeHeroFlags } from "@/lib/product-image-ui";
import { galleryIdsJsonFromList, parseLibraryGalleryIdsJson } from "@/lib/product-library-ids";

type ProductImageSource = "general" | "variant" | "api";

interface ProductImageEntry {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  sortOrder: number;
  isHero: boolean;
  isActive: boolean;
  sourceType: ProductImageSource;
  variantKey: string | null;
  variantId: string | null;
  size: string | null;
  frame: string | null;
  frameColor: string | null;
  material: string | null;
  orientation: string | null;
  format: string | null;
}

function localImageId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Must stay in sync with POST /api/admin/products/upload-image (incl. variantProductionArtwork). */
const MAX_PRODUCT_IMAGE_UPLOAD_BYTES = 20 * 1024 * 1024;

function productImageFileTooLargeMessage(file: File): string | null {
  if (file.size > MAX_PRODUCT_IMAGE_UPLOAD_BYTES) {
    return `File "${file.name}" is too large. Maximum size is 20 MB.`;
  }
  return null;
}

/** Append a URL to the legacy gallery JSON string (keeps form in sync with gallery uploads). */
function appendGalleryUrlToJson(prevJson: string, url: string): string {
  let list: string[] = [];
  try {
    const parsed = JSON.parse(prevJson || "[]");
    if (Array.isArray(parsed)) {
      list = parsed.filter((x): x is string => typeof x === "string" && !!x.trim());
    }
  } catch {
    list = [];
  }
  const t = url.trim();
  if (t && !list.includes(t)) list.push(t);
  return JSON.stringify(list);
}

interface ProductVariantMatrixRow {
  id: string;
  /** Stationery: flat (e.g. postcard-style) vs bifold (folded card); drives Printful catalog slice */
  format?: "flat" | "bifold" | string | null;
  paperType?: string | null;
  size?: string | null;
  frame?: string | null;
  frameColor?: string | null;
  printfulProductId?: number | null;
  printfulVariantId?: number | null;
  /** Row-level Printful base (legacy/alternate to providerCost in JSON). */
  printfulBasePrice?: number | null;
  providerCost?: number | null;
  variationUpcharge?: number | null;
  artistRoyalty?: number | null;
  taeAddOnFee?: number | null;
  sellPrice?: number | null;
  image?: string | null;
  /** Optional production file for this variant; overrides product-level artwork when fulfilling. */
  productionArtworkUrl?: string | null;
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
  artistId?: string | null;
  coCreatorSlug?: string | null;
  coCreatorId?: string | null;
  familyKey?: string | null;
  tags?: string[];
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
  /** Product Media Library (Phase 2) — storefront hero / global gallery assignments */
  libraryHeroMediaId?: string | null;
  libraryGalleryMediaIdsJson?: string | null;
  productImages?: {
    id: string;
    imageUrl: string;
    title?: string | null;
    description?: string | null;
    sortOrder?: number;
    isHero?: boolean;
    isActive?: boolean;
    sourceType?: string;
    variantKey?: string | null;
    variantId?: string | null;
    size?: string | null;
    frame?: string | null;
    frameColor?: string | null;
    material?: string | null;
    orientation?: string | null;
    format?: string | null;
  }[];
}

function productImagesFromProduct(p: Product): ProductImageEntry[] {
  const list = p.productImages;
  if (list && list.length > 0) {
    return list.map((img, i) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      title: typeof img.title === "string" ? img.title : "",
      description: typeof img.description === "string" ? img.description : "",
      sortOrder: typeof img.sortOrder === "number" ? img.sortOrder : i,
      isHero: !!img.isHero,
      isActive: img.isActive !== false,
      sourceType:
        img.sourceType === "variant" || img.sourceType === "api" ? img.sourceType : "general",
      variantKey: img.variantKey ?? null,
      variantId: img.variantId ?? null,
      size: img.size ?? null,
      frame: img.frame ?? null,
      frameColor: img.frameColor ?? null,
      material: img.material ?? null,
      orientation: img.orientation ?? null,
      format: img.format ?? null,
    }));
  }
  const rows: ProductImageEntry[] = [];
  let order = 0;
  const hero = (p.heroImage || "").trim();
  if (hero) {
    rows.push({
      id: `legacy-hero-${p.id}`,
      imageUrl: hero,
      title: "",
      description: "",
      sortOrder: order++,
      isHero: true,
      isActive: true,
      sourceType: "general",
      variantKey: null,
      variantId: null,
      size: null,
      frame: null,
      frameColor: null,
      material: null,
      orientation: null,
      format: null,
    });
  }
  let g: unknown[] = [];
  try {
    const parsed = p.galleryImages ? JSON.parse(p.galleryImages) : [];
    g = Array.isArray(parsed) ? parsed : [];
  } catch {
    g = [];
  }
  for (const u of g) {
    if (typeof u !== "string" || !u.trim()) continue;
    const url = u.trim();
    if (url === hero) continue;
    rows.push({
      id: `legacy-g-${p.id}-${order}`,
      imageUrl: url,
      title: "",
      description: "",
      sortOrder: order++,
      isHero: false,
      isActive: true,
      sourceType: "general",
      variantKey: null,
      variantId: null,
      size: null,
      frame: null,
      frameColor: null,
      material: null,
      orientation: null,
      format: null,
    });
  }
  return rows;
}

function deriveHeroGalleryFromDraft(draft: ProductImageEntry[]): { hero: string; gallery: string } {
  const sorted = [...draft].sort((a, b) => a.sortOrder - b.sortOrder);
  const mapped = sorted.map((r, i) => ({ ...r, sortOrder: i }));
  const n = normalizeHeroFlags(mapped);
  const heroR = n.find((r) => r.isHero) || n[0];
  const hero = (heroR?.imageUrl || "").trim();
  const urls: string[] = [];
  for (const r of n) {
    if (heroR && r.id === heroR.id) continue;
    const u = (r.imageUrl || "").trim();
    if (u) urls.push(u);
  }
  return { hero, gallery: JSON.stringify(urls) };
}

type ImageModalRuleOptions = {
  sizes: string[];
  materials: string[];
  frames: string[];
  frameColors: string[];
  formats: string[];
  matrixRows: { id: string; label: string; printfulVariantId: number | null }[];
  printfulVariantIds: string[];
};

function uniqNonEmptyStrings(values: (string | null | undefined)[]): string[] {
  const s = new Set<string>();
  for (const v of values) {
    const t = (v || "").trim();
    if (t) s.add(t);
  }
  return Array.from(s).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function formatMatrixRowLabelForImageRule(r: ProductVariantMatrixRow): string {
  const parts = [
    r.size?.trim(),
    r.paperType?.trim(),
    r.frame?.trim(),
    r.frameColor?.trim(),
    r.format ? String(r.format) : null,
  ].filter(Boolean) as string[];
  const vid = r.printfulVariantId;
  const tail = vid != null && Number.isFinite(Number(vid)) ? `#${Math.trunc(Number(vid))}` : "";
  const base = parts.length > 0 ? parts.join(" · ") : `Row ${r.id.slice(0, 8)}`;
  return tail ? `${base} (${tail})` : base;
}

function buildImageModalRuleOptions(matrix: ProductVariantMatrixRow[] | undefined): ImageModalRuleOptions {
  const rows = Array.isArray(matrix) ? matrix : [];
  const sizes = uniqNonEmptyStrings(rows.map((r) => r.size));
  const materials = uniqNonEmptyStrings(rows.map((r) => r.paperType));
  const frames = uniqNonEmptyStrings(rows.map((r) => r.frame));
  const frameColors = uniqNonEmptyStrings(rows.map((r) => r.frameColor));
  const formats = uniqNonEmptyStrings(rows.map((r) => (r as { format?: string | null }).format));
  const matrixRows = rows.map((r) => ({
    id: r.id,
    label: formatMatrixRowLabelForImageRule(r),
    printfulVariantId: r.printfulVariantId ?? null,
  }));
  const vidSet = new Set<string>();
  for (const r of rows) {
    const n = Number(r.printfulVariantId);
    if (Number.isFinite(n) && n > 0) vidSet.add(String(Math.trunc(n)));
  }
  return {
    sizes,
    materials,
    frames,
    frameColors,
    formats,
    matrixRows,
    printfulVariantIds: Array.from(vidSet).sort((a, b) => Number(a) - Number(b)),
  };
}

function hasRestrictiveImageMetadata(row: ProductImageEntry): boolean {
  return !!(
    (row.variantKey && row.variantKey.trim()) ||
    (row.variantId && row.variantId.trim()) ||
    (row.size && row.size.trim()) ||
    (row.frame && row.frame.trim()) ||
    (row.frameColor && row.frameColor.trim()) ||
    (row.material && row.material.trim()) ||
    (row.orientation && row.orientation.trim()) ||
    (row.format && row.format.trim())
  );
}

function imageEntryStorefrontSummary(
  row: ProductImageEntry,
  ruleOpts: ImageModalRuleOptions
): {
  appliesTo: string;
  displayHint: string;
  targetingBadge: "default-gallery" | "option-targeted" | "api-import";
} {
  const st = row.sourceType;
  if (st === "api") {
    return {
      appliesTo: "All variants · default gallery",
      displayHint: "API / imported — always eligible for the default image set (order follows drag-and-drop).",
      targetingBadge: "api-import",
    };
  }
  if (st === "general") {
    return {
      appliesTo: "All variants · default gallery",
      displayHint: "Displays by default for every option selection. Deactivate or remove to hide.",
      targetingBadge: "default-gallery",
    };
  }
  if (!hasRestrictiveImageMetadata(row)) {
    return {
      appliesTo: "All variants · default gallery",
      displayHint:
        "Marked as Variant but no rules yet — storefront treats this like a general catalog image. Add matrix or option rules below to target specific combinations.",
      targetingBadge: "default-gallery",
    };
  }
  const human: string[] = [];
  if (row.size?.trim()) human.push(row.size.trim());
  if (row.material?.trim()) human.push(row.material.trim());
  if (row.frame?.trim()) human.push(row.frame.trim());
  if (row.frameColor?.trim()) human.push(row.frameColor.trim());
  if (row.orientation?.trim()) human.push(row.orientation.trim());
  if (row.format?.trim()) human.push(row.format.trim());
  if (row.variantKey?.trim()) {
    const mr = ruleOpts.matrixRows.find((m) => m.id === row.variantKey!.trim());
    human.push(mr ? mr.label : `Matrix ${row.variantKey.trim().slice(0, 10)}`);
  }
  if (row.variantId?.trim()) human.push(`Printful ${row.variantId.trim()}`);
  const applies = human.length > 0 ? human.join(" · ") : "Custom variant rules";
  const hint =
    human.length > 0
      ? `Displays when the shopper selection matches: ${human.join(" + ")}. If nothing matches, the storefront falls back to general images.`
      : "Variant-specific rules — storefront uses exact/partial matching on these fields.";
  return {
    appliesTo: applies,
    displayHint: hint,
    targetingBadge: "option-targeted",
  };
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
  id: string;
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
  /** Parsed from Printful catalog variant `price` only (provider-cost autofill). */
  catalogPrice?: number | null;
}

function parseMoneyInputToNumberOrNull(raw: string): number | null {
  const t = raw.trim().replace(/,/g, "");
  if (t === "") return null;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

function parsePrintfulCatalogPriceForProviderCost(variant: any): number | null {
  const raw = variant?.price;
  const s = raw == null ? "" : String(raw).trim().replace(/,/g, "");
  if (s === "") return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function providerCostFromVariantOptions(
  variantId: number | null,
  options: PrintfulVariantOption[]
): number | null {
  if (variantId == null) return null;
  const opt = options.find((v) => v.id === variantId);
  return opt?.catalogPrice != null ? opt.catalogPrice : null;
}

const PRINTFUL_FALLBACK_PRODUCTS: PrintfulCatalogProduct[] = [
  { id: 568, title: "Greeting Card", type: "Greeting Cards", variantCount: 3 },
  { id: 433, title: "Postcard", type: "Postcards / Invitations / Announcements", variantCount: 1 },
  { id: 3, title: "Canvas", type: "Canvas Prints" },
  { id: 614, title: "Framed Canvas", type: "Framed Canvas Prints" },
  { id: 1, title: "Enhanced Matte Paper Poster", type: "ArtPrint" },
  { id: 2, title: "Enhanced Matte Paper Framed Poster", type: "Framed Prints" },
  { id: 171, title: "Premium Luster Paper Poster", type: "ArtPrint" },
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
  /** Printful catalog 433: single variant 11513, 4″×6″ (API); keep aligned with postcard matrix sizes. */
  433: [{ id: 11513, name: "Standard Postcards (4″×6″)", size: '4″×6″' }],
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

type MatrixPrintfulProductOption = {
  id: number;
  label: string;
  format?: "flat" | "bifold";
};

const VARIANT_DROPDOWN_OPTIONS: Record<
  string,
  {
    sizes?: string[];
    paperTypes?: string[];
    frames?: string[];
    frameColors?: string[];
    /** Stationery types: omit — use @/lib/stationery-printful-catalog */
    printfulProducts?: MatrixPrintfulProductOption[];
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
  "canvas-print": {
    sizes: ['8″×10″', '11″×14″', '12″×18″', '16″×20″', '18″×24″', '24″×36″'],
    frames: ["Unframed", "Framed"],
    frameColors: ["Black", "White", "Oak"],
    printfulProducts: [
      { id: 3, label: "Canvas" },
      { id: 614, label: "Framed Canvas" },
    ],
  },
  "greeting-card": {
    sizes: ['4″×6″', '5″×7″', '5.83″×8.27″'],
    paperTypes: ["Greeting Card Stock"],
    /** Envelope options; stored on matrix row as `frame` (storefront reads via variants API as finishType). */
    frames: ["No Envelope", "White Envelope", "Kraft Envelope"],
  },
  "postcard": {
    sizes: ['4″×6″'],
    paperTypes: ["Matte Postcard Stock"],
    printfulProducts: [{ id: 433, label: "Standard Postcard" }],
  },
  "invitation": {
    sizes: ['4″×6″'],
    paperTypes: ["Matte Postcard Stock"],
  },
  "announcement": {
    sizes: ['4″×6″'],
    paperTypes: ["Matte Postcard Stock"],
  },
};

/** First two dimension numbers in a label (e.g. 4″×6″ → [4, 6]) for postcard size ↔ variant matching. */
function extractPostcardDimensionPair(text: string): [number, number] | null {
  const nums = text.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (nums.length >= 2) return [nums[0], nums[1]];
  return null;
}

function postcardVariantMatchesRowSize(variant: PrintfulVariantOption, rowSize: string): boolean {
  const rs = rowSize.trim();
  if (!rs) return true;
  const rowPair = extractPostcardDimensionPair(rs);
  if (!rowPair) return true;
  const blob = `${variant.size || ""} ${variant.name || ""}`;
  const varPair = extractPostcardDimensionPair(blob);
  if (!varPair) return false;
  return rowPair[0] === varPair[0] && rowPair[1] === varPair[1];
}

function postcardMatrixSizeForVariant(variant: PrintfulVariantOption): string | null {
  const sizes = VARIANT_DROPDOWN_OPTIONS.postcard?.sizes;
  if (!sizes?.length) return null;
  const hit = sizes.find((s) => postcardVariantMatchesRowSize(variant, s));
  return hit ?? null;
}

function filterPostcardVariantList(
  list: PrintfulVariantOption[],
  rowSize: string | null | undefined,
  productType: string | undefined
): PrintfulVariantOption[] {
  if (productType !== "postcard" || !(rowSize || "").trim()) return list;
  return list.filter((v) => postcardVariantMatchesRowSize(v, rowSize || ""));
}

/** Match matrix size labels to Printful fallback sizes (e.g. 8″×10″ vs 8" x 10"). */
function dimensionPairFromSizeLabel(label: string): [number, number] | null {
  const nums = label.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (nums.length >= 2) return [nums[0], nums[1]];
  return null;
}

function variantRowDimensionMatch(
  rowSize: string | null | undefined,
  variant: PrintfulVariantOption
): boolean {
  const rp = dimensionPairFromSizeLabel((rowSize || "").trim());
  if (!rp) return false;
  const blob = `${variant.size || ""} ${variant.name || ""}`;
  const vp = dimensionPairFromSizeLabel(blob);
  if (!vp) return false;
  return rp[0] === vp[0] && rp[1] === vp[1];
}

/** Auto map option rows → Printful catalog product for art-print / canvas-print / postcard only. */
function autoResolvedPrintfulProductId(
  productType: string,
  row: ProductVariantMatrixRow
): number | null {
  if (productType === "postcard") return 433;
  if (productType === "canvas-print") {
    const f = (row.frame || "").trim();
    if (f === "Unframed") return 3;
    if (f === "Framed") return 614;
    return null;
  }
  if (productType === "art-print") {
    const paper = (row.paperType || "").trim();
    const frame = (row.frame || "").trim();
    if (paper === "Enhanced Matte Paper" && frame === "Unframed") return 1;
    if (paper === "Enhanced Matte Paper" && frame === "Framed") return 2;
    if (paper === "Premium Luster Paper" && frame === "Unframed") return 171;
    if (paper === "Premium Luster Paper" && frame === "Framed") return 172;
    return null;
  }
  return null;
}

function autoResolvePrintfulOptionList(
  productType: string,
  row: ProductVariantMatrixRow,
  productId: number,
  liveVariants: PrintfulVariantOption[] | undefined
): PrintfulVariantOption[] {
  if (productType === "postcard") {
    return filterPostcardVariantList(PRINTFUL_FALLBACK_VARIANTS[433] || [], row.size, productType);
  }
  if (productType === "art-print") {
    if (row.frame === "Framed") {
      const fc = (row.frameColor || "Black").trim();
      return PRINTFUL_FRAMED_FALLBACK_VARIANTS[productId]?.[fc] || [];
    }
    return PRINTFUL_FALLBACK_VARIANTS[productId] || [];
  }
  if (productType === "canvas-print") {
    const live = liveVariants || [];
    if (!live.length) return [];
    const frameColor = (row.frameColor || "Black").trim();
    if (row.frame === "Framed") {
      const filtered = live.filter((variant) =>
        (variant.name || "").toLowerCase().includes(frameColor.toLowerCase())
      );
      return filtered.length ? filtered : live;
    }
    return live;
  }
  return [];
}

function pickUnambiguousAutoVariantId(
  productType: string,
  row: ProductVariantMatrixRow,
  options: PrintfulVariantOption[]
): number | null {
  if (!options.length) return null;
  if (options.length === 1) return options[0].id;
  const rs = (row.size || "").trim();
  if (!rs) return null;
  const matches = options.filter((v) => variantRowDimensionMatch(row.size, v));
  if (matches.length === 1) return matches[0].id;
  return null;
}

function applyAutoPrintfulResolutionToRow(
  productType: string,
  row: ProductVariantMatrixRow,
  live: PrintfulVariantOption[] | undefined
): ProductVariantMatrixRow | null {
  const pid = autoResolvedPrintfulProductId(productType, row);
  if (pid == null) return null;

  const options = autoResolvePrintfulOptionList(productType, row, pid, live);
  const vidResolved = pickUnambiguousAutoVariantId(productType, row, options);
  const nextCost =
    vidResolved != null ? providerCostFromVariantOptions(vidResolved, options) : null;

  const productChanged = row.printfulProductId !== pid;
  let nextVariant = row.printfulVariantId ?? null;
  let nextProvider = row.providerCost ?? null;

  if (productChanged) {
    nextVariant = vidResolved ?? null;
    nextProvider = vidResolved != null && nextCost != null ? nextCost : null;
  } else if (vidResolved != null) {
    if (nextVariant !== vidResolved) {
      nextVariant = vidResolved;
      nextProvider = nextCost ?? nextProvider;
    } else if (nextCost != null && nextProvider !== nextCost) {
      nextProvider = nextCost;
    }
  }

  const nextRow: ProductVariantMatrixRow = {
    ...row,
    printfulProductId: pid,
    printfulVariantId: nextVariant,
    providerCost: nextProvider,
  };

  if (
    row.printfulProductId === nextRow.printfulProductId &&
    row.printfulVariantId === nextRow.printfulVariantId &&
    row.providerCost === nextRow.providerCost
  ) {
    return null;
  }
  return nextRow;
}

const PRODUCT_TYPE_MATRIX_FIELDS: Record<
  string,
  {
    label: string;
    fields: Array<
      | "format"
      | "size"
      | "paperType"
      | "frame"
      | "frameColor"
      | "printfulProductId"
      | "printfulVariantId"
      | "providerCost"
      | "artistRoyalty"
      | "taeAddOnFee"
      | "sellPrice"
    >;
  }
> = {
  "art-print": {
    label: "ArtPrint",
    fields: [
      "size",
      "paperType",
      "frame",
      "frameColor",
      "printfulProductId",
      "printfulVariantId",
      "providerCost",
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
      "frame",
      "printfulProductId",
      "printfulVariantId",
      "providerCost",
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
      "artistRoyalty",
      "taeAddOnFee",
      "sellPrice",
    ],
  },
  "invitation": {
    label: "Invitations",
    fields: [
      "format",
      "size",
      "paperType",
      "printfulProductId",
      "printfulVariantId",
      "providerCost",
      "artistRoyalty",
      "taeAddOnFee",
      "sellPrice",
    ],
  },
  "announcement": {
    label: "Announcements",
    fields: [
      "format",
      "size",
      "paperType",
      "printfulProductId",
      "printfulVariantId",
      "providerCost",
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
  artistId: "",
  coCreatorSlug: "",
  coCreatorId: "",
  heroImage: "",
  galleryImages: "[]",
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

type MatrixMoneyField =
  | "providerCost"
  | "taeAddOnFee"
  | "artistRoyalty"
  | "sellPrice";

function matrixMoneyKey(rowId: string, field: MatrixMoneyField) {
  return `${rowId}:${field}`;
}

/** Same rules as finiteOverridePrice in GET /api/products/[slug]/variants (matrix branch). */
function finiteMatrixSellOverride(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string" && raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** First finite among row.printfulBasePrice, row.providerCost, then product-level printful base. */
function effectiveMatrixRowPrintfulBaseFromRow(
  row: ProductVariantMatrixRow,
  productPrintful: number
): number {
  const rowAny = row as unknown as Record<string, unknown>;
  const candidates = [rowAny.printfulBasePrice, row.providerCost];
  for (const v of candidates) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return Number.isFinite(productPrintful) && productPrintful >= 0 ? productPrintful : 0;
}

/** Matches GET /api/products/[slug]/variants matrix branch (keep in sync). */
function computeMatrixRowShopPreview(
  row: ProductVariantMatrixRow,
  formPricing: {
    printfulBasePrice: string;
    taeAddOnFee: string;
    artistRoyalty: string;
  }
) {
  const toN = (v: unknown, fb: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fb;
  };
  const rowAny = row as unknown as Record<string, unknown>;
  const productPrintful = Math.max(0, parseFloat(formPricing.printfulBasePrice) || 0);
  const printfulBase = effectiveMatrixRowPrintfulBaseFromRow(row, productPrintful);
  const productTae = Math.max(0, parseFloat(formPricing.taeAddOnFee) || 0);
  const tae = toN(row.taeAddOnFee, productTae);
  const defaultArt = Math.max(0, parseFloat(formPricing.artistRoyalty) || DEFAULT_ARTIST_ROYALTY);
  const art = toN(row.artistRoyalty, defaultArt);
  const up = toN(rowAny.variationUpcharge, 0);
  const components = Math.max(0, printfulBase + tae + art + up);
  const sellOverride = finiteMatrixSellOverride(row.sellPrice);
  const displayed = sellOverride != null ? sellOverride : components;
  return { displayed, components };
}

function matrixMoneyCommittedDisplay(row: ProductVariantMatrixRow, field: MatrixMoneyField): string {
  if (field === "providerCost") {
    const pv = row.providerCost;
    const pb = row.printfulBasePrice;
    const display = pv ?? pb;
    if (display == null || !Number.isFinite(Number(display))) return "";
    return String(display);
  }
  const v = row[field];
  if (v == null || !Number.isFinite(v)) return "";
  return String(v);
}

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
  const [galleryDraft, setGalleryDraft] = useState<ProductImageEntry[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [rowProductionArtworkBusy, setRowProductionArtworkBusy] = useState<Record<string, boolean>>({});
  const [imgError, setImgError] = useState<string | null>(null);
  const [libHeroId, setLibHeroId] = useState<string | null>(null);
  const [libGalleryIds, setLibGalleryIds] = useState<string[]>([]);
  const [libraryPicker, setLibraryPicker] = useState<null | "hero" | "gallery">(null);
  const [libraryAssets, setLibraryAssets] = useState<
    { id: string; imageUrl: string; title: string | null; originalFilename: string | null }[]
  >([]);
  const [libraryPickerLoading, setLibraryPickerLoading] = useState(false);
  const [librarySaving, setLibrarySaving] = useState(false);
  const [galleryLibSelection, setGalleryLibSelection] = useState<Set<string>>(() => new Set());
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  type ProductFormTab = "details" | "images";
  const [productFormTab, setProductFormTab] = useState<ProductFormTab>("details");
  const [imagesTabMountNode, setImagesTabMountNode] = useState<HTMLDivElement | null>(null);
  const imageRuleMatrix = useMemo((): ProductVariantMatrixRow[] | undefined => {
    if (showForm && editId) {
      return Array.isArray(form.variantMatrix) ? (form.variantMatrix as ProductVariantMatrixRow[]) : undefined;
    }
    return imageEditProduct?.variantMatrix;
  }, [showForm, editId, form.variantMatrix, imageEditProduct?.variantMatrix]);
  const imageModalRuleOptions = useMemo(
    () => buildImageModalRuleOptions(imageRuleMatrix),
    [imageRuleMatrix]
  );
  const [showWatermarkEditor, setShowWatermarkEditor] = useState(false);
  const [wmDraft, setWmDraft] = useState<{ x: number; y: number; scale: number; rotation: number } | null>(null);
  const [wmDragging, setWmDragging] = useState(false);
  const [wmResizing, setWmResizing] = useState(false);
  const [draftHeroFile, setDraftHeroFile] = useState<File | null>(null);
  const [draftGalleryFiles, setDraftGalleryFiles] = useState<File[]>([]);
  const [rowPrintfulVariants, setRowPrintfulVariants] = useState<Record<string, PrintfulVariantOption[]>>({});
  const [rowPrintfulLoadingVariants, setRowPrintfulLoadingVariants] = useState<Record<string, boolean>>({});
  const [matrixMoneyDrafts, setMatrixMoneyDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setMatrixMoneyDrafts({});
  }, [editId]);

  const selectedProductTypeConfig =
    PRODUCT_TYPE_MATRIX_FIELDS[form.productType || "art-print"] ||
    PRODUCT_TYPE_MATRIX_FIELDS["art-print"];

  const variantFieldEnabled = (
    field:
      | "format"
      | "size"
      | "paperType"
      | "frame"
      | "frameColor"
      | "printfulProductId"
      | "printfulVariantId"
      | "providerCost"
      | "artistRoyalty"
      | "taeAddOnFee"
      | "sellPrice"
  ) => selectedProductTypeConfig.fields.includes(field);

  const variantDropdownConfig =
    VARIANT_DROPDOWN_OPTIONS[form.productType || "art-print"] || null;

  const variantPrintfulProducts = useMemo(() => {
    const stationery = getStationeryPrintfulProducts(form.productType);
    if (stationery.length > 0) return stationery;

    const cfg = VARIANT_DROPDOWN_OPTIONS[form.productType || "art-print"];
    if (Array.isArray(cfg?.printfulProducts) && cfg.printfulProducts.length > 0) {
      return cfg.printfulProducts;
    }

    if (form.productType === "art-print") {
      return PRINTFUL_FALLBACK_PRODUCTS.filter(
        (product) =>
          product.id === 1 ||
          product.id === 2 ||
          product.id === 171 ||
          product.id === 172
      ).map((product) => ({ id: product.id, label: product.title }));
    }

    return [];
  }, [form.productType]);

  const getVariantPrintfulProductsForRow = (row: ProductVariantMatrixRow) => {
    if (form.productType === "greeting-card") {
      return variantPrintfulProducts.filter(
        (product): product is StationeryPrintfulPickerProduct => product.format === "bifold"
      );
    }

    if (STATIONERY_PRODUCT_TYPES.has(form.productType || "")) {
      const rowFormat = getRowStationeryFormat(row);
      return variantPrintfulProducts.filter(
        (product): product is StationeryPrintfulPickerProduct =>
          (product.format === "flat" || product.format === "bifold") &&
          product.format === rowFormat
      );
    }

    if (form.productType !== "art-print" && form.productType !== "canvas-print") {
      return variantPrintfulProducts;
    }

    return variantPrintfulProducts.filter((product) => {
      const label = product.label.toLowerCase();
      const paperType = (row.paperType || "").trim();
      const frame = (row.frame || "").trim();

      if (form.productType === "art-print") {
        if (paperType === "Enhanced Matte Paper" && !label.includes("enhanced matte")) {
          return false;
        }

        if (paperType === "Premium Luster Paper" && !label.includes("premium luster")) {
          return false;
        }
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

    let list: PrintfulVariantOption[];

    if (liveVariants?.length) {
      if (row.frame === "Framed") {
        const filteredLiveVariants = liveVariants.filter((variant) =>
          (variant.name || "").toLowerCase().includes(frameColor.toLowerCase())
        );

        if (filteredLiveVariants.length) {
          list = filteredLiveVariants;
        } else {
          list = liveVariants;
        }
      } else {
        list = liveVariants;
      }
    } else if (row.frame === "Framed") {
      list = PRINTFUL_FRAMED_FALLBACK_VARIANTS[productId]?.[frameColor] || [];
    } else {
      list = PRINTFUL_FALLBACK_VARIANTS[productId] || [];
    }

    return filterPostcardVariantList(list, row.size, form.productType);
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
            .filter((item: any) => item?.id && item?.slug && item?.name)
            .map((item: any) => ({
              id: String(item.id),
              slug: item.slug,
              name: item.name,
              sourceImageUrl: item?.portfolio?.[0]?.image || null,
            }))
        );
      }

      if (coCreatorsJson?.data && Array.isArray(coCreatorsJson.data)) {
        setCoCreators(
          coCreatorsJson.data
            .filter((item: any) => item?.id && item?.slug && item?.name)
            .map((item: any) => ({
              id: String(item.id),
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
  const uploadProductImage = async (
    file: File,
    productId: string,
    kind: "hero" | "gallery" | "artworkSource"
  ) => {
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

  const handleVariantProductionArtworkUpload = async (
    rowId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editId) return;
    const sizeErr = productImageFileTooLargeMessage(file);
    if (sizeErr) {
      setError(sizeErr);
      e.target.value = "";
      return;
    }
    setError("");
    setRowProductionArtworkBusy((prev) => ({ ...prev, [rowId]: true }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productId", editId);
      fd.append("kind", "variantProductionArtwork");
      fd.append("variantMatrixRowId", rowId);
      const { res, data } = await adminFetchJson(
        "/api/admin/products/upload-image",
        { method: "POST", body: fd },
        () => router.push("/b_d_admn_tae/login")
      );
      if (res.ok && data?.success && typeof data?.url === "string") {
        setForm((prev) => ({
          ...prev,
          variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map((item) =>
            item.id === rowId ? { ...item, productionArtworkUrl: data.url } : item
          ),
        }));
        loadProducts();
      } else {
        setError(data?.error || "Production file upload failed");
      }
    } catch (err) {
      if (!(err instanceof AdminUnauthorizedError)) setError("Production file upload failed");
    } finally {
      setRowProductionArtworkBusy((prev) => ({ ...prev, [rowId]: false }));
      e.target.value = "";
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

  /** Merge saved product with current form fields for the Images tab / modal. */
  const mergeProductWithFormDraft = useCallback(
    (p: Product): Product => ({
      ...p,
      name: form.name.trim() || p.name,
      artworkSourceUrl: (form.artworkSourceUrl || "").trim() || p.artworkSourceUrl || null,
      variantMatrix: Array.isArray(form.variantMatrix)
        ? (form.variantMatrix as ProductVariantMatrixRow[])
        : p.variantMatrix ?? [],
    }),
    [form.name, form.artworkSourceUrl, form.variantMatrix]
  );

  const applyImagesTabContext = useCallback(() => {
    if (!editId) return;
    const p = products.find((pr) => pr.id === editId);
    if (!p) return;
    setImgError(null);
    const merged = mergeProductWithFormDraft(p);
    setImageEditProduct(merged);
    setGalleryDraft(productImagesFromProduct(merged));
    setLibHeroId(merged.libraryHeroMediaId?.trim() || null);
    setLibGalleryIds(parseLibraryGalleryIdsJson(merged.libraryGalleryMediaIdsJson));
  }, [editId, products, mergeProductWithFormDraft]);

  const setProductFormTabAndMaybeLoadImages = useCallback(
    (tab: ProductFormTab) => {
      setProductFormTab(tab);
      if (tab === "images" && editId) applyImagesTabContext();
    },
    [editId, applyImagesTabContext]
  );

  const persistProductGallery = useCallback(
    async (productId: string, draft: ProductImageEntry[]) => {
      const sorted = [...draft].sort((a, b) => a.sortOrder - b.sortOrder);
      const forNorm = sorted.map((r, i) => ({
        id: r.id,
        imageUrl: r.imageUrl,
        title: r.title.trim() ? r.title.trim() : null,
        description: r.description.trim() ? r.description.trim() : null,
        sortOrder: i,
        isHero: r.isHero,
        isActive: r.isActive,
        sourceType: r.sourceType,
        variantKey: r.variantKey,
        variantId: r.variantId,
        size: r.size,
        frame: r.frame,
        frameColor: r.frameColor,
        material: r.material,
        orientation: r.orientation,
        format: r.format,
      }));
      const normalized = normalizeHeroFlags(forNorm);
      const productImages = normalized.map((r, i) => ({
        imageUrl: r.imageUrl,
        title: r.title,
        description: r.description,
        sortOrder: i,
        isHero: r.isHero,
        isActive: r.isActive,
        sourceType: r.sourceType,
        variantKey: r.variantKey,
        variantId: r.variantId,
        size: r.size,
        frame: r.frame,
        frameColor: r.frameColor,
        material: r.material,
        orientation: r.orientation,
        format: r.format,
      }));
      const { res, data } = await adminFetchJson(
        `/api/admin/store-products/${productId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productImages }),
        },
        () => router.push("/b_d_admn_tae/login")
      );
      if (!res.ok || !data?.success) {
        setImgError(data?.error || "Failed to save images");
        return;
      }
      const detail = await adminFetchJson(
        `/api/admin/store-products/${productId}`,
        undefined,
        () => router.push("/b_d_admn_tae/login")
      );
      if (detail.res.ok && detail.data?.success && detail.data?.data) {
        const saved = detail.data.data as Product;
        setGalleryDraft(productImagesFromProduct(saved));
        setImageEditProduct((prev) => (prev?.id === productId ? saved : prev));
        const sync = deriveHeroGalleryFromDraft(productImagesFromProduct(saved));
        if (editId === productId) {
          setForm((prev) => ({
            ...prev,
            heroImage: sync.hero,
            galleryImages: sync.gallery,
          }));
        }
      } else {
        const sync = deriveHeroGalleryFromDraft(draft);
        if (editId === productId) {
          setForm((prev) => ({
            ...prev,
            heroImage: sync.hero,
            galleryImages: sync.gallery,
          }));
        }
      }
      await loadProducts();
    },
    [router, loadProducts, editId]
  );

  const persistLibraryAssignments = useCallback(
    async (nextHero: string | null, nextGallery: string[]) => {
      if (!editId) return;
      setLibrarySaving(true);
      setImgError(null);
      try {
        const { res, data } = await adminFetchJson(
          `/api/admin/store-products/${editId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              libraryHeroMediaId: nextHero,
              libraryGalleryMediaIdsJson: galleryIdsJsonFromList(nextGallery),
            }),
          },
          () => router.push("/b_d_admn_tae/login")
        );
        if (!res.ok || !data?.success) {
          setImgError(data?.error || "Failed to save library assignments");
          return;
        }
        const detail = await adminFetchJson(
          `/api/admin/store-products/${editId}`,
          undefined,
          () => router.push("/b_d_admn_tae/login")
        );
        if (detail.res.ok && detail.data?.success && detail.data?.data) {
          const saved = detail.data.data as Product;
          setImageEditProduct(mergeProductWithFormDraft(saved));
          setGalleryDraft(productImagesFromProduct(saved));
        }
        setLibHeroId(nextHero);
        setLibGalleryIds([...nextGallery]);
        await loadProducts();
      } finally {
        setLibrarySaving(false);
        setLibraryPicker(null);
        setGalleryLibSelection(new Set());
      }
    },
    [editId, router, loadProducts, mergeProductWithFormDraft]
  );

  const openLibraryPicker = useCallback(
    async (mode: "hero" | "gallery") => {
      setLibraryPicker(mode);
      setGalleryLibSelection(new Set());
      setLibraryPickerLoading(true);
      setImgError(null);
      try {
        const { res, data } = await adminFetchJson(
          "/api/admin/product-media-library",
          undefined,
          () => router.push("/b_d_admn_tae/login")
        );
        if (res.ok && data?.success && Array.isArray(data.data)) {
          setLibraryAssets(data.data);
        } else {
          setLibraryAssets([]);
          setImgError(data?.error || "Could not load Product Media Library");
        }
      } catch {
        setLibraryAssets([]);
        setImgError("Could not load Product Media Library");
      } finally {
        setLibraryPickerLoading(false);
      }
    },
    [router]
  );

  const handleGalleryImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !imageEditProduct) return;
    if (galleryDraft.length >= 30) {
      setImgError("Maximum 30 images per product");
      e.target.value = "";
      return;
    }
    setGalleryUploading(true);
    setImgError(null);
    let next = [...galleryDraft].sort((a, b) => a.sortOrder - b.sortOrder);
    try {
      for (const file of Array.from(files)) {
        if (next.length >= 30) break;
        const sizeErr = productImageFileTooLargeMessage(file);
        if (sizeErr) {
          setImgError(sizeErr);
          break;
        }
        const result = await uploadProductImage(file, imageEditProduct.id, "gallery");
        if (result.success && result.data?.url) {
          const url = result.data.url as string;
          next.push({
            id: localImageId(),
            imageUrl: url,
            title: "",
            description: "",
            sortOrder: next.length,
            isHero: next.length === 0,
            isActive: true,
            sourceType: "general",
            variantKey: null,
            variantId: null,
            size: null,
            frame: null,
            frameColor: null,
            material: null,
            orientation: null,
            format: null,
          });
        } else {
          setImgError(result.data?.error || "Upload failed");
          break;
        }
      }
      setGalleryDraft(next);
      await persistProductGallery(imageEditProduct.id, next);
    } catch (err) {
      if (!(err instanceof AdminUnauthorizedError)) setImgError("Upload failed");
    } finally {
      setGalleryUploading(false);
    }
    e.target.value = "";
  };

  const handleRemoveGalleryRow = async (idx: number) => {
    if (!imageEditProduct) return;
    const sorted = [...galleryDraft].sort((a, b) => a.sortOrder - b.sortOrder);
    const filtered = sorted.filter((_, i) => i !== idx).map((r, i) => ({ ...r, sortOrder: i }));
    let next = normalizeHeroFlags(
      filtered.map((r, i) => ({
        id: r.id,
        imageUrl: r.imageUrl,
        title: r.title.trim() ? r.title.trim() : null,
        description: r.description.trim() ? r.description.trim() : null,
        sortOrder: i,
        isHero: r.isHero,
        isActive: r.isActive,
        sourceType: r.sourceType,
        variantKey: r.variantKey,
        variantId: r.variantId,
        size: r.size,
        frame: r.frame,
        frameColor: r.frameColor,
        material: r.material,
        orientation: r.orientation,
        format: r.format,
      }))
    ).map((r, i) => ({
      id: r.id,
      imageUrl: r.imageUrl,
      title: r.title ?? "",
      description: r.description ?? "",
      sortOrder: i,
      isHero: !!r.isHero,
      isActive: r.isActive !== false,
      sourceType: (r.sourceType === "variant" || r.sourceType === "api"
        ? r.sourceType
        : "general") as ProductImageSource,
      variantKey: r.variantKey ?? null,
      variantId: r.variantId ?? null,
      size: r.size ?? null,
      frame: r.frame ?? null,
      frameColor: r.frameColor ?? null,
      material: r.material ?? null,
      orientation: r.orientation ?? null,
      format: r.format ?? null,
    })) as ProductImageEntry[];
    if (next.length > 0 && !next.some((r) => r.isHero)) {
      next = next.map((r, i) => ({ ...r, isHero: i === 0 }));
    }
    setGalleryDraft(next);
    await persistProductGallery(imageEditProduct.id, next);
  };

  const handleGalleryRowReorder = async (fromIdx: number, toIdx: number) => {
    if (!imageEditProduct || fromIdx === toIdx) return;
    const next = [...galleryDraft].sort((a, b) => a.sortOrder - b.sortOrder);
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const reindexed = next.map((r, i) => ({ ...r, sortOrder: i }));
    setGalleryDraft(reindexed);
    await persistProductGallery(imageEditProduct.id, reindexed);
  };

  const handleSetHeroIndex = async (idx: number) => {
    if (!imageEditProduct) return;
    const sorted = [...galleryDraft].sort((a, b) => a.sortOrder - b.sortOrder);
    const next = sorted.map((r, i) => ({ ...r, isHero: i === idx }));
    setGalleryDraft(next);
    await persistProductGallery(imageEditProduct.id, next);
  };

  const handleGalleryFieldChange = async (idx: number, patch: Partial<ProductImageEntry>) => {
    if (!imageEditProduct) return;
    const sorted = [...galleryDraft].sort((a, b) => a.sortOrder - b.sortOrder);
    const next = sorted.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    setGalleryDraft(next);
    await persistProductGallery(imageEditProduct.id, next);
  };

  const loadRowPrintfulVariants = useCallback(async (rowId: string, productId: number) => {
    const fallbackVariants = PRINTFUL_FALLBACK_VARIANTS[productId] || [];

    const backfillProviderCostForRow = (options: PrintfulVariantOption[]) => {
      setMatrixMoneyDrafts((prev) => {
        const next = { ...prev };
        delete next[matrixMoneyKey(rowId, "providerCost")];
        return next;
      });
      setForm((prev) => ({
        ...prev,
        variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map((item) => {
          if (item.id !== rowId) return item;
          const vid = item.printfulVariantId;
          if (vid == null || item.providerCost != null) return item;
          const opt = options.find((v) => v.id === vid);
          if (opt?.catalogPrice == null) return item;
          return { ...item, providerCost: opt.catalogPrice };
        }),
      }));
    };

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
          backfillProviderCostForRow(fallbackVariants);
          return;
        }
        throw new Error(data?.error || `Variant load failed (${res.status})`);
      }

      const body = data?.body?.result || {};
      const variants =
        Array.isArray(body?.variants) && body.variants.length
          ? body.variants
          : Array.isArray(body?.sync_variants)
            ? body.sync_variants
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
            catalogPrice: parsePrintfulCatalogPriceForProviderCost(variant),
          };
        })
        .filter(Boolean) as PrintfulVariantOption[];

      const finalList = mappedVariants.length > 0 ? mappedVariants : fallbackVariants;
      setRowPrintfulVariants((prev) => ({
        ...prev,
        [rowId]: finalList,
      }));
      backfillProviderCostForRow(finalList);
    } catch (err: any) {
      if (fallbackVariants.length > 0) {
        setRowPrintfulVariants((prev) => ({ ...prev, [rowId]: fallbackVariants }));
        backfillProviderCostForRow(fallbackVariants);
      } else {
        setError(err?.message || "Failed to load Printful variants");
      }
    } finally {
      setRowPrintfulLoadingVariants((prev) => ({ ...prev, [rowId]: false }));
    }
  }, []);

  useEffect(() => {
    if (!showForm) return;
    const pt = form.productType || "";
    if (pt !== "art-print" && pt !== "canvas-print" && pt !== "postcard") return;
    if (!Array.isArray(form.variantMatrix) || form.variantMatrix.length === 0) return;

    for (const row of form.variantMatrix) {
      const pid = autoResolvedPrintfulProductId(pt, row);
      if (pid == null) continue;
      if (
        pt === "canvas-print" &&
        rowPrintfulVariants[row.id] === undefined &&
        !rowPrintfulLoadingVariants[row.id]
      ) {
        void loadRowPrintfulVariants(row.id, pid);
      }
    }

    setForm((prev) => {
      if (!Array.isArray(prev.variantMatrix)) return prev;
      let changed = false;
      const nextMatrix = prev.variantMatrix.map((row) => {
        const patched = applyAutoPrintfulResolutionToRow(
          pt,
          row,
          rowPrintfulVariants[row.id]
        );
        if (!patched) return row;
        changed = true;
        return patched;
      });
      if (!changed) return prev;
      return { ...prev, variantMatrix: nextMatrix };
    });
  }, [
    showForm,
    form.variantMatrix,
    form.productType,
    rowPrintfulVariants,
    rowPrintfulLoadingVariants,
    loadRowPrintfulVariants,
  ]);

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
      setProductFormTab("details");
      setImageEditProduct(null);
      setGalleryDraft([]);
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

  const handleEdit = (p: Product, options?: { openImagesTab?: boolean }) => {
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
      artistId: p.artistId || "",
      coCreatorSlug: p.coCreatorSlug || "",
      coCreatorId: p.coCreatorId || "",
      heroImage: p.heroImage || "",
      galleryImages: p.galleryImages || "[]",
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
    if (options?.openImagesTab) {
      setProductFormTab("images");
      setImgError(null);
      setImageEditProduct(p);
      setGalleryDraft(productImagesFromProduct(p));
    } else {
      setProductFormTab("details");
      setImageEditProduct(null);
      setGalleryDraft([]);
    }
  };

  const handleSave = async (saveOpts?: { stayOpen?: boolean; goToImagesTab?: boolean }) => {
    setSaving(true);
    setError("");
    try {
      if (draftHeroFile) {
        const heroErr = productImageFileTooLargeMessage(draftHeroFile);
        if (heroErr) {
          setError(heroErr);
          return;
        }
      }
      for (const f of draftGalleryFiles) {
        const gErr = productImageFileTooLargeMessage(f);
        if (gErr) {
          setError(gErr);
          return;
        }
      }

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
        artistId: form.artistId.trim() || null,
        coCreatorSlug: form.coCreatorSlug.trim() || null,
        coCreatorId: form.coCreatorId.trim() || null,
        heroImage: form.heroImage || null,
        galleryImages: form.galleryImages || null,
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
        await loadProducts();

        if (saveOpts?.stayOpen && savedId) {
          if (!editId) setEditId(savedId);
          setDraftHeroFile(null);
          setDraftGalleryFiles([]);
          if (saveOpts.goToImagesTab) {
            const detail = await adminFetchJson(
              `/api/admin/store-products/${savedId}`,
              undefined,
              () => router.push("/b_d_admn_tae/login")
            );
            if (detail.res.ok && detail.data?.success && detail.data?.data) {
              const saved = detail.data.data as Product;
              setImgError(null);
              setImageEditProduct(mergeProductWithFormDraft(saved));
              setGalleryDraft(productImagesFromProduct(saved));
            }
            setProductFormTab("images");
          }
          setSaving(false);
          return;
        }

        setShowForm(false);
        setEditId(null);
        setProductFormTab("details");
        setImageEditProduct(null);
        setGalleryDraft([]);
        setForm(EMPTY_FORM);
        setDraftHeroFile(null);
        setDraftGalleryFiles([]);
        setRowPrintfulVariants({});
        setRowPrintfulLoadingVariants({});
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
          <h1 className="text-2xl font-normal text-brand-dark font-playfair">Products</h1>
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
                  <button
                    type="button"
                    onClick={() => handleEdit(p, { openImagesTab: true })}
                    className={BTN_ICON}
                    title="Images (open in editor)"
                  >
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
          <div
            className={`bg-white w-full my-8 ${productFormTab === "images" ? "max-w-4xl" : "max-w-2xl"}`}
          >
            <div className="px-6 py-4 border-b border-brand-light flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-brand-dark">
                {editId ? "Edit Product" : "New Product"}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setProductFormTab("details");
                  setImageEditProduct(null);
                  setGalleryDraft([]);
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
            <div className="px-6 pt-3 pb-0 border-b border-brand-light flex gap-1">
              <button
                type="button"
                onClick={() => setProductFormTabAndMaybeLoadImages("details")}
                className={`px-3 py-2 text-xs font-medium rounded-t border border-b-0 transition-colors ${
                  productFormTab === "details"
                    ? "bg-white border-brand-light text-brand-dark -mb-px z-10"
                    : "border-transparent text-brand-medium hover:text-brand-dark"
                }`}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setProductFormTabAndMaybeLoadImages("images")}
                className={`px-3 py-2 text-xs font-medium rounded-t border border-b-0 transition-colors ${
                  productFormTab === "images"
                    ? "bg-white border-brand-light text-brand-dark -mb-px z-10"
                    : "border-transparent text-brand-medium hover:text-brand-dark"
                }`}
              >
                Product Images
              </button>
            </div>
            {productFormTab === "details" && (
            <div className="p-6 space-y-4">
              <AdminAccordionSection title="Product details">
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
                <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Product Type</label>
                <select
                  value={form.productType || "art-print"}
                  onChange={(e) => setForm({ ...form, productType: e.target.value })}
                  className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest max-w-md"
                >
                  <option value="art-print">ArtPrint</option>
                  <option value="canvas-print">Canvas Prints</option>
                  <option value="greeting-card">Greeting Cards</option>
                  <option value="postcard">Postcards</option>
                  <option value="invitation">Invitations</option>
                  <option value="announcement">Announcements</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">Category *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest max-w-md"
                >
                  <option value="">Select...</option>
                  {leafCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.pathLabel || c.name}</option>
                  ))}
                </select>
              </div>

              <div className="mt-6 pt-5 border-t border-brand-light/60 space-y-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-dark/70">
                  Gallery &amp; Collaboration Placement
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                      Artist
                    </label>
                    <select
                      value={form.artistSlug}
                      onChange={(e) => {
                        const slug = e.target.value;
                        const opt = artists.find((a) => a.slug === slug);
                        setForm({
                          ...form,
                          artistSlug: slug,
                          artistId: opt?.id || "",
                        });
                      }}
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
                      Links this product to a gallery artist (ID + slug in product meta).
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                      CoCreator
                    </label>
                    <select
                      value={form.coCreatorSlug}
                      onChange={(e) => {
                        const slug = e.target.value;
                        const opt = coCreators.find((c) => c.slug === slug);
                        setForm({
                          ...form,
                          coCreatorSlug: slug,
                          coCreatorId: opt?.id || "",
                        });
                      }}
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
                      Links this product to a co-creator (ID + slug in product meta).
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between gap-3 border border-brand-light rounded-lg p-3 bg-white">
                    <div>
                      <div className="text-xs font-medium text-brand-dark/70 uppercase tracking-wider">
                        Customizable
                      </div>
                      <p className="text-[11px] mt-1 text-brand-medium">
                        Studio customization allowed for this product.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, customizable: !form.customizable })}
                      className={`px-2.5 py-1 text-xs rounded border shrink-0 ${form.customizable ? "bg-brand-dark text-white border-brand-dark" : "bg-white text-brand-dark border-brand-light"}`}
                      title="Toggle customizable for this product"
                    >
                      {form.customizable ? "Yes" : "No"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3 border border-brand-light rounded-lg p-3 bg-white">
                    <div>
                      <div className="text-xs font-medium text-brand-dark/70 uppercase tracking-wider">
                        Requires QR / ArtKey portal
                      </div>
                      <p className="text-[11px] mt-1 text-brand-medium">
                        When on, studio flow expects ArtKey portal setup for this product.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, requiresQrCode: !form.requiresQrCode })}
                      className={`px-2.5 py-1 text-xs rounded border shrink-0 ${form.requiresQrCode ? "bg-brand-dark text-white border-brand-dark" : "bg-white text-brand-dark border-brand-light"}`}
                      title="Toggle QR code requirement for this product"
                    >
                      {form.requiresQrCode ? "Required" : "Off"}
                    </button>
                  </div>
                </div>
              </div>
              </AdminAccordionSection>

              <AdminAccordionSection title={`Variant matrix · ${selectedProductTypeConfig.label}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-medium text-brand-dark/70 uppercase tracking-wider">
                    Rows &amp; fulfillment options
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
                            ...(STATIONERY_PRODUCT_TYPES.has(prev.productType || "") &&
                            prev.productType !== "greeting-card"
                              ? { format: "flat" as const }
                              : {}),
                            paperType: "",
                            size:
                              prev.productType === "postcard"
                                ? VARIANT_DROPDOWN_OPTIONS.postcard.sizes?.[0] ?? ""
                                : "",
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
                            productionArtworkUrl: null,
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
                    {form.variantMatrix.map((row, index) => {
                      const rowShopPreview = computeMatrixRowShopPreview(row, {
                        printfulBasePrice: form.printfulBasePrice,
                        taeAddOnFee: form.taeAddOnFee,
                        artistRoyalty: form.artistRoyalty,
                      });
                      const isStationeryMatrix = STATIONERY_PRODUCT_TYPES.has(form.productType || "");
                      return (
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
                          {variantFieldEnabled("format") && (
                            <div
                              className={
                                isStationeryMatrix
                                  ? "sm:col-span-2 rounded-lg border-2 border-brand-medium/40 bg-white p-3 shadow-sm"
                                  : "sm:col-span-2"
                              }
                            >
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-dark/80 mb-1">
                                {isStationeryMatrix ? "1 · Format" : "Card format"}
                              </div>
                              <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">
                                {isStationeryMatrix
                                  ? "Flat or bifold (sets Printful family)"
                                  : "Card format (Printful family)"}
                              </label>
                              <select
                                value={getRowStationeryFormat(row)}
                                onChange={(e) => {
                                  const fmt =
                                    e.target.value === "bifold" ? "bifold" : "flat";
                                  setMatrixMoneyDrafts((prev) => {
                                    const next = { ...prev };
                                    delete next[matrixMoneyKey(row.id, "providerCost")];
                                    return next;
                                  });
                                  setRowPrintfulVariants((prev) => {
                                    const next = { ...prev };
                                    delete next[row.id];
                                    return next;
                                  });
                                  setForm((prev) => ({
                                    ...prev,
                                    variantMatrix: (
                                      Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []
                                    ).map((item) =>
                                      item.id === row.id
                                        ? {
                                            ...item,
                                            format: fmt,
                                            printfulProductId: null,
                                            printfulVariantId: null,
                                            providerCost: null,
                                          }
                                        : item
                                    ),
                                  }));
                                }}
                                className="w-full border border-brand-medium/50 px-3 py-2.5 text-sm font-medium bg-white max-w-md"
                              >
                                <option value="flat">Flat</option>
                                <option value="bifold">Bifold</option>
                              </select>
                              <p className="text-[10px] text-brand-dark/60 mt-2 leading-snug">
                                {isStationeryMatrix ? (
                                  <>
                                    Format is the row-level source of truth for which Printful catalog family applies.
                                    Families come from centralized stationery config; changing format clears product,
                                    variant, and provider cost so you cannot mix flat and bifold IDs on one row. Rows
                                    without an explicit format still infer bifold when the Printful product ID matches
                                    legacy folded-card IDs.
                                  </>
                                ) : (
                                  <>Pick flat vs folded card; then choose the matching Printful product and variant.</>
                                )}
                              </p>
                            </div>
                          )}
                          {isStationeryMatrix && variantFieldEnabled("format") && (
                            <div className="sm:col-span-2 space-y-3 border border-brand-light/80 rounded-md bg-white/80 p-3">
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-dark/70">
                                2 · Printful catalog
                              </div>
                              <p className="text-[10px] text-brand-dark/55 leading-snug">
                                Only the Printful product that matches this row&apos;s format appears in the list.
                                Options labeled &quot;(provisional ID)&quot; are placeholders—verify the ID in
                                Printful before relying on fulfillment.
                              </p>
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
                                      setMatrixMoneyDrafts((prev) => {
                                        const next = { ...prev };
                                        delete next[matrixMoneyKey(row.id, "providerCost")];
                                        return next;
                                      });
                                      setForm((prev) => ({
                                        ...prev,
                                        variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                          (item) =>
                                            item.id === row.id
                                              ? {
                                                  ...item,
                                                  printfulProductId: pid,
                                                  printfulVariantId: null,
                                                  providerCost: null,
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
                                      setMatrixMoneyDrafts((prev) => {
                                        const next = { ...prev };
                                        delete next[matrixMoneyKey(row.id, "providerCost")];
                                        return next;
                                      });
                                      setForm((prev) => ({
                                        ...prev,
                                        variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                          (item) =>
                                            item.id === row.id
                                              ? {
                                                  ...item,
                                                  printfulProductId: Number.isFinite(pid as number) ? pid : null,
                                                  printfulVariantId: null,
                                                  providerCost: null,
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
                                    onChange={(e) => {
                                      const vid = e.target.value ? parseInt(e.target.value, 10) : null;
                                      const options = getVariantOptionsForRow(row);
                                      const selected = vid != null ? options.find((v) => v.id === vid) : null;
                                      const postcardSize =
                                        form.productType === "postcard" && selected
                                          ? postcardMatrixSizeForVariant(selected)
                                          : null;
                                      const nextCost = providerCostFromVariantOptions(vid, options);
                                      setMatrixMoneyDrafts((prev) => {
                                        const next = { ...prev };
                                        delete next[matrixMoneyKey(row.id, "providerCost")];
                                        return next;
                                      });
                                      setForm((prev) => ({
                                        ...prev,
                                        variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                          (item) =>
                                            item.id === row.id
                                              ? {
                                                  ...item,
                                                  printfulVariantId: vid,
                                                  providerCost: nextCost,
                                                  ...(postcardSize ? { size: postcardSize } : {}),
                                                }
                                              : item
                                        ),
                                      }));
                                    }}
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
                                    onChange={(e) => {
                                      const vid = e.target.value ? parseInt(e.target.value, 10) : null;
                                      const options = getVariantOptionsForRow(row);
                                      const pid = row.printfulProductId;
                                      const live = rowPrintfulVariants[row.id] || [];
                                      const fb = pid ? PRINTFUL_FALLBACK_VARIANTS[pid] || [] : [];
                                      const selected =
                                        vid != null
                                          ? options.find((v) => v.id === vid) ||
                                            live.find((v) => v.id === vid) ||
                                            fb.find((v) => v.id === vid)
                                          : null;
                                      const postcardSize =
                                        form.productType === "postcard" && selected
                                          ? postcardMatrixSizeForVariant(selected)
                                          : null;
                                      const nextCost = providerCostFromVariantOptions(
                                        Number.isFinite(vid as number) ? vid : null,
                                        options
                                      );
                                      setMatrixMoneyDrafts((prev) => {
                                        const next = { ...prev };
                                        delete next[matrixMoneyKey(row.id, "providerCost")];
                                        return next;
                                      });
                                      setForm((prev) => ({
                                        ...prev,
                                        variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                          (item) =>
                                            item.id === row.id
                                              ? {
                                                  ...item,
                                                  printfulVariantId: Number.isFinite(vid as number) ? vid : null,
                                                  providerCost: nextCost,
                                                  ...(postcardSize ? { size: postcardSize } : {}),
                                                }
                                              : item
                                        ),
                                      }));
                                    }}
                                    className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                          {isStationeryMatrix && variantFieldEnabled("format") && (
                            <div className="sm:col-span-2 text-[10px] font-semibold uppercase tracking-wider text-brand-dark/70 pt-1">
                              3 · Size, paper &amp; extras
                            </div>
                          )}
                          {isStationeryMatrix && form.productType === "greeting-card" && (
                            <p className="sm:col-span-2 text-[10px] text-brand-dark/55 leading-snug -mt-2 mb-0">
                              Use <span className="font-medium">Envelope</span> per row (stored as{" "}
                              <code className="text-[9px]">frame</code> in row JSON so variant APIs and customer-facing
                              product images stay aligned).
                            </p>
                          )}
                          <div>
                            <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">Size</label>
                            {variantDropdownConfig?.sizes?.length ? (
                              <select
                                value={row.size || ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (form.productType === "postcard") {
                                    setMatrixMoneyDrafts((prev) => {
                                      const next = { ...prev };
                                      delete next[matrixMoneyKey(row.id, "providerCost")];
                                      return next;
                                    });
                                  }
                                  setForm((prev) => ({
                                    ...prev,
                                    variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                      (item) =>
                                        item.id === row.id
                                          ? {
                                              ...item,
                                              size: v,
                                              ...(prev.productType === "postcard"
                                                ? {
                                                    printfulVariantId: null,
                                                    providerCost: null,
                                                  }
                                                : {}),
                                            }
                                          : item
                                    ),
                                  }));
                                }}
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
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (form.productType === "postcard") {
                                    setMatrixMoneyDrafts((prev) => {
                                      const next = { ...prev };
                                      delete next[matrixMoneyKey(row.id, "providerCost")];
                                      return next;
                                    });
                                  }
                                  setForm((prev) => ({
                                    ...prev,
                                    variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                      (item) =>
                                        item.id === row.id
                                          ? {
                                              ...item,
                                              size: v,
                                              ...(prev.productType === "postcard"
                                                ? {
                                                    printfulVariantId: null,
                                                    providerCost: null,
                                                  }
                                                : {}),
                                            }
                                          : item
                                    ),
                                  }));
                                }}
                                className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">
                              {isStationeryMatrix ? "Paper" : "Material / Paper Type"}
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
                              <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">
                                {form.productType === "greeting-card" ? "Envelope" : "Frame"}
                              </label>
                              {variantDropdownConfig?.frames?.length ? (
                                <select
                                  value={row.frame || ""}
                                  onChange={(e) => {
                                    const nextFrame = e.target.value;
                                    const resetPrintfulOnFrame =
                                      form.productType === "art-print" || form.productType === "canvas-print";
                                    if (resetPrintfulOnFrame) {
                                      setMatrixMoneyDrafts((prev) => {
                                        const next = { ...prev };
                                        delete next[matrixMoneyKey(row.id, "providerCost")];
                                        return next;
                                      });
                                      setRowPrintfulVariants((prev) => {
                                        const next = { ...prev };
                                        delete next[row.id];
                                        return next;
                                      });
                                    }
                                    setForm((prev) => ({
                                      ...prev,
                                      variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                        (item) =>
                                          item.id === row.id
                                            ? {
                                                ...item,
                                                frame: nextFrame,
                                                frameColor: nextFrame === "Framed" ? item.frameColor : "",
                                                ...(resetPrintfulOnFrame
                                                  ? {
                                                      printfulProductId: null,
                                                      printfulVariantId: null,
                                                      providerCost: null,
                                                    }
                                                  : {}),
                                              }
                                            : item
                                      ),
                                    }));
                                  }}
                                  className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                                >
                                  <option value="">
                                    {form.productType === "greeting-card"
                                      ? "Select envelope…"
                                      : "Select frame option..."}
                                  </option>
                                  {variantDropdownConfig.frames.map((frameOption) => (
                                    <option key={frameOption} value={frameOption}>
                                      {frameOption}
                                    </option>
                                  ))}
                                  {form.productType === "greeting-card" &&
                                    (row.frame || "").trim() &&
                                    !variantDropdownConfig.frames.includes((row.frame || "").trim()) && (
                                      <option value={row.frame || ""}>
                                        {row.frame} (legacy — choose a standard envelope to migrate)
                                      </option>
                                    )}
                                </select>
                              ) : (
                                <>
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
                                    placeholder={
                                      form.productType === "greeting-card"
                                        ? "e.g. No Envelope, White Envelope"
                                        : undefined
                                    }
                                    className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                                  />
                                  {form.productType === "greeting-card" && (
                                    <p className="text-[10px] text-brand-dark/50 mt-1 leading-snug">
                                      Any label works; examples include No Envelope, White Envelope. Matches the shop
                                      &quot;Envelope&quot; dimension.
                                    </p>
                                  )}
                                </>
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
                          {(!isStationeryMatrix || form.productType === "greeting-card") && (
                            <>
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
                                  setMatrixMoneyDrafts((prev) => {
                                    const next = { ...prev };
                                    delete next[matrixMoneyKey(row.id, "providerCost")];
                                    return next;
                                  });
                                  setForm((prev) => ({
                                    ...prev,
                                    variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                      (item) =>
                                        item.id === row.id
                                          ? {
                                              ...item,
                                              printfulProductId: pid,
                                              printfulVariantId: null,
                                              providerCost: null,
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
                                  setMatrixMoneyDrafts((prev) => {
                                    const next = { ...prev };
                                    delete next[matrixMoneyKey(row.id, "providerCost")];
                                    return next;
                                  });
                                  setForm((prev) => ({
                                    ...prev,
                                    variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                      (item) =>
                                        item.id === row.id
                                          ? {
                                              ...item,
                                              printfulProductId: Number.isFinite(pid as number) ? pid : null,
                                              printfulVariantId: null,
                                              providerCost: null,
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
                                onChange={(e) => {
                                  const vid = e.target.value ? parseInt(e.target.value, 10) : null;
                                  const options = getVariantOptionsForRow(row);
                                  const selected = vid != null ? options.find((v) => v.id === vid) : null;
                                  const postcardSize =
                                    form.productType === "postcard" && selected
                                      ? postcardMatrixSizeForVariant(selected)
                                      : null;
                                  const nextCost = providerCostFromVariantOptions(vid, options);
                                  setMatrixMoneyDrafts((prev) => {
                                    const next = { ...prev };
                                    delete next[matrixMoneyKey(row.id, "providerCost")];
                                    return next;
                                  });
                                  setForm((prev) => ({
                                    ...prev,
                                    variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                      (item) =>
                                        item.id === row.id
                                          ? {
                                              ...item,
                                              printfulVariantId: vid,
                                              providerCost: nextCost,
                                              ...(postcardSize ? { size: postcardSize } : {}),
                                            }
                                          : item
                                    ),
                                  }));
                                }}
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
                                onChange={(e) => {
                                  const vid = e.target.value ? parseInt(e.target.value, 10) : null;
                                  const options = getVariantOptionsForRow(row);
                                  const pid = row.printfulProductId;
                                  const live = rowPrintfulVariants[row.id] || [];
                                  const fb = pid ? PRINTFUL_FALLBACK_VARIANTS[pid] || [] : [];
                                  const selected =
                                    vid != null
                                      ? options.find((v) => v.id === vid) ||
                                        live.find((v) => v.id === vid) ||
                                        fb.find((v) => v.id === vid)
                                      : null;
                                  const postcardSize =
                                    form.productType === "postcard" && selected
                                      ? postcardMatrixSizeForVariant(selected)
                                      : null;
                                  const nextCost = providerCostFromVariantOptions(
                                    Number.isFinite(vid as number) ? vid : null,
                                    options
                                  );
                                  setMatrixMoneyDrafts((prev) => {
                                    const next = { ...prev };
                                    delete next[matrixMoneyKey(row.id, "providerCost")];
                                    return next;
                                  });
                                  setForm((prev) => ({
                                    ...prev,
                                    variantMatrix: (Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []).map(
                                      (item) =>
                                        item.id === row.id
                                          ? {
                                              ...item,
                                              printfulVariantId: Number.isFinite(vid as number) ? vid : null,
                                              providerCost: nextCost,
                                              ...(postcardSize ? { size: postcardSize } : {}),
                                            }
                                          : item
                                    ),
                                  }));
                                }}
                                className="w-full border border-brand-light px-3 py-2 text-sm bg-white"
                              />
                            )}
                          </div>
                            </>
                          )}
                          {isStationeryMatrix && variantFieldEnabled("format") && (
                            <div className="sm:col-span-2 text-[10px] font-semibold uppercase tracking-wider text-brand-dark/70 pt-2 border-t border-brand-light/50 mt-1">
                              4 · Pricing
                            </div>
                          )}
                          <div>
                            <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">
                              Provider Cost ($)
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={
                                matrixMoneyDrafts[matrixMoneyKey(row.id, "providerCost")] ??
                                matrixMoneyCommittedDisplay(row, "providerCost")
                              }
                              onChange={(e) =>
                                setMatrixMoneyDrafts((prev) => ({
                                  ...prev,
                                  [matrixMoneyKey(row.id, "providerCost")]: e.target.value,
                                }))
                              }
                              onBlur={(e) => {
                                const key = matrixMoneyKey(row.id, "providerCost");
                                const raw = e.target.value;
                                setMatrixMoneyDrafts((prev) => {
                                  const next = { ...prev };
                                  delete next[key];
                                  return next;
                                });
                                const num = parseMoneyInputToNumberOrNull(raw);
                                setForm((prev) => ({
                                  ...prev,
                                  variantMatrix: (
                                    Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []
                                  ).map((item) =>
                                    item.id === row.id ? { ...item, providerCost: num } : item
                                  ),
                                }));
                              }}
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
                              value={
                                matrixMoneyDrafts[matrixMoneyKey(row.id, "artistRoyalty")] ??
                                matrixMoneyCommittedDisplay(row, "artistRoyalty")
                              }
                              onChange={(e) =>
                                setMatrixMoneyDrafts((prev) => ({
                                  ...prev,
                                  [matrixMoneyKey(row.id, "artistRoyalty")]: e.target.value,
                                }))
                              }
                              onBlur={(e) => {
                                const key = matrixMoneyKey(row.id, "artistRoyalty");
                                const raw = e.target.value;
                                setMatrixMoneyDrafts((prev) => {
                                  const next = { ...prev };
                                  delete next[key];
                                  return next;
                                });
                                const num = parseMoneyInputToNumberOrNull(raw);
                                setForm((prev) => ({
                                  ...prev,
                                  variantMatrix: (
                                    Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []
                                  ).map((item) =>
                                    item.id === row.id ? { ...item, artistRoyalty: num } : item
                                  ),
                                }));
                              }}
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
                              value={
                                matrixMoneyDrafts[matrixMoneyKey(row.id, "taeAddOnFee")] ??
                                matrixMoneyCommittedDisplay(row, "taeAddOnFee")
                              }
                              onChange={(e) =>
                                setMatrixMoneyDrafts((prev) => ({
                                  ...prev,
                                  [matrixMoneyKey(row.id, "taeAddOnFee")]: e.target.value,
                                }))
                              }
                              onBlur={(e) => {
                                const key = matrixMoneyKey(row.id, "taeAddOnFee");
                                const raw = e.target.value;
                                setMatrixMoneyDrafts((prev) => {
                                  const next = { ...prev };
                                  delete next[key];
                                  return next;
                                });
                                const num = parseMoneyInputToNumberOrNull(raw);
                                setForm((prev) => ({
                                  ...prev,
                                  variantMatrix: (
                                    Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []
                                  ).map((item) =>
                                    item.id === row.id ? { ...item, taeAddOnFee: num } : item
                                  ),
                                }));
                              }}
                              className="w-full border border-brand-light px-3 py-2 text-sm bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">Sell Price ($)</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={
                                matrixMoneyDrafts[matrixMoneyKey(row.id, "sellPrice")] ??
                                matrixMoneyCommittedDisplay(row, "sellPrice")
                              }
                              onChange={(e) =>
                                setMatrixMoneyDrafts((prev) => ({
                                  ...prev,
                                  [matrixMoneyKey(row.id, "sellPrice")]: e.target.value,
                                }))
                              }
                              onBlur={(e) => {
                                const key = matrixMoneyKey(row.id, "sellPrice");
                                const raw = e.target.value;
                                setMatrixMoneyDrafts((prev) => {
                                  const next = { ...prev };
                                  delete next[key];
                                  return next;
                                });
                                const num = parseMoneyInputToNumberOrNull(raw);
                                setForm((prev) => ({
                                  ...prev,
                                  variantMatrix: (
                                    Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []
                                  ).map((item) =>
                                    item.id === row.id ? { ...item, sellPrice: num } : item
                                  ),
                                }));
                              }}
                              className="w-full border border-brand-light px-3 py-2 text-sm bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <div className="text-[10px] font-medium text-brand-dark/70 uppercase tracking-wider mb-1.5">
                              Row pricing (shop)
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div className="bg-brand-lightest border border-brand-light p-2 rounded">
                                <div className="text-brand-medium">Customer-facing price</div>
                                <div className="text-brand-dark font-semibold">
                                  ${rowShopPreview.displayed.toFixed(2)}
                                </div>
                              </div>
                              <div className="bg-brand-lightest border border-brand-light p-2 rounded">
                                <div className="text-brand-medium">Calculated price</div>
                                <div className="text-brand-dark font-semibold">
                                  ${rowShopPreview.components.toFixed(2)}
                                </div>
                              </div>
                            </div>
                            <p className="text-[10px] text-brand-medium mt-1 leading-snug">
                              Sell Price overrides the computed total when set. Matches{" "}
                              <code className="text-[9px]">GET /api/products/[slug]/variants</code> matrix pricing.
                            </p>
                          </div>
                          <div className="sm:col-span-2 space-y-2 border-t border-brand-light/60 pt-3 mt-1">
                            <label className="block text-[11px] font-medium text-brand-dark/70 mb-1">
                              Production File
                            </label>
                            <p className="text-[10px] text-brand-medium leading-snug">
                              High-resolution production artwork for this variant row only (fulfillment / print file).
                              Upload a row-specific file when the print pipeline needs different art than shopper
                              previews.
                            </p>
                            {!editId ? (
                              <p className="text-[10px] text-brand-dark/60">Save the product first to enable upload.</p>
                            ) : null}
                            {(row.productionArtworkUrl || "").trim() ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <img
                                  src={(row.productionArtworkUrl || "").trim()}
                                  alt=""
                                  className="h-14 w-auto max-w-[120px] object-contain border border-brand-light rounded bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setForm((prev) => ({
                                      ...prev,
                                      variantMatrix: (
                                        Array.isArray(prev.variantMatrix) ? prev.variantMatrix : []
                                      ).map((item) =>
                                        item.id === row.id ? { ...item, productionArtworkUrl: null } : item
                                      ),
                                    }))
                                  }
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  Clear from form
                                </button>
                                <span className="text-[10px] text-brand-dark/55">
                                  Click &quot;Update Product&quot; to persist a clear; upload saves immediately.
                                </span>
                              </div>
                            ) : null}
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="text-xs text-brand-dark border border-brand-light px-2 py-1 rounded cursor-pointer hover:bg-brand-lightest/80 disabled:opacity-40">
                                {rowProductionArtworkBusy[row.id] ? "Uploading…" : "Upload file"}
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  disabled={!editId || !!rowProductionArtworkBusy[row.id]}
                                  onChange={(ev) => handleVariantProductionArtworkUpload(row.id, ev)}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-brand-medium">
                    No variant rows yet. Add one to start building valid option combinations for this parent product.
                  </div>
                )}
              </div>
              </AdminAccordionSection>

              <AdminAccordionSection title="Advanced — proof &amp; watermark" defaultOpen={false}>
                  <p className="text-[11px] text-brand-medium mb-4 leading-relaxed">
                    <span className="font-semibold text-brand-dark">Watermark scope:</span> Settings are saved in product
                    meta and applied only when images are served through{" "}
                    <code className="text-[10px] bg-brand-lightest px-1">GET /api/products/preview</code> (watermarked WebP
                    for tAE-hosted hero/gallery and ShopProductImage previews). Direct Printful-hosted image URLs are
                    intentionally not watermarked—this is expected, not a bug. No broader watermark pipeline unless a future
                    project requires it.
                  </p>
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
              </AdminAccordionSection>

              <AdminAccordionSection title="Make Product Visible for Shoppers">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, active: !form.active })}
                    className={`w-5 h-5 border flex items-center justify-center transition-colors ${
                      form.active ? "bg-brand-dark border-brand-dark text-white" : "border-brand-light"
                    }`}
                  >
                    {form.active && <Check className="w-3 h-3" />}
                  </button>
                  <span className="text-sm text-brand-dark">Visible to Shoppers</span>
                </div>
              </AdminAccordionSection>
            </div>
            )}

            {productFormTab === "images" && (
              <div ref={setImagesTabMountNode} className="p-6 space-y-4">
                {!editId ? (
                  <div className="border border-dashed border-brand-light rounded-lg p-8 text-center space-y-4 bg-brand-lightest/30">
                    <p className="text-sm text-brand-darkest font-medium">Save the product first</p>
                    <p className="text-xs text-brand-medium max-w-md mx-auto leading-relaxed">
                      Product images are stored on the server for this listing. Enter a name and category on the
                      Details tab, then save once — after that you can upload, reorder, and set variant rules here.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setProductFormTab("details")}
                        className={BTN_SECONDARY}
                      >
                        Back to Details
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSave({ stayOpen: true, goToImagesTab: true })}
                        disabled={saving || !form.name.trim() || !form.categoryId}
                        className={BTN_PRIMARY}
                        title={!form.categoryId ? "Choose a category on the Details tab first" : undefined}
                      >
                        {saving ? "Saving..." : "Save product & open images"}
                      </button>
                    </div>
                  </div>
                ) : !imageEditProduct ? (
                  <div className="text-sm text-brand-medium py-8 text-center">Loading image manager…</div>
                ) : null}
              </div>
            )}

            <div className="px-6 py-4 border-t border-brand-light flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setProductFormTab("details");
                  setImageEditProduct(null);
                  setGalleryDraft([]);
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
                onClick={() => void handleSave()}
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
        const sortedGallery = [...galleryDraft].sort((a, b) => a.sortOrder - b.sortOrder);
        const ruleOpts = imageModalRuleOptions;
        const sourceBadgeClass = (s: ProductImageSource) =>
          s === "api"
            ? "border-violet-200 bg-violet-50 text-violet-900"
            : s === "variant"
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-slate-200 bg-slate-50 text-slate-800";
        const targetBadgeClass = (t: ReturnType<typeof imageEntryStorefrontSummary>["targetingBadge"]) =>
          t === "option-targeted"
            ? "border-sky-200 bg-sky-50 text-sky-900"
            : t === "api-import"
              ? "border-violet-100 bg-violet-50/50 text-violet-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-900";
        if (!(showForm && productFormTab === "images" && imagesTabMountNode)) return null;
        return createPortal(
          <div className="space-y-4">
            <p className="text-xs text-brand-medium pb-2 border-b border-brand-light/80">
              <span className="font-semibold text-brand-darkest">Product images</span>
              <span className="text-brand-medium"> — </span>
              {form.name.trim() || imageEditProduct.name}
            </p>
            {imgError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 flex items-center justify-between">
                {imgError}
                <button type="button" onClick={() => setImgError(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="space-y-6">
                <div className="border border-brand-light/80 rounded-lg p-4 bg-white/80 space-y-3">
                  <label className="block text-xs font-medium text-brand-dark/70 uppercase tracking-wider">
                    Product Media Library (storefront)
                  </label>
                  <p className="text-[10px] text-brand-medium leading-relaxed">
                    Optional: pick reusable shopper-facing images from the{" "}
                    <a
                      href="/b_d_admn_tae/catalog/product-media"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-dark underline"
                    >
                      Product Media Library
                    </a>
                    . When set, these are preferred over manual hero/gallery URLs on the storefront.
                  </p>
                  {(() => {
                    const libHeroThumb =
                      libHeroId &&
                      imageEditProduct.productImages?.find((r) => r.id === `libasset:${libHeroId}`)?.imageUrl;
                    return (
                      <div className="space-y-2">
                        <div className="text-[10px] font-semibold text-brand-dark">Library hero</div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="w-20 h-20 border border-brand-light bg-gray-50 overflow-hidden shrink-0">
                            {libHeroThumb ? (
                              <img src={libHeroThumb} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-brand-medium text-[10px] text-center px-1">
                                None
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={librarySaving}
                              onClick={() => void openLibraryPicker("hero")}
                              className="px-3 py-1.5 text-xs border border-brand-dark text-brand-dark hover:bg-brand-dark/10 disabled:opacity-50"
                            >
                              {libHeroId ? "Change" : "Choose from library"}
                            </button>
                            {libHeroId && (
                              <button
                                type="button"
                                disabled={librarySaving}
                                onClick={() => void persistLibraryAssignments(null, libGalleryIds)}
                                className="px-3 py-1.5 text-xs border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="space-y-2 pt-2 border-t border-brand-light/60">
                    <div className="text-[10px] font-semibold text-brand-dark">Library global gallery</div>
                    <div className="flex flex-wrap gap-2">
                      {libGalleryIds.map((gid) => {
                        const url = imageEditProduct.productImages?.find((r) => r.id === `libasset:${gid}`)?.imageUrl;
                        return (
                          <div
                            key={gid}
                            className="relative w-16 h-16 border border-brand-light bg-gray-50 shrink-0 group"
                          >
                            {url ? (
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-brand-medium p-0.5 break-all">
                                {gid.slice(0, 6)}…
                              </div>
                            )}
                            <button
                              type="button"
                              title="Remove from gallery"
                              disabled={librarySaving}
                              onClick={() => {
                                const next = libGalleryIds.filter((x) => x !== gid);
                                void persistLibraryAssignments(libHeroId, next);
                              }}
                              className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      disabled={librarySaving}
                      onClick={() => void openLibraryPicker("gallery")}
                      className="px-3 py-1.5 text-xs border border-brand-dark text-brand-dark hover:bg-brand-dark/10 disabled:opacity-50"
                    >
                      Add from library…
                    </button>
                  </div>
                  {librarySaving && (
                    <p className="text-[10px] text-brand-medium">Saving library assignments…</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-brand-dark/70 uppercase tracking-wider">
                      Image gallery ({sortedGallery.length}/30)
                    </label>
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border border-brand-dark text-brand-dark cursor-pointer hover:bg-brand-dark/10 transition-colors">
                      <Upload className="w-3 h-3" />
                      {galleryUploading ? "Uploading..." : "Add images"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleGalleryImagesUpload}
                        disabled={galleryUploading || sortedGallery.length >= 30}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-brand-medium mb-3">
                    Drag rows to reorder (handle beside the star). Star sets the storefront hero. Use <strong>General</strong> for
                    images that should always appear by default; use <strong>Variant</strong> with option rules to swap in
                    different photos when selections match; <strong>API</strong> marks synced/imported assets.
                  </p>

                  {sortedGallery.length === 0 ? (
                    <div className="border-2 border-dashed border-brand-light p-8 text-center text-sm text-brand-medium">
                      No images yet. Click &quot;Add images&quot; to upload. The starred image is the default hero.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedGallery.map((row, idx) => {
                        const summary = imageEntryStorefrontSummary(row, ruleOpts);
                        const pfVidListId = `gallery-pfvid-${row.id}`;
                        return (
                        <div
                          key={row.id}
                          draggable
                          onDragStart={() => setDragIdx(idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (dragIdx !== null && dragIdx !== idx) {
                              void handleGalleryRowReorder(dragIdx, idx);
                            }
                            setDragIdx(null);
                          }}
                          className={`flex flex-col sm:flex-row gap-3 p-3 border ${dragIdx === idx ? "border-blue-500 bg-blue-50/30" : "border-brand-light bg-brand-lightest/40"}`}
                        >
                          <div className="shrink-0 flex sm:flex-col items-center gap-2">
                            <div className="w-20 h-20 border border-brand-light bg-white overflow-hidden shrink-0">
                              <img
                                src={row.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                draggable={false}
                              />
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                title="Set as hero"
                                onClick={() => void handleSetHeroIndex(idx)}
                                className={`p-1.5 rounded border ${row.isHero ? "bg-amber-100 border-amber-400 text-amber-800" : "border-brand-light text-brand-medium hover:bg-white"}`}
                              >
                                <Star className={`w-3.5 h-3.5 ${row.isHero ? "fill-current" : ""}`} />
                              </button>
                              <span className="cursor-grab p-1.5 text-brand-medium" title="Drag to reorder">
                                <GripVertical className="w-4 h-4" />
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border ${sourceBadgeClass(row.sourceType)}`}
                              >
                                {row.sourceType === "variant"
                                  ? "Variant"
                                  : row.sourceType === "api"
                                    ? "API"
                                    : "General"}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 border rounded ${targetBadgeClass(summary.targetingBadge)}`}
                              >
                                {summary.targetingBadge === "option-targeted"
                                  ? "Option-specific"
                                  : summary.targetingBadge === "api-import"
                                    ? "Imported"
                                    : "Default gallery"}
                              </span>
                              {row.isHero && (
                                <span className="text-[10px] font-semibold text-amber-800">Hero</span>
                              )}
                              <label className="inline-flex items-center gap-1.5 text-[10px] text-brand-dark ml-auto">
                                <input
                                  type="checkbox"
                                  checked={row.isActive}
                                  onChange={(e) =>
                                    void handleGalleryFieldChange(idx, { isActive: e.target.checked })
                                  }
                                />
                                Active
                              </label>
                            </div>
                            <div className="rounded border border-brand-light bg-white/70 px-2.5 py-2 space-y-1">
                              <p className="text-[10px] font-semibold text-brand-dark uppercase tracking-wide">
                                Applies to
                              </p>
                              <p className="text-xs text-brand-darkest leading-snug">{summary.appliesTo}</p>
                              <p className="text-[10px] text-brand-medium leading-snug">{summary.displayHint}</p>
                            </div>
                            {row.sourceType === "general" && hasRestrictiveImageMetadata(row) && (
                              <p className="text-[10px] text-amber-900 bg-amber-50 border border-amber-100 rounded px-2 py-1.5 leading-snug">
                                Saved option fields exist but source is <strong>General</strong> — the storefront only applies
                                these rules when source is <strong>Variant</strong>. Change source to Variant to activate
                                targeting, or clear the fields.
                              </p>
                            )}
                            <input
                              type="text"
                              value={row.title}
                              onChange={(e) =>
                                setGalleryDraft((prev) => {
                                  const s = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
                                  return s.map((r, i) =>
                                    i === idx ? { ...r, title: e.target.value } : r
                                  );
                                })
                              }
                              onBlur={(e) => void handleGalleryFieldChange(idx, { title: e.target.value })}
                              placeholder="Image title"
                              className="w-full border border-brand-light px-2 py-1.5 text-xs bg-white"
                            />
                            <textarea
                              value={row.description}
                              onChange={(e) =>
                                setGalleryDraft((prev) => {
                                  const s = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
                                  return s.map((r, i) =>
                                    i === idx ? { ...r, description: e.target.value } : r
                                  );
                                })
                              }
                              onBlur={(e) =>
                                void handleGalleryFieldChange(idx, { description: e.target.value })
                              }
                              placeholder="Optional description / notes"
                              rows={2}
                              className="w-full border border-brand-light px-2 py-1.5 text-xs bg-white resize-y"
                            />
                            <div className="flex flex-wrap gap-2 items-center">
                              <label className="text-[10px] text-brand-medium">Source type</label>
                              <select
                                value={row.sourceType}
                                onChange={(e) =>
                                  void handleGalleryFieldChange(idx, {
                                    sourceType: e.target.value as ProductImageSource,
                                  })
                                }
                                className="border border-brand-light px-2 py-1 text-xs bg-white"
                              >
                                <option value="general">General — default gallery for all</option>
                                <option value="variant">Variant — optional option rules</option>
                                <option value="api">API — imported / synced</option>
                              </select>
                            </div>
                            {row.sourceType === "variant" && (
                              <div className="rounded border border-brand-light/90 bg-white/80 p-2.5 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-[10px] font-semibold text-brand-dark">
                                    Match storefront selection
                                  </p>
                                  <button
                                    type="button"
                                    className="text-[10px] text-brand-dark underline decoration-brand-light"
                                    onClick={() =>
                                      void handleGalleryFieldChange(idx, {
                                        variantKey: null,
                                        variantId: null,
                                        size: null,
                                        frame: null,
                                        frameColor: null,
                                        material: null,
                                        orientation: null,
                                        format: null,
                                      })
                                    }
                                  >
                                    Clear rules
                                  </button>
                                </div>
                                <p className="text-[10px] text-brand-medium">
                                  Choose values from this product&apos;s variant matrix where possible. Leave &quot;(Any)&quot;
                                  when that dimension should not constrain matching.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-brand-medium mb-0.5">Matrix row</label>
                                    <select
                                      value={row.variantKey || ""}
                                      onChange={(e) => {
                                        const id = e.target.value.trim() || null;
                                        if (!id) {
                                          void handleGalleryFieldChange(idx, { variantKey: null });
                                          return;
                                        }
                                        const mr = ruleOpts.matrixRows.find((m) => m.id === id);
                                        const patch: Partial<ProductImageEntry> = { variantKey: id };
                                        if (
                                          mr?.printfulVariantId != null &&
                                          Number.isFinite(Number(mr.printfulVariantId))
                                        ) {
                                          patch.variantId = String(Math.trunc(Number(mr.printfulVariantId)));
                                        }
                                        void handleGalleryFieldChange(idx, patch);
                                      }}
                                      className="w-full border border-brand-light px-2 py-1 text-[10px] bg-white"
                                    >
                                      <option value="">(Any matrix row)</option>
                                      {ruleOpts.matrixRows.map((m) => (
                                        <option key={m.id} value={m.id}>
                                          {m.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-brand-medium mb-0.5">
                                      Printful variant ID
                                    </label>
                                    <input
                                      type="text"
                                      value={row.variantId || ""}
                                      list={ruleOpts.printfulVariantIds.length ? pfVidListId : undefined}
                                      onChange={(e) =>
                                        setGalleryDraft((prev) => {
                                          const s = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
                                          return s.map((r, i) =>
                                            i === idx ? { ...r, variantId: e.target.value || null } : r
                                          );
                                        })
                                      }
                                      onBlur={(e) =>
                                        void handleGalleryFieldChange(idx, {
                                          variantId: e.target.value.trim() || null,
                                        })
                                      }
                                      placeholder="e.g. 4012"
                                      className="w-full border border-brand-light px-2 py-1 text-[10px] bg-white"
                                    />
                                    {ruleOpts.printfulVariantIds.length > 0 && (
                                      <datalist id={pfVidListId}>
                                        {ruleOpts.printfulVariantIds.map((v) => (
                                          <option key={v} value={v} />
                                        ))}
                                      </datalist>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-brand-medium mb-0.5">Size</label>
                                    {ruleOpts.sizes.length > 0 ? (
                                      <select
                                        value={row.size || ""}
                                        onChange={(e) =>
                                          void handleGalleryFieldChange(idx, {
                                            size: e.target.value.trim() || null,
                                          })
                                        }
                                        className="w-full border border-brand-light px-2 py-1 text-[10px] bg-white"
                                      >
                                        <option value="">(Any)</option>
                                        {ruleOpts.sizes.map((o) => (
                                          <option key={o} value={o}>
                                            {o}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type="text"
                                        value={row.size || ""}
                                        onChange={(e) =>
                                          setGalleryDraft((prev) => {
                                            const s = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
                                            return s.map((r, i) =>
                                              i === idx ? { ...r, size: e.target.value || null } : r
                                            );
                                          })
                                        }
                                        onBlur={(e) =>
                                          void handleGalleryFieldChange(idx, {
                                            size: e.target.value.trim() || null,
                                          })
                                        }
                                        placeholder="Size label"
                                        className="w-full border border-brand-light px-2 py-1 text-[10px] bg-white"
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-brand-medium mb-0.5">Material / paper</label>
                                    {ruleOpts.materials.length > 0 ? (
                                      <select
                                        value={row.material || ""}
                                        onChange={(e) =>
                                          void handleGalleryFieldChange(idx, {
                                            material: e.target.value.trim() || null,
                                          })
                                        }
                                        className="w-full border border-brand-light px-2 py-1 text-[10px] bg-white"
                                      >
                                        <option value="">(Any)</option>
                                        {ruleOpts.materials.map((o) => (
                                          <option key={o} value={o}>
                                            {o}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type="text"
                                        value={row.material || ""}
                                        onChange={(e) =>
                                          setGalleryDraft((prev) => {
                                            const s = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
                                            return s.map((r, i) =>
                                              i === idx ? { ...r, material: e.target.value || null } : r
                                            );
                                          })
                                        }
                                        onBlur={(e) =>
                                          void handleGalleryFieldChange(idx, {
                                            material: e.target.value.trim() || null,
                                          })
                                        }
                                        placeholder="Matches storefront material/paper"
                                        className="w-full border border-brand-light px-2 py-1 text-[10px] bg-white"
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-brand-medium mb-0.5">Frame / finish</label>
                                    {ruleOpts.frames.length > 0 ? (
                                      <select
                                        value={row.frame || ""}
                                        onChange={(e) =>
                                          void handleGalleryFieldChange(idx, {
                                            frame: e.target.value.trim() || null,
                                          })
                                        }
                                        className="w-full border border-brand-light px-2 py-1 text-[10px] bg-white"
                                      >
                                        <option value="">(Any)</option>
                                        {ruleOpts.frames.map((o) => (
                                          <option key={o} value={o}>
                                            {o}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type="text"
                                        value={row.frame || ""}
                                        onChange={(e) =>
                                          setGalleryDraft((prev) => {
                                            const s = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
                                            return s.map((r, i) =>
                                              i === idx ? { ...r, frame: e.target.value || null } : r
                                            );
                                          })
                                        }
                                        onBlur={(e) =>
                                          void handleGalleryFieldChange(idx, {
                                            frame: e.target.value.trim() || null,
                                          })
                                        }
                                        placeholder="Frame / envelope / finish"
                                        className="w-full border border-brand-light px-2 py-1 text-[10px] bg-white"
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-brand-medium mb-0.5">Frame color</label>
                                    {ruleOpts.frameColors.length > 0 ? (
                                      <select
                                        value={row.frameColor || ""}
                                        onChange={(e) =>
                                          void handleGalleryFieldChange(idx, {
                                            frameColor: e.target.value.trim() || null,
                                          })
                                        }
                                        className="w-full border border-brand-light px-2 py-1 text-[10px] bg-white"
                                      >
                                        <option value="">(Any)</option>
                                        {ruleOpts.frameColors.map((o) => (
                                          <option key={o} value={o}>
                                            {o}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type="text"
                                        value={row.frameColor || ""}
                                        onChange={(e) =>
                                          setGalleryDraft((prev) => {
                                            const s = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
                                            return s.map((r, i) =>
                                              i === idx ? { ...r, frameColor: e.target.value || null } : r
                                            );
                                          })
                                        }
                                        onBlur={(e) =>
                                          void handleGalleryFieldChange(idx, {
                                            frameColor: e.target.value.trim() || null,
                                          })
                                        }
                                        placeholder="Frame color"
                                        className="w-full border border-brand-light px-2 py-1 text-[10px] bg-white"
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-brand-medium mb-0.5">Orientation</label>
                                    <select
                                      value={row.orientation || ""}
                                      onChange={(e) =>
                                        void handleGalleryFieldChange(idx, {
                                          orientation: e.target.value.trim() || null,
                                        })
                                      }
                                      className="w-full border border-brand-light px-2 py-1 text-[10px] bg-white"
                                    >
                                      <option value="">(Any)</option>
                                      <option value="Portrait">Portrait</option>
                                      <option value="Landscape">Landscape</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-brand-medium mb-0.5">Format</label>
                                    {ruleOpts.formats.length > 0 ? (
                                      <select
                                        value={row.format || ""}
                                        onChange={(e) =>
                                          void handleGalleryFieldChange(idx, {
                                            format: e.target.value.trim() || null,
                                          })
                                        }
                                        className="w-full border border-brand-light px-2 py-1 text-[10px] bg-white"
                                      >
                                        <option value="">(Any)</option>
                                        {ruleOpts.formats.map((o) => (
                                          <option key={o} value={o}>
                                            {o}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type="text"
                                        value={row.format || ""}
                                        onChange={(e) =>
                                          setGalleryDraft((prev) => {
                                            const s = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
                                            return s.map((r, i) =>
                                              i === idx ? { ...r, format: e.target.value || null } : r
                                            );
                                          })
                                        }
                                        onBlur={(e) =>
                                          void handleGalleryFieldChange(idx, {
                                            format: e.target.value.trim() || null,
                                          })
                                        }
                                        placeholder="e.g. flat, bifold"
                                        className="w-full border border-brand-light px-2 py-1 text-[10px] bg-white"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => void handleRemoveGalleryRow(idx)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Remove image
                              </button>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {libraryPicker && (
                  <div
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => {
                      if (!libraryPickerLoading && !librarySaving) setLibraryPicker(null);
                    }}
                  >
                    <div
                      className="bg-white max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col border border-brand-light shadow-lg rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 py-2 border-b border-brand-light flex justify-between items-center">
                        <span className="text-sm font-medium text-brand-dark">
                          {libraryPicker === "hero"
                            ? "Choose library hero"
                            : "Add library gallery images"}
                        </span>
                        <button
                          type="button"
                          onClick={() => !libraryPickerLoading && !librarySaving && setLibraryPicker(null)}
                          className="text-brand-medium hover:text-brand-dark"
                          aria-label="Close"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-3 overflow-y-auto flex-1 min-h-0">
                        {libraryPickerLoading ? (
                          <p className="text-sm text-brand-medium">Loading…</p>
                        ) : libraryAssets.length === 0 ? (
                          <p className="text-sm text-brand-medium">No assets in library yet.</p>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {libraryAssets.map((a) => {
                              const selected = galleryLibSelection.has(a.id);
                              return (
                                <button
                                  key={a.id}
                                  type="button"
                                  disabled={librarySaving}
                                  onClick={() => {
                                    if (libraryPicker === "hero") {
                                      void persistLibraryAssignments(a.id, libGalleryIds);
                                      return;
                                    }
                                    setGalleryLibSelection((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(a.id)) next.delete(a.id);
                                      else next.add(a.id);
                                      return next;
                                    });
                                  }}
                                  className={`border rounded overflow-hidden text-left ${
                                    libraryPicker === "gallery" && selected
                                      ? "ring-2 ring-brand-dark"
                                      : "border-brand-light"
                                  } disabled:opacity-50`}
                                >
                                  <img
                                    src={a.imageUrl}
                                    alt=""
                                    className="w-full aspect-square object-cover"
                                  />
                                  <div className="p-1 text-[9px] text-brand-dark truncate">
                                    {a.title || a.originalFilename || a.id}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {libraryPicker === "gallery" && (
                        <div className="px-3 py-2 border-t border-brand-light flex justify-end gap-2">
                          <button
                            type="button"
                            className={BTN_SUBTLE}
                            onClick={() => !librarySaving && setLibraryPicker(null)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={librarySaving || galleryLibSelection.size === 0}
                            className={BTN_PRIMARY}
                            onClick={() => {
                              const add = [...galleryLibSelection];
                              const merged = [...libGalleryIds];
                              for (const id of add) {
                                if (!merged.includes(id)) merged.push(id);
                              }
                              void persistLibraryAssignments(libHeroId, merged);
                            }}
                          >
                            Add selected
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>,
          imagesTabMountNode
        );
      })()}
    </div>
  );
}
