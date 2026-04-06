import { parseProductMeta, parseVariantMatrix } from "@/lib/product-watermark";

export interface ProductPricingSettings {
  marginTarget: number; // decimal, e.g. 0.45
  artistRoyalty: number; // flat currency amount
  variationUpcharge: number; // option/variant surcharge on top of base
  taePrice: number; // additional theAE amount
  salePrice: number | null; // explicit override when on sale
  discountPercent: number; // percent discount to apply when salePrice absent
  lastPrintfulSyncAt: string | null;
}

export const DEFAULT_PRICING: ProductPricingSettings = {
  marginTarget: 0.45,
  artistRoyalty: 0,
  variationUpcharge: 0,
  taePrice: 0,
  salePrice: null,
  discountPercent: 0,
  lastPrintfulSyncAt: null,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function parsePricingSettings(raw: string | null | undefined): ProductPricingSettings {
  const meta = parseProductMeta(raw);
  const input = (meta?.pricing || {}) as Partial<ProductPricingSettings>;
  return {
    marginTarget: clamp(
      typeof input.marginTarget === "number" ? input.marginTarget : DEFAULT_PRICING.marginTarget,
      0,
      0.9
    ),
    artistRoyalty: clamp(
      typeof input.artistRoyalty === "number" ? input.artistRoyalty : DEFAULT_PRICING.artistRoyalty,
      0,
      100000
    ),
    variationUpcharge: clamp(
      typeof input.variationUpcharge === "number"
        ? input.variationUpcharge
        : DEFAULT_PRICING.variationUpcharge,
      0,
      100000
    ),
    taePrice: clamp(
      typeof input.taePrice === "number" ? input.taePrice : DEFAULT_PRICING.taePrice,
      0,
      100000
    ),
    salePrice:
      typeof input.salePrice === "number" && Number.isFinite(input.salePrice)
        ? clamp(input.salePrice, 0, 1000000)
        : null,
    discountPercent: clamp(
      typeof input.discountPercent === "number"
        ? input.discountPercent
        : DEFAULT_PRICING.discountPercent,
      0,
      100
    ),
    lastPrintfulSyncAt:
      typeof input.lastPrintfulSyncAt === "string" && input.lastPrintfulSyncAt
        ? input.lastPrintfulSyncAt
        : null,
  };
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function computeRetailPrice(input: {
  printfulBasePrice: unknown;
  taeAddOnFee?: unknown;
  artistRoyalty?: unknown;
}): number {
  return (
    toNumber(input.printfulBasePrice, 0) +
    toNumber(input.taeAddOnFee, 0) +
    toNumber(input.artistRoyalty, 0)
  );
}

/** DB / API product fields needed for variantMatrix row pricing (matches PDP variants route). */
export type ProductSourceForMatrixPricing = {
  printfulBasePrice: unknown;
  taeAddOnFee: unknown;
  printfulDataJson: string | null | undefined;
};

/** PDP sell override: finite number only; empty string is not an override. */
export function finiteSellOverridePrice(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string" && raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** First finite among row.printfulBasePrice, row.providerCost, then product.printfulBasePrice. */
export function effectiveMatrixRowPrintfulBase(
  rowAny: Record<string, unknown>,
  productPrintfulBase: unknown
): number {
  const candidates = [rowAny.printfulBasePrice, rowAny.providerCost];
  for (const v of candidates) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return toNumber(productPrintfulBase, 0);
}

/**
 * One matrix row’s shopper-facing base price (same formula as GET /api/products/[slug]/variants matrix branch).
 */
export function computeMatrixRowShopDisplay(
  row: unknown,
  product: ProductSourceForMatrixPricing
): {
  printfulBasePrice: number;
  basePrice: number;
  taeAddOnFee: number;
  artistRoyalty: number;
} {
  const rowAny = row as Record<string, unknown>;
  const pricingDefaults = parsePricingSettings(product.printfulDataJson);
  const printfulBasePrice = effectiveMatrixRowPrintfulBase(
    rowAny,
    product.printfulBasePrice
  );
  const taeAddOnFee = toNumber(rowAny.taeAddOnFee, toNumber(product.taeAddOnFee));
  const artistRoyalty = toNumber(rowAny.artistRoyalty, pricingDefaults.artistRoyalty);
  const variationUpcharge = toNumber(
    rowAny.variationUpcharge,
    pricingDefaults.variationUpcharge
  );
  const sellOverride = finiteSellOverridePrice(rowAny.sellPrice);
  const componentSum =
    printfulBasePrice + taeAddOnFee + artistRoyalty + variationUpcharge;
  const basePrice = sellOverride != null ? sellOverride : componentSum;
  return { printfulBasePrice, basePrice, taeAddOnFee, artistRoyalty };
}

/** Lowest shopper price among active variantMatrix rows; null if no usable matrix. */
export function minActiveVariantMatrixShopPrice(
  product: ProductSourceForMatrixPricing
): number | null {
  const matrix = parseVariantMatrix(product.printfulDataJson);
  const active = matrix.filter((r) => r.active !== false);
  if (active.length === 0) return null;
  return Math.min(
    ...active.map((row) => computeMatrixRowShopDisplay(row, product).basePrice)
  );
}
