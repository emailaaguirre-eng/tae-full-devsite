export interface ProductWatermarkTransform {
  x: number; // relative [0..1]
  y: number; // relative [0..1]
  scale: number; // relative to min(width,height)
  rotation: number; // degrees
}

export interface ProductWatermarkSettings {
  enabled: boolean;
  text: string;
  color: string;
  opacity: number; // [0.03..0.30]
  transform: ProductWatermarkTransform;
}

/** Admin-picked Printful catalog mockup URLs for a variant matrix row (order = PDP gallery order). */
export interface ProductVariantPrintfulPick {
  url: string;
  /** Human-readable label (e.g. Front, Back); shown in admin only. */
  label?: string;
}

export interface ProductVariantOption {
  id: string;
  /** Stationery: flat vs bifold Printful family (row-level, variantMatrix JSON). */
  format?: "flat" | "bifold" | string;
  material?: string;
  size?: string;
  frame?: string;
  printfulProductId?: number;
  printfulVariantId?: number;
  printfulPrintfileId?: number;
  printfulBasePrice?: number;
  taeAddOnFee?: number;
  artistRoyalty?: number;
  image?: string;
  printWidth?: number;
  printHeight?: number;
  printDpi?: number;
  active?: boolean;
  /** PDP: shop vs Printful image sources (optional; see admin catalog product form). */
  galleryMode?: "product" | "printful" | "both";
  /**
   * Ordered Printful catalog images for this row. When set, PDP uses these (via watermarked previews) before
   * generic matrix `image` / format-matched URLs. Omitted = legacy galleryMode + single `image` behavior.
   */
  selectedPrintfulImages?: ProductVariantPrintfulPick[];
}

export interface ProductMeta {
  proofTerms?: string;
  watermark?: ProductWatermarkSettings;
  requiresQrCode?: boolean;
  customizable?: boolean;
  /** Catalog semantic type: art-print, greeting-card, canvas-print, etc. (stored in printfulDataJson) */
  productType?: string;
  artistSlug?: string;
  coCreatorSlug?: string;
  familyKey?: string;
  /** Placement / merchandising tags (stored in printfulDataJson). */
  tags?: string[];
  variantMatrix?: ProductVariantOption[];
  pricing?: {
    marginTarget?: number;
    artistRoyalty?: number;
    lastPrintfulSyncAt?: string | null;
  };
}

