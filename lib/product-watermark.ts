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

export interface ProductMeta {
  proofTerms?: string;
  watermark?: ProductWatermarkSettings;
  requiresQrCode?: boolean;
  customizable?: boolean;
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
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
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
