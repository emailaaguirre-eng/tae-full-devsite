import { computeRetailPrice, parsePricingSettings } from "@/lib/product-pricing";

export interface PriceAdjustment {
  code: string;
  label: string;
  amount: number;
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function sanitizeQuantity(value: unknown): number {
  const n = Math.trunc(toNumber(value, 1));
  return n > 0 ? n : 1;
}

export function normalizePriceAdjustments(input: unknown): PriceAdjustment[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((row: any, index) => {
      const amount = toNumber(row?.amount, 0);
      if (!Number.isFinite(amount)) return null;
      const code =
        typeof row?.code === "string" && row.code.trim()
          ? row.code.trim()
          : `adj-${index + 1}`;
      const label =
        typeof row?.label === "string" && row.label.trim()
          ? row.label.trim()
          : code;
      return { code, label, amount };
    })
    .filter((row): row is PriceAdjustment => !!row);
}

export function sumPriceAdjustments(adjustments: PriceAdjustment[]): number {
  return roundCurrency(
    adjustments.reduce((total, item) => total + toNumber(item.amount, 0), 0)
  );
}

export function getBasePricingComponents(product: {
  printfulBasePrice: unknown;
  taeAddOnFee: unknown;
  printfulDataJson?: string | null;
}) {
  const pricing = parsePricingSettings(product.printfulDataJson);
  const printfulBasePrice = toNumber(product.printfulBasePrice, 0);
  const taeAddOnFee = toNumber(product.taeAddOnFee, 0);
  const artistRoyalty = toNumber(pricing.artistRoyalty, 0);
  const baseUnitPrice = roundCurrency(
    computeRetailPrice({ printfulBasePrice, taeAddOnFee, artistRoyalty })
  );

  return {
    printfulBasePrice,
    taeAddOnFee,
    artistRoyalty,
    baseUnitPrice,
  };
}

export function computeLinePricing(input: {
  baseUnitPrice: number;
  quantity: number;
  adjustments?: PriceAdjustment[];
}) {
  const quantity = sanitizeQuantity(input.quantity);
  const adjustments = input.adjustments || [];
  const adjustmentsTotal = sumPriceAdjustments(adjustments);
  const unitPrice = roundCurrency(input.baseUnitPrice + adjustmentsTotal);
  const lineTotal = roundCurrency(unitPrice * quantity);
  return {
    quantity,
    adjustmentsTotal,
    unitPrice,
    lineTotal,
  };
}