export const DEFAULT_WATERMARK: ProductWatermarkSettings = {
  enabled: false,
  text: "tAE",
  color: "#ffffff",
  opacity: 0.12,
  transform: {
    x: 0.5,
    y: 0.5,
    scale: 0.12,
    rotation: -18,
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeHexColor(input: string): string {
  const raw = (input || "").trim();
  if (!raw) return "#ffffff";
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  const short = /^#[0-9a-fA-F]{3}$/.test(withHash);
  const full = /^#[0-9a-fA-F]{6}$/.test(withHash);
  if (full) return withHash.toLowerCase();
  if (short) {
    const chars = withHash.slice(1).split("");
    return `#${chars.map((c) => `${c}${c}`).join("")}`.toLowerCase();
  }
  return "#ffffff";
}

export function parseProductMeta(raw: string | null | undefined): ProductMeta {
  if (raw == null || raw === "") return {};
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as ProductMeta;
  }
  try {
    const parsed = JSON.parse(String(raw));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function parseWatermarkSettings(raw: string | null | undefined): ProductWatermarkSettings {
  const meta = parseProductMeta(raw);
  const input = (meta?.watermark || {}) as Partial<ProductWatermarkSettings> & {
    transform?: Partial<ProductWatermarkTransform>;
  };
  const transform: Partial<ProductWatermarkTransform> = input.transform || {};
  return {
    enabled: !!input.enabled,
    text: typeof input.text === "string" && input.text.trim() ? input.text.trim() : DEFAULT_WATERMARK.text,
    color: normalizeHexColor(typeof input.color === "string" ? input.color : DEFAULT_WATERMARK.color),
    opacity: clamp(
      typeof input.opacity === "number" ? input.opacity : DEFAULT_WATERMARK.opacity,
      0.03,
      0.3
    ),
    transform: {
      x: clamp(typeof transform.x === "number" ? transform.x : DEFAULT_WATERMARK.transform.x, 0, 1),
      y: clamp(typeof transform.y === "number" ? transform.y : DEFAULT_WATERMARK.transform.y, 0, 1),
      scale: clamp(typeof transform.scale === "number" ? transform.scale : DEFAULT_WATERMARK.transform.scale, 0.05, 0.5),
      rotation: clamp(typeof transform.rotation === "number" ? transform.rotation : DEFAULT_WATERMARK.transform.rotation, -180, 180),
    },
  };
}

export function mergeProductMeta(
  raw: string | null | undefined,
  updates: Partial<ProductMeta>
): string {
  const current = parseProductMeta(raw);
  const next = { ...current, ...updates };
  return JSON.stringify(next);
}

export function parseRequiresQrCode(
  raw: string | null | undefined
): boolean | undefined {
  const meta = parseProductMeta(raw);
  return typeof meta.requiresQrCode === "boolean" ? meta.requiresQrCode : undefined;
}

export function parseCustomizable(
  raw: string | null | undefined
): boolean | undefined {
  const meta = parseProductMeta(raw);
  return typeof meta.customizable === "boolean" ? meta.customizable : undefined;
}

/** Semantic product type from meta; default art-print for legacy rows without productType. */
export function parseSemanticProductType(raw: string | null | undefined): string {
  const meta = parseProductMeta(raw);
  const pt = meta.productType;
  if (typeof pt === "string" && pt.trim()) return pt.trim();
  return "art-print";
}

export function parseArtistSlug(
  raw: string | null | undefined
): string | undefined {
  const meta = parseProductMeta(raw);
  return typeof meta.artistSlug === "string" && meta.artistSlug.trim()
    ? meta.artistSlug.trim()
    : undefined;
}

export function parseCoCreatorSlug(
  raw: string | null | undefined
): string | undefined {
  const meta = parseProductMeta(raw);
  return typeof meta.coCreatorSlug === "string" && meta.coCreatorSlug.trim()
    ? meta.coCreatorSlug.trim()
    : undefined;
}

/** Normalized tag strings from product meta (trimmed, order preserved). */
export function parseProductTags(raw: string | null | undefined): string[] {
  const meta = parseProductMeta(raw);
  const t = meta.tags;
  if (!Array.isArray(t)) return [];
  return t
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Case-insensitive match: product meta `tags` includes `tag`. Empty `tag` means no filter. */
export function productMetaHasTag(
  raw: string | null | undefined,
  tag: string
): boolean {
  const want = tag.trim().toLowerCase();
  if (!want) return true;
  const tags = parseProductTags(raw).map((s) => s.toLowerCase());
  return tags.includes(want);
}

export function parseFamilyKey(
  raw: string | null | undefined
): string | undefined {
  const meta = parseProductMeta(raw);
  return typeof meta.familyKey === "string" && meta.familyKey.trim()
    ? meta.familyKey.trim()
    : undefined;
}

export function parseVariantMatrix(
  raw: string | null | undefined
): ProductVariantOption[] {
  const meta = parseProductMeta(raw);
  if (!Array.isArray(meta.variantMatrix)) return [];

  return meta.variantMatrix
    .filter((item): item is ProductVariantOption => {
      return !!item && typeof item === "object" && typeof item.id === "string" && item.id.trim().length > 0;
    })
    .map((item) => ({
      ...item,
      id: item.id.trim(),
    }));
}

/**
 * Printful variant ID used by the studio and print-specs lookups.
 * Matches buildSpecFromApiProduct: column wins, then matrix row for URL-selected variant, else first active matrix row.
 */
export function resolvePrintfulVariantIdForStudioAndPrintSpecs(
  productInput: {
    printfulVariantId?: number | null;
    printfulDataJson?: string | null;
    storefrontMeta?: unknown;
  },
  selectedPrintfulVariantIdFromUrl: number | null | undefined
): number | null {
  const direct = Math.trunc(Number(productInput?.printfulVariantId));
  if (Number.isFinite(direct) && direct > 0) return direct;

  const metaStr =
    (typeof productInput?.printfulDataJson === "string" && productInput.printfulDataJson.trim()
      ? productInput.printfulDataJson
      : null) ??
    (productInput?.storefrontMeta !== undefined && productInput.storefrontMeta !== null
      ? JSON.stringify(productInput.storefrontMeta)
      : null);

  const rows = parseVariantMatrix(metaStr);
  const selected = Math.trunc(Number(selectedPrintfulVariantIdFromUrl));
  if (Number.isFinite(selected) && selected > 0) {
    const matched = rows.find(
      (row) =>
        row?.active !== false &&
        Math.trunc(Number(row?.printfulVariantId)) === selected
    );
    if (matched) return Math.trunc(Number(matched.printfulVariantId));
  }
  const fallback = rows.find(
    (row) =>
      row?.active !== false &&
      Number.isFinite(Math.trunc(Number(row?.printfulVariantId))) &&
      Math.trunc(Number(row?.printfulVariantId)) > 0
  );
  return fallback ? Math.trunc(Number(fallback.printfulVariantId)) : null;
}

type PrintfulSnapshotMeta = ProductMeta & {
  product?: { id?: unknown };
  variant?: { id?: unknown };
};

/**
 * Resolve Printful catalog IDs for a shop row: columns first, then variantMatrix,
 * then legacy Printful snapshot (`product` / `variant` from seed-products shape).
 * Matches studio / orders logic so matrix-only parent products (e.g. slug greeting-card) work.
 */
export function resolveShopProductPrintfulIds(product: {
  printfulProductId?: number | null;
  printfulVariantId?: number | null;
  printfulDataJson?: string | null;
}): { printfulProductId: number | null; printfulVariantId: number | null } {
  const directPid = Math.trunc(Number(product?.printfulProductId));
  const directVid = Math.trunc(Number(product?.printfulVariantId));
  if (Number.isFinite(directPid) && directPid > 0) {
    return {
      printfulProductId: directPid,
      printfulVariantId: Number.isFinite(directVid) && directVid > 0 ? directVid : null,
    };
  }

  const rows = parseVariantMatrix(product?.printfulDataJson);
  const selectedVariantId =
    Number.isFinite(directVid) && directVid > 0 ? directVid : null;

  if (selectedVariantId != null) {
    const matchedRow = rows.find((row) => {
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
    if (matchedRow != null) {
      const pid = Math.trunc(Number(matchedRow.printfulProductId));
      const vid = Math.trunc(Number(matchedRow.printfulVariantId));
      return {
        printfulProductId: Number.isFinite(pid) && pid > 0 ? pid : null,
        printfulVariantId: Number.isFinite(vid) && vid > 0 ? vid : null,
      };
    }
  }

  const fallbackRow = rows.find((row) => {
    const rowProductId = Math.trunc(Number(row?.printfulProductId));
    return row?.active !== false && Number.isFinite(rowProductId) && rowProductId > 0;
  });
  if (fallbackRow != null) {
    const pid = Math.trunc(Number(fallbackRow.printfulProductId));
    const vid = Math.trunc(Number(fallbackRow.printfulVariantId));
    return {
      printfulProductId: Number.isFinite(pid) && pid > 0 ? pid : null,
      printfulVariantId: Number.isFinite(vid) && vid > 0 ? vid : null,
    };
  }

  const meta = parseProductMeta(product?.printfulDataJson) as PrintfulSnapshotMeta;
  const snapPid = Math.trunc(Number(meta?.product?.id));
  const snapVid = Math.trunc(Number(meta?.variant?.id));
  if (Number.isFinite(snapPid) && snapPid > 0) {
    return {
      printfulProductId: snapPid,
      printfulVariantId: Number.isFinite(snapVid) && snapVid > 0 ? snapVid : null,
    };
  }

  return { printfulProductId: null, printfulVariantId: null };
}

export function buildProductPreviewUrl(
  productId: string,
  kind: "hero" | "gallery",
  index?: number
): string {
  const params = new URLSearchParams({
    productId,
    kind,
  });
  if (typeof index === "number") params.set("index", String(index));
  return `/api/products/preview?${params.toString()}`;
}

/** Watermarked preview for a row in ShopProductImage (see /api/products/preview?imageId=). */
export function buildShopProductImagePreviewUrl(productId: string, imageId: string): string {
  const params = new URLSearchParams({ productId, imageId });
  return `/api/products/preview?${params.toString()}`;
}

/** Preview for a variantMatrix row image (see /api/products/preview?matrixRowId=). */
export function buildMatrixRowPreviewUrl(productId: string, matrixRowId: string): string {
  const params = new URLSearchParams({ productId, matrixRowId });
  return `/api/products/preview?${params.toString()}`;
}

/** Watermarked preview for `variantMatrix[].selectedPrintfulImages[slotIndex]` (see /api/products/preview?matrixRowId=&selectedSlot=). */
export function buildMatrixRowSelectedPreviewUrl(
  productId: string,
  matrixRowId: string,
  slotIndex: number
): string {
  const params = new URLSearchParams({
    productId,
    matrixRowId,
    selectedSlot: String(slotIndex),
  });
  return `/api/products/preview?${params.toString()}`;
}

/** Resolve raw source URL for a matrix row's selected Printful slot (for /api/products/preview). */
export function findMatrixRowSelectedImageUrl(
  printfulDataJson: string | null | undefined,
  matrixRowId: string,
  slotIndex: number
): string | null {
  const rows = parseVariantMatrix(printfulDataJson);
  const row = rows.find((r) => String(r.id).trim() === String(matrixRowId).trim());
  const list = row?.selectedPrintfulImages;
  if (!Array.isArray(list) || slotIndex < 0 || slotIndex >= list.length) return null;
  const pick = list[slotIndex];
  if (!pick || typeof pick !== "object") return null;
  const url = typeof (pick as ProductVariantPrintfulPick).url === "string"
    ? (pick as ProductVariantPrintfulPick).url.trim()
    : "";
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return url;
}

/** First watermarked preview URL for matrix row hero (selected picks, else legacy `image`). */
export function matrixRowPrimaryPreviewUrl(
  productId: string,
  row: ProductVariantOption
): string | null {
  const picks = row.selectedPrintfulImages;
  if (Array.isArray(picks) && picks.length > 0) {
    for (let i = 0; i < picks.length; i++) {
      const u = typeof picks[i]?.url === "string" ? picks[i].url.trim() : "";
      if (u && /^https?:\/\//i.test(u)) {
        return buildMatrixRowSelectedPreviewUrl(productId, row.id, i);
      }
    }
  }
  const rowImg = row.image ? String(row.image).trim() : "";
  if (rowImg) return buildMatrixRowPreviewUrl(productId, row.id);
  return null;
}

export const STOREFRONT_META_IMAGE_LIST_KEYS = [
  "variantMatrix",
  "variantImages",
  "siblingVariants",
] as const;

export type StorefrontMetaImageListKey = (typeof STOREFRONT_META_IMAGE_LIST_KEYS)[number];

/** Preview for a storefrontMeta row image (see /api/products/preview?metaList=&metaRowId=). */
export function buildStorefrontMetaImagePreviewUrl(
  productId: string,
  metaList: StorefrontMetaImageListKey,
  rowId: string
): string {
  const params = new URLSearchParams({
    productId,
    metaList,
    metaRowId: rowId.trim(),
  });
  return `/api/products/preview?${params.toString()}`;
}
