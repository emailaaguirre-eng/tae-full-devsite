import { parseProductMeta } from "@/lib/product-watermark";

export interface ProductPricingSettings {
  marginTarget: number; // decimal, e.g. 0.45
  artistRoyalty: number; // flat currency amount
  lastPrintfulSyncAt: string | null;
}

export const DEFAULT_PRICING: ProductPricingSettings = {
  marginTarget: 0.45,
  artistRoyalty: 0,
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
