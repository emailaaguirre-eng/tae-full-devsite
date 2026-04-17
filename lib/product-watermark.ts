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
  /** Optional production file for this variant; overrides product `artworkSourceUrl` when fulfilling. */
  productionArtworkUrl?: string | null;
  printWidth?: number;
  printHeight?: number;
  printDpi?: number;
  active?: boolean;
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
 * Printful artwork fallback path for non-customizable lines: active matrix row matching
 * `printfulVariantId` uses `productionArtworkUrl` when set; otherwise `artworkSourceUrl` on the product.
 */
export function resolveProductionArtworkSourcePath(
  product: {
    artworkSourceUrl?: string | null;
    printfulDataJson?: string | null;
  },
  printfulVariantId: unknown
): string {
  const vid = Math.trunc(Number(printfulVariantId));
  if (Number.isFinite(vid) && vid > 0) {
    const rows = parseVariantMatrix(product.printfulDataJson);
    const matched = rows.find(
      (row) =>
        row.active !== false && Math.trunc(Number(row.printfulVariantId)) === vid
    );
    const rowUrl =
      matched && typeof matched.productionArtworkUrl === "string"
        ? matched.productionArtworkUrl.trim()
        : "";
    if (rowUrl) return rowUrl;
  }
  return typeof product.artworkSourceUrl === "string" ? product.artworkSourceUrl.trim() : "";
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
