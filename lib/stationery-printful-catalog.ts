/**
 * Central config: stationery Printful product families by catalog productType + row format.
 * Edit IDs/labels here only — admin matrix UI reads from this module.
 */

export type StationeryFormat = "flat" | "bifold";

export type StationeryCatalogProductType =
  | "greeting-card"
  | "invitation"
  | "announcement";

export const STATIONERY_PRODUCT_TYPES = new Set<string>([
  "greeting-card",
  "invitation",
  "announcement",
]);

/** If row.format is missing, treat these Printful product IDs as bifold (legacy matrices). */
export const STATIONERY_LEGACY_BIFOLD_PRINTFUL_PRODUCT_IDS = new Set<number>([568]);

export interface StationeryPrintfulFamilyEntry {
  printfulProductId: number;
  label: string;
  /** True when the Printful ID should be verified or replaced later */
  provisional?: boolean;
}

export type StationeryPrintfulFamilyByFormat = Record<
  StationeryFormat,
  StationeryPrintfulFamilyEntry
>;

/**
 * Provider families keyed by semantic productType, then flat | bifold.
 */
export const STATIONERY_PRINTFUL_FAMILIES: Record<
  StationeryCatalogProductType,
  StationeryPrintfulFamilyByFormat
> = {
  "greeting-card": {
    flat: {
      printfulProductId: 433,
      label: "Flat card — Postcard catalog",
      provisional: true,
    },
    bifold: {
      printfulProductId: 568,
      label: "Folded greeting card",
      provisional: false,
    },
  },
  invitation: {
    flat: {
      printfulProductId: 433,
      label: "Standard postcard (flat)",
      provisional: true,
    },
    bifold: {
      printfulProductId: 568,
      label: "Folded card (bifold)",
      provisional: true,
    },
  },
  announcement: {
    flat: {
      printfulProductId: 433,
      label: "Standard postcard (flat)",
      provisional: true,
    },
    bifold: {
      printfulProductId: 568,
      label: "Folded card (bifold)",
      provisional: true,
    },
  },
};

/** Picker row for admin matrix (matches prior VariantCatalogPrintfulProduct shape). */
export interface StationeryPrintfulPickerProduct {
  id: number;
  label: string;
  format: StationeryFormat;
  provisional?: boolean;
}

export function isStationeryProductType(productType: string | null | undefined): boolean {
  return STATIONERY_PRODUCT_TYPES.has(productType || "");
}

export function getStationeryPrintfulProducts(
  productType: string | null | undefined
): StationeryPrintfulPickerProduct[] {
  const key = productType as StationeryCatalogProductType;
  const map = STATIONERY_PRINTFUL_FAMILIES[key];
  if (!map) return [];

  const out: StationeryPrintfulPickerProduct[] = [];
  for (const fmt of ["flat", "bifold"] as const) {
    const e = map[fmt];
    if (!e?.printfulProductId) continue;
    const suffix = e.provisional ? " (provisional ID)" : "";
    out.push({
      id: e.printfulProductId,
      label: `${e.label}${suffix}`,
      format: fmt,
      provisional: e.provisional,
    });
  }
  return out;
}

/** Effective row format for provider dropdown + legacy matrix rows without format. */
export function getRowStationeryFormat(row: {
  format?: string | null;
  printfulProductId?: number | null;
}): StationeryFormat {
  if (row.format === "bifold" || row.format === "flat") return row.format;
  const pid = row.printfulProductId;
  if (pid != null && STATIONERY_LEGACY_BIFOLD_PRINTFUL_PRODUCT_IDS.has(pid)) {
    return "bifold";
  }
  return "flat";
}
