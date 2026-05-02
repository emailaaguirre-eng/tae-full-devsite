"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import {
  ArtKeyTrademark,
  renderStringWithArtKeyTrademarks,
} from "@/components/RefinedTm";
import { AdminAccordionSection } from "@/components/admin/AdminAccordionSection";
import {
  getBestProductImages,
  getExactMatchProductImagePreviewUrls,
  isPrintfulApiSampleSourceRow,
  type StorefrontProductImage,
  type VariantImageMatchContext,
} from "@/lib/storefront-product-images";

function isBlockedPrintfulImageUrl(url: string | null | undefined): boolean {
  const value = String(url || "").trim();
  if (!value) return false;
  try {
    const parsed = new URL(value, "https://local.invalid");
    const host = parsed.hostname.toLowerCase();
    return (
      host.includes("printful") ||
      host.includes("printfulusercontent") ||
      host.includes("printful-upload")
    );
  } catch {
    return /printful/i.test(value);
  }
}

interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  /** Semantic catalog type from printfulDataJson (e.g. art-print, greeting-card) */
  productType?: string;
  description: string | null;
  heroImage: string | null;
  galleryImages: string[];
  basePrice: number;
  printfulBasePrice: number;
  taeAddOnFee: number;
  artistRoyalty?: number;
  sizeLabel: string | null;
  paperType: string | null;
  finishType: string | null;
  orientation: string | null;
  printProvider: string;
  printfulProductId: number | null;
  printfulVariantId: number | null;
  printWidth: number | null;
  printHeight: number | null;
  printDpi: number;
  requiresQrCode: boolean;
  customizable?: boolean;
  requiredPlacements: string | null;
  category: {
    id: string;
    slug: string;
    name: string;
    icon: string;
    description: string | null;
  } | null;
  printfulDataJson?: string | null;
  productImages?: StorefrontProductImage[];
}

interface VariantOption {
  id: string;
  slug: string;
  name: string;
  sizeLabel: string | null;
  paperType: string | null;
  finishType: string | null;
  orientation: string | null;
  heroImage: string | null;
  basePrice: number;
  printfulBasePrice?: number;
  taeAddOnFee?: number;
  artistRoyalty?: number;
  printfulVariantId: number | null;
  isCurrent: boolean;
  pfColor: string | null;
  pfColorCode: string | null;
  pfSize: string | null;
  pfName: string | null;
  inStock: boolean;
  printWidth?: number | null;
  printHeight?: number | null;
}

type VariantImageMeta = {
  id?: number | string | null;
  printfulVariantId?: number | string | null;
  image?: string | null;
  size?: string | null;
  material?: string | null;
  paperType?: string | null;
  frame?: string | null;
  frameColor?: string | null;
  color?: string | null;
  active?: boolean;
  /** High-res print file — must not be used as storefront preview when it equals `image`. */
  productionArtworkUrl?: string | null;
};

type ParsedVariantImageMeta = {
  variantMatrix: VariantImageMeta[];
  variantImages: VariantImageMeta[];
  siblingVariants: VariantImageMeta[];
};

function normDim(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function matrixRowStorefrontImage(row: VariantImageMeta, imageUrl: string | null | undefined): string | null {
  const img = (imageUrl || "").trim();
  if (!img) return null;
  const prod =
    typeof row.productionArtworkUrl === "string" ? row.productionArtworkUrl.trim() : "";
  if (prod && img === prod) return null;
  return img;
}

function matrixExactImageUrlsForVariant(
  parsed: ParsedVariantImageMeta,
  variant: VariantOption | null,
  printfulVariantId: number | null
): string[] {
  if (!variant && (!printfulVariantId || printfulVariantId <= 0)) return [];
  const urls: string[] = [];
  const push = (url: string | null, row?: VariantImageMeta) => {
    const safe = row ? matrixRowStorefrontImage(row, url) : (url || "").trim();
    if (!safe || urls.includes(safe)) return;
    urls.push(safe);
  };
  const rowMatchesSelectedVariant = (row: VariantImageMeta) => {
    if (
      variant?.id != null &&
      row?.id != null &&
      String(row.id) === String(variant.id)
    ) {
      return true;
    }
    if (
      printfulVariantId &&
      toVariantIdCandidates(row).includes(printfulVariantId)
    ) {
      return true;
    }
    return false;
  };

  for (const row of parsed.variantMatrix) {
    if (!isActiveRow(row)) continue;
    if (rowMatchesSelectedVariant(row)) push(String(row?.image || ""), row);
  }
  for (const row of parsed.variantImages) {
    if (!isActiveRow(row)) continue;
    if (rowMatchesSelectedVariant(row)) push(String(row?.image || ""), row);
  }
  for (const row of parsed.siblingVariants) {
    if (!isActiveRow(row)) continue;
    if (rowMatchesSelectedVariant(row)) push(String(row?.image || ""), row);
  }
  return urls;
}

function formatSpecificMatrixUrlsForVariant(
  parsed: ParsedVariantImageMeta,
  v: VariantOption | null
): string[] {
  if (!v) return [];
  const selectedSize = normDim(v.sizeLabel || v.pfSize);
  const selectedMaterial = normDim(v.paperType);
  const selectedFrame = normDim(v.finishType);
  const selectedColor = normDim(v.pfColor);
  const urls: string[] = [];
  const push = (url: string | null, row?: VariantImageMeta) => {
    const safe = row ? matrixRowStorefrontImage(row, url) : (url || "").trim();
    if (!safe || urls.includes(safe)) return;
    urls.push(safe);
  };

  for (const row of parsed.variantMatrix) {
    if (row?.active === false || !row?.image) continue;
    const rowSize = normDim(row?.size);
    const rowMaterial = normDim(row?.paperType || row?.material);
    const rowFrame = normDim(row?.frame);
    const rowColor = normDim(row?.frameColor || row?.color);

    const matchesSize = !selectedSize || !rowSize || rowSize === selectedSize;
    const matchesMaterial =
      !selectedMaterial || !rowMaterial || rowMaterial === selectedMaterial;
    const matchesFrame = !selectedFrame || !rowFrame || rowFrame === selectedFrame;
    const matchesColor = !selectedColor || !rowColor || rowColor === selectedColor;

    if (matchesSize && matchesMaterial && matchesFrame && matchesColor) {
      push(String(row.image), row);
    }
  }

  return urls;
}

function buildCustomerFacingDisplayUrls(args: {
  product: ProductDetail;
  ctx: VariantImageMatchContext;
  exactMatrixUrls: string[];
  formatSpecificUrls: string[];
  variantHero: string | null | undefined;
}): string[] {
  const { product, ctx, exactMatrixUrls, formatSpecificUrls, variantHero } = args;
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (u: string | null | undefined) => {
    const t = (u || "").trim();
    if (!t || isBlockedPrintfulImageUrl(t) || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };

  for (const u of getExactMatchProductImagePreviewUrls(product.productImages, ctx)) {
    push(u);
  }
  for (const u of exactMatrixUrls) push(u);
  for (const u of formatSpecificUrls) push(u);
  push(variantHero);

  if (out.length > 0) {
    return out;
  }

  const broader = getBestProductImages(
    product.productImages,
    ctx,
    product.heroImage,
    product.galleryImages || []
  );
  for (const u of broader) push(u);

  if (out.length > 0) {
    return out;
  }

  push(product.heroImage);
  for (const u of product.galleryImages || []) push(u);

  return out;
}

function toVariantIdCandidates(row: VariantImageMeta): number[] {
  const ids = [row?.id, row?.printfulVariantId]
    .map((value) => Math.trunc(Number(value)))
    .filter((n) => Number.isFinite(n) && n > 0);
  return [...new Set(ids)];
}

function isActiveRow(row: VariantImageMeta): boolean {
  return row?.active !== false;
}

function variantMatchContextFromOption(
  v: VariantOption | null,
  printfulVariantId: number | null
): VariantImageMatchContext {
  if (!v) {
    return {
      matrixRowId: null,
      printfulVariantId,
      sizeLabel: null,
      paperType: null,
      finishType: null,
      pfColor: null,
      pfSize: null,
      orientation: null,
    };
  }
  const n = Number(v.printfulVariantId);
  const pf =
    printfulVariantId != null && printfulVariantId > 0
      ? printfulVariantId
      : Number.isFinite(n) && n > 0
        ? Math.trunc(n)
        : null;
  return {
    matrixRowId: v.id,
    printfulVariantId: pf,
    sizeLabel: v.sizeLabel,
    paperType: v.paperType,
    finishType: v.finishType,
    pfColor: v.pfColor,
    pfSize: v.pfSize,
    orientation: v.orientation,
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [hoverVariant, setHoverVariant] = useState<VariantOption | null>(null);
  const [hasUserSelectedOption, setHasUserSelectedOption] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${slug}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.data);
        } else {
          setError(data.error || "Product not found");
        }
      } catch (err) {
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/products/${slug}/variants`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setVariants(data.data);
        }
      })
      .catch(() => {});
  }, [slug]);

  const variantRows: VariantOption[] = useMemo(() => {
    if (variants.length > 0) return variants;
    if (!product) return [];
    return [
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        sizeLabel: product.sizeLabel,
        paperType: product.paperType,
        finishType: product.finishType,
        orientation: product.orientation,
        heroImage: product.heroImage,
        basePrice: product.basePrice,
        printfulVariantId: product.printfulVariantId,
        isCurrent: true,
        pfColor: null,
        pfColorCode: null,
        pfSize: null,
        pfName: null,
        inStock: true,
        printWidth: product.printWidth,
        printHeight: product.printHeight,
      },
    ];
  }, [product, variants]);

  useEffect(() => {
    setSelectedVariantId((prev) => {
      if (prev && variantRows.some((v) => v.id === prev)) return prev;
      return variantRows.find((v) => v.isCurrent)?.id || variantRows[0]?.id || null;
    });
  }, [variantRows]);

  const currentVariant = useMemo(() => {
    if (selectedVariantId) {
      const selected = variantRows.find((v) => v.id === selectedVariantId);
      if (selected) return selected;
    }
    return variantRows.find((v) => v.isCurrent) || variantRows[0] || null;
  }, [variantRows, selectedVariantId]);

  const normalizeValue = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  const parsedImageMeta = useMemo((): ParsedVariantImageMeta => {
    try {
      const rawMeta = product?.printfulDataJson;
      const parsed =
        typeof rawMeta === "string"
          ? JSON.parse(rawMeta || "{}")
          : rawMeta && typeof rawMeta === "object"
          ? rawMeta
          : {};
      return {
        variantMatrix: Array.isArray(parsed?.variantMatrix)
          ? (parsed.variantMatrix as VariantImageMeta[])
          : [],
        variantImages: [],
        siblingVariants: [],
      };
    } catch {
      return { variantMatrix: [], variantImages: [], siblingVariants: [] };
    }
  }, [product?.printfulDataJson]);

  const selectedPrintfulVariantId = useMemo(() => {
    const n = Number(currentVariant?.printfulVariantId);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
  }, [currentVariant?.printfulVariantId]);

  const variantMatchCtx = useMemo(
    () => variantMatchContextFromOption(currentVariant, selectedPrintfulVariantId),
    [currentVariant, selectedPrintfulVariantId]
  );

  const hoverCustomerFacingUrls = useMemo(() => {
    if (!product || !hoverVariant) return null;
    const hVid =
      Number.isFinite(Number(hoverVariant.printfulVariantId)) && Number(hoverVariant.printfulVariantId) > 0
        ? Math.trunc(Number(hoverVariant.printfulVariantId))
        : null;
    const hCtx = variantMatchContextFromOption(hoverVariant, hVid);
    const exactMat = matrixExactImageUrlsForVariant(parsedImageMeta, hoverVariant, hVid);
    const fmt = formatSpecificMatrixUrlsForVariant(parsedImageMeta, hoverVariant);
    const urls = buildCustomerFacingDisplayUrls({
      product,
      ctx: hCtx,
      exactMatrixUrls: exactMat,
      formatSpecificUrls: fmt,
      variantHero: hoverVariant.heroImage,
    });
    return urls.length > 0 ? urls : null;
  }, [product, hoverVariant, parsedImageMeta]);

  const exactVariantImages = useMemo(
    () =>
      matrixExactImageUrlsForVariant(
        parsedImageMeta,
        currentVariant,
        selectedPrintfulVariantId
      ),
    [parsedImageMeta, selectedPrintfulVariantId, currentVariant]
  );

  const formatSpecificImages = useMemo(
    () => formatSpecificMatrixUrlsForVariant(parsedImageMeta, currentVariant),
    [
      currentVariant,
      parsedImageMeta.variantMatrix,
    ]
  );

  const displayImages = useMemo(() => {
    if (!product) return [];
    if (hasUserSelectedOption) {
      return buildCustomerFacingDisplayUrls({
        product,
        ctx: variantMatchCtx,
        exactMatrixUrls: exactVariantImages,
        formatSpecificUrls: formatSpecificImages,
        variantHero: currentVariant?.heroImage,
      });
    }
    const activeRows = (product.productImages || []).filter((row) => {
      if (row.isActive === false || isPrintfulApiSampleSourceRow(row)) return false;
      return !isBlockedPrintfulImageUrl(row.previewUrl);
    });

    const generalRows = activeRows.filter((row) => {
      const st = String(row.sourceType || "general").trim().toLowerCase();
      const id = String(row.id || "");
      return st === "general" || id.startsWith("libasset:");
    });

    const generalHero = generalRows.find((row) => row.isHero) || generalRows[0] || null;
    const fromGeneral = [
      ...(generalHero?.previewUrl ? [generalHero.previewUrl] : []),
      ...generalRows
        .filter((row) => !generalHero || row.id !== generalHero.id)
        .map((row) => row.previewUrl)
        .filter((url): url is string => !!url && url !== generalHero?.previewUrl),
    ];

    if (fromGeneral.length > 0) return fromGeneral;

    return [
      ...(product.heroImage && !isBlockedPrintfulImageUrl(product.heroImage) ? [product.heroImage] : []),
      ...((product.galleryImages || []).filter(
        (url) => !!url && url !== product.heroImage && !isBlockedPrintfulImageUrl(url)
      )),
    ];
  }, [
    hasUserSelectedOption,
    variantMatchCtx,
    product,
    exactVariantImages,
    formatSpecificImages,
    currentVariant?.heroImage,
  ]);

  const defaultCatalogImages = useMemo(() => {
    const activeRows = (product?.productImages || []).filter((row) => {
      if (row.isActive === false || isPrintfulApiSampleSourceRow(row)) return false;
      return !isBlockedPrintfulImageUrl(row.previewUrl);
    });

    const generalRows = activeRows.filter((row) => {
      const st = String(row.sourceType || "general").trim().toLowerCase();
      const id = String(row.id || "");
      return st === "general" || id.startsWith("libasset:");
    });

    const generalHero = generalRows.find((row) => row.isHero) || generalRows[0] || null;
    const fromGeneral = [
      ...(generalHero?.previewUrl ? [generalHero.previewUrl] : []),
      ...generalRows
        .filter((row) => !generalHero || row.id !== generalHero.id)
        .map((row) => row.previewUrl)
        .filter((url): url is string => !!url && url !== generalHero?.previewUrl),
    ];

    if (fromGeneral.length > 0) return fromGeneral;

    return [
      ...(product?.heroImage && !isBlockedPrintfulImageUrl(product.heroImage) ? [product.heroImage] : []),
      ...((product?.galleryImages || []).filter(
        (url) => !!url && url !== product?.heroImage && !isBlockedPrintfulImageUrl(url)
      )),
    ];
  }, [product]);

  const initialHeroPreview = defaultCatalogImages[0] || null;

  useEffect(() => {
    setHasUserSelectedOption(false);
  }, [slug]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [currentVariant?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark" />
          <p className="mt-4 text-brand-darkest">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-normal text-brand-darkest mb-4">
            Product Not Found
          </h1>
          <p className="text-brand-darkest/60 mb-6">{error}</p>
          <Link
            href="/shop"
            className="bg-brand-dark text-white px-6 py-3 rounded-full font-semibold hover:bg-brand-darkest transition-colors"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const canCustomize = product.customizable !== false;
  const isGreetingCard = product.productType === "greeting-card";

  const getSizeLabel = (v: VariantOption) =>
    v.sizeLabel ||
    v.pfSize ||
    (v.printWidth && v.printHeight
      ? `${Math.round((v.printWidth / (product?.printDpi || 300)) * 100) / 100}" x ${Math.round((v.printHeight / (product?.printDpi || 300)) * 100) / 100}"`
      : "Standard");
  const getMaterialLabel = (v: VariantOption) => v.paperType || "Standard Material";
  const getFrameLabel = (v: VariantOption) => v.finishType || "No Frame";
  const getOrientationLabel = (v: VariantOption) =>
    v.orientation ? `${v.orientation.charAt(0).toUpperCase()}${v.orientation.slice(1)}` : "Default";
  const formatPrice = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  };
  const pickVariantForOptionGroup = (
    list: VariantOption[],
    base: VariantOption | null,
    contextDimension: "size" | "material" | "frame" | "orientation" | "color"
  ): VariantOption => {
    if (list.length === 0) {
      return base as VariantOption;
    }
    if (!base) {
      return list[0];
    }
    const colorKey = (x: VariantOption) =>
      (x.pfColorCode || x.pfColor || "").trim().toLowerCase();
    const matchesContext = (v: VariantOption) => {
      if (contextDimension !== "size" && getSizeLabel(v) !== getSizeLabel(base)) {
        return false;
      }
      if (contextDimension !== "material" && getMaterialLabel(v) !== getMaterialLabel(base)) {
        return false;
      }
      if (contextDimension !== "frame" && getFrameLabel(v) !== getFrameLabel(base)) {
        return false;
      }
      if (
        contextDimension !== "orientation" &&
        getOrientationLabel(v) !== getOrientationLabel(base)
      ) {
        return false;
      }
      if (contextDimension !== "color") {
        const a = colorKey(v);
        const b = colorKey(base);
        if (a || b) {
          if (a !== b) return false;
        }
      }
      return true;
    };
    const pool = list.filter(matchesContext);
    if (pool.length > 0) {
      return pool.find((v) => v.inStock) ?? pool[0];
    }
    const scored = [...list].sort((a, b) => {
      const score = (x: VariantOption) => {
        let s = x.inStock ? 10 : 0;
        if (getSizeLabel(x) === getSizeLabel(base)) s += 2;
        if (getMaterialLabel(x) === getMaterialLabel(base)) s += 2;
        if (getFrameLabel(x) === getFrameLabel(base)) s += 2;
        if (getOrientationLabel(x) === getOrientationLabel(base)) s += 1;
        return s;
      };
      return score(b) - score(a);
    });
    return scored[0];
  };
  const renderOptionPrice = (variant: VariantOption) => {
    if (!variant.inStock) return null;
    const currentPrice = Number(currentVariant?.basePrice ?? product.basePrice);
    const optionPrice = Number(variant.basePrice);
    if (!Number.isFinite(optionPrice) || !Number.isFinite(currentPrice)) return null;
    const delta = optionPrice - currentPrice;
    const deltaAbs = formatPrice(Math.abs(delta));
    const deltaText = `${delta >= 0 ? "+" : "-"}${deltaAbs}`;
    return (
      <div className="text-xs mt-0.5 opacity-75">
        ${formatPrice(optionPrice)} ({deltaText})
      </div>
    );
  };

  const buildOptions = (
    variantsList: VariantOption[],
    labelFor: (v: VariantOption) => string,
    keyFor: (v: VariantOption) => string,
    contextDimension: "size" | "material" | "frame" | "orientation" | "color"
  ) => {
    const groups = new Map<string, VariantOption[]>();
    for (const v of variantsList) {
      const k = keyFor(v);
      const arr = groups.get(k) || [];
      arr.push(v);
      groups.set(k, arr);
    }
    const options: { key: string; label: string; variant: VariantOption }[] = [];
    for (const [key, list] of groups.entries()) {
      const variant = pickVariantForOptionGroup(list, currentVariant, contextDimension);
      options.push({
        key,
        label: labelFor(variant),
        variant,
      });
    }
    return options;
  };

  const sizeOptions = buildOptions(variantRows, getSizeLabel, getSizeLabel, "size");
  const materialOptions = buildOptions(
    variantRows,
    getMaterialLabel,
    getMaterialLabel,
    "material"
  );
  const frameOptions = buildOptions(variantRows, getFrameLabel, getFrameLabel, "frame");
  const orientationOptions = buildOptions(
    variantRows,
    getOrientationLabel,
    getOrientationLabel,
    "orientation"
  )
    .filter((opt) => opt.label !== "Default");
  const colorOptions = buildOptions(
    variantRows.filter((v) => v.pfColorCode || v.pfColor),
    (v) => v.pfColor || "Color option",
    (v) => String(v.pfColorCode || v.pfColor || v.id),
    "color"
  );

  const handleVariantSelect = (variant: VariantOption) => {
    setHoverVariant(null);
    if (variant.id === currentVariant?.id) return;
    setHasUserSelectedOption(true);
    if (variant.slug === slug) {
      setSelectedVariantId(variant.id);
      return;
    }
    router.push(`/shop/${variant.slug}`);
  };
  const getOptionButtonClass = (isActive: boolean, inStock: boolean) =>
    `w-full min-h-[58px] text-left rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
      isActive
        ? "bg-brand-dark text-white border-brand-dark shadow-sm"
        : inStock
        ? "bg-white text-brand-darkest border-brand-light hover:border-brand-dark hover:shadow-sm"
        : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
    }`;
  const hoveredImage = hoverVariant?.heroImage || null;
  const hoverPreviewFirst =
    hoverCustomerFacingUrls && hoverCustomerFacingUrls.length > 0
      ? hoverCustomerFacingUrls[0]
      : null;
  const shouldUseHoverPreview =
    !!hoverVariant && hoverVariant.id !== currentVariant?.id;
  const mainImageSrc = shouldUseHoverPreview
    ? hoverPreviewFirst || hoveredImage || displayImages[activeImageIndex] || displayImages[0] || null
    : !hasUserSelectedOption && activeImageIndex === 0
    ? initialHeroPreview
    : displayImages[activeImageIndex] || displayImages[0] || initialHeroPreview || null;

  const handleStartCustomizing = () => {
    if (!canCustomize) return;
    const searchParams = new URLSearchParams({
      product_id: product.id,
      slug: product.slug,
      product_name: product.name,
    });
    if (product.requiresQrCode) {
      // Preserve intent across studio redirects/variant switches.
      searchParams.set("requires_qr", "1");
      searchParams.set("force_artkey", "1");
    }
    if (product.printfulProductId)
      searchParams.set("printful_id", String(product.printfulProductId));
    if (currentVariant?.printfulVariantId)
      searchParams.set("variant_id", String(currentVariant.printfulVariantId));

    router.push(`/studio?${searchParams}`);
  };

  const handleAddToCart = () => {
    const customerFacingCartImage =
      (hasUserSelectedOption
        ? displayImages[activeImageIndex] || displayImages[0] || initialHeroPreview
        : initialHeroPreview) ||
      undefined;
    addToCart({
      id: `${product.id}:${currentVariant?.printfulVariantId ?? "default"}`,
      name: product.name,
      price: Number(currentVariant?.basePrice ?? product.basePrice),
      quantity: 1,
      imageUrl: customerFacingCartImage,
      source: "shop",
      productSlug: product.slug,
      printfulProductId: product.printfulProductId ?? undefined,
      printfulVariantId: currentVariant?.printfulVariantId ?? product.printfulVariantId ?? undefined,
      requiresQrCode: !!product.requiresQrCode,
    });
    router.push("/cart");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-brand-light/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-brand-darkest/60">
            <Link href="/" className="hover:text-brand-dark transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              href="/shop"
              className="hover:text-brand-dark transition-colors"
            >
              Shop
            </Link>
            {product.category && (
              <>
                <span>/</span>
                <Link
                  href={`/shop?category=${product.category.slug}`}
                  className="hover:text-brand-dark transition-colors"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-brand-darkest font-medium">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Product Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="relative aspect-square bg-brand-light rounded-2xl shadow-md overflow-hidden mb-4 ring-1 ring-black/5">
              {mainImageSrc ? (
                <Image
                  key={mainImageSrc}
                  src={mainImageSrc}
                  alt={product.name}
                  fill
                  className="object-contain p-2 sm:p-3 md:p-4"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-light to-brand-medium">
                  <span className="text-8xl text-brand-darkest/20">
                    {product.category?.icon || "\uD83D\uDDBC\uFE0F"}
                  </span>
                </div>
              )}
              {product.requiresQrCode && (
                <div className="absolute top-4 right-4 bg-brand-dark text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                  Includes <ArtKeyTrademark /> Portal
                </div>
              )}
              {hoverVariant && hoverVariant.heroImage && (
                <div className="absolute top-4 left-4 bg-white/95 text-brand-dark text-[11px] px-2.5 py-1 rounded-full font-semibold border border-brand-light">
                  Previewing option
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {displayImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {displayImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === activeImageIndex
                        ? "border-brand-dark"
                        : "border-transparent hover:border-brand-light"
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`${product.name} view ${i + 1}`}
                      fill
                      className="object-contain p-1"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            {product.category && (
              <p className="text-sm font-semibold text-brand-medium uppercase tracking-wider mb-2">
                {product.category.icon} {product.category.name}
              </p>
            )}

            <h1 className="text-3xl md:text-4xl font-normal text-brand-darkest font-playfair mb-3">
              {product.name}
            </h1>

            <p className="text-3xl font-bold text-brand-dark mb-6">
              ${formatPrice(currentVariant?.basePrice ?? product.basePrice)}
            </p>

            {product.description && (
              <p className="text-brand-darkest/80 leading-relaxed mb-8">
                {product.description}
              </p>
            )}

            {/* Product Options (ported from older guided option layout) */}
            <div className="mb-8 space-y-4">
              {sizeOptions.length > 1 && (
                <AdminAccordionSection title="Size" defaultOpen>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {sizeOptions.map((opt) => (
                      <button
                        key={`size-${opt.key}`}
                        onClick={() => handleVariantSelect(opt.variant)}
                        onMouseEnter={() => setHoverVariant(opt.variant)}
                        onMouseLeave={() => setHoverVariant(null)}
                        onFocus={() => setHoverVariant(opt.variant)}
                        onBlur={() => setHoverVariant(null)}
                        disabled={!opt.variant.inStock || currentVariant?.id === opt.variant.id}
                        className={getOptionButtonClass(currentVariant?.id === opt.variant.id, !!opt.variant.inStock)}
                      >
                        <div>{opt.label}</div>
                        {renderOptionPrice(opt.variant)}
                      </button>
                    ))}
                  </div>
                </AdminAccordionSection>
              )}

              {materialOptions.length > 1 && (
                <AdminAccordionSection
                  title={isGreetingCard ? "Paper" : "Material"}
                  defaultOpen
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {materialOptions.map((opt) => (
                      <button
                        key={`material-${opt.key}`}
                        onClick={() => handleVariantSelect(opt.variant)}
                        onMouseEnter={() => setHoverVariant(opt.variant)}
                        onMouseLeave={() => setHoverVariant(null)}
                        onFocus={() => setHoverVariant(opt.variant)}
                        onBlur={() => setHoverVariant(null)}
                        disabled={!opt.variant.inStock || currentVariant?.id === opt.variant.id}
                        className={getOptionButtonClass(currentVariant?.id === opt.variant.id, !!opt.variant.inStock)}
                      >
                        <div>{opt.label}</div>
                        {renderOptionPrice(opt.variant)}
                      </button>
                    ))}
                  </div>
                </AdminAccordionSection>
              )}

              {frameOptions.length > 1 && (
                <AdminAccordionSection
                  title={isGreetingCard ? "Envelope" : "Frame / Finish"}
                  defaultOpen
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {frameOptions.map((opt) => (
                      <button
                        key={`frame-${opt.key}`}
                        onClick={() => handleVariantSelect(opt.variant)}
                        onMouseEnter={() => setHoverVariant(opt.variant)}
                        onMouseLeave={() => setHoverVariant(null)}
                        onFocus={() => setHoverVariant(opt.variant)}
                        onBlur={() => setHoverVariant(null)}
                        disabled={!opt.variant.inStock || currentVariant?.id === opt.variant.id}
                        className={getOptionButtonClass(currentVariant?.id === opt.variant.id, !!opt.variant.inStock)}
                      >
                        <div>{opt.label}</div>
                        {renderOptionPrice(opt.variant)}
                      </button>
                    ))}
                  </div>
                </AdminAccordionSection>
              )}

              {canCustomize && !isGreetingCard && orientationOptions.length > 1 && (
                <AdminAccordionSection title="Orientation" defaultOpen>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {orientationOptions.map((opt) => (
                      <button
                        key={`orientation-${opt.key}`}
                        onClick={() => handleVariantSelect(opt.variant)}
                        onMouseEnter={() => setHoverVariant(opt.variant)}
                        onMouseLeave={() => setHoverVariant(null)}
                        onFocus={() => setHoverVariant(opt.variant)}
                        onBlur={() => setHoverVariant(null)}
                        disabled={!opt.variant.inStock || currentVariant?.id === opt.variant.id}
                        className={getOptionButtonClass(currentVariant?.id === opt.variant.id, !!opt.variant.inStock)}
                      >
                        <div>{opt.label}</div>
                        {renderOptionPrice(opt.variant)}
                      </button>
                    ))}
                  </div>
                </AdminAccordionSection>
              )}

              {!isGreetingCard && colorOptions.length > 1 && (
                <AdminAccordionSection title="Frame Color" defaultOpen>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {colorOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => handleVariantSelect(opt.variant)}
                        onMouseEnter={() => setHoverVariant(opt.variant)}
                        onMouseLeave={() => setHoverVariant(null)}
                        onFocus={() => setHoverVariant(opt.variant)}
                        onBlur={() => setHoverVariant(null)}
                        disabled={!opt.variant.inStock || currentVariant?.id === opt.variant.id}
                        className={getOptionButtonClass(
                          currentVariant?.id === opt.variant.id,
                          !!opt.variant.inStock
                        )}
                        title={opt.variant.pfColor || ""}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-4 h-4 rounded-sm border border-black/15"
                            style={{ backgroundColor: opt.variant.pfColorCode || "#ccc" }}
                          />
                          <span>{opt.variant.pfColor || "Color option"}</span>
                        </div>
                        {renderOptionPrice(opt.variant)}
                      </button>
                    ))}
                  </div>
                </AdminAccordionSection>
              )}
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {product.sizeLabel && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-brand-darkest/50 uppercase tracking-wide mb-1">
                    Size
                  </p>
                  <p className="font-semibold text-brand-darkest">
                    {product.sizeLabel}
                  </p>
                </div>
              )}
              {product.paperType && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-brand-darkest/50 uppercase tracking-wide mb-1">
                    Paper
                  </p>
                  <p className="font-semibold text-brand-darkest">
                    {product.paperType}
                  </p>
                </div>
              )}
              {product.finishType && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-brand-darkest/50 uppercase tracking-wide mb-1">
                    {isGreetingCard ? "Envelope" : "Finish"}
                  </p>
                  <p className="font-semibold text-brand-darkest">
                    {product.finishType}
                  </p>
                </div>
              )}
            </div>

            {/* ArtKey Feature Callout */}
            {product.requiresQrCode && (
              <div className="bg-gradient-to-r from-brand-light/50 to-brand-medium/20 border border-brand-medium/30 rounded-xl p-6 mb-8">
                <h3 className="font-normal text-brand-darkest mb-2">
                  Includes <ArtKeyTrademark /> Portal
                </h3>
                <p className="text-sm text-brand-darkest/70 leading-relaxed">
                  {renderStringWithArtKeyTrademarks(
                    "Your product will include a unique QR code linked to a personal ArtKey portal. Share images, videos, links, a guestbook, and more with anyone who scans it."
                  )}
                </p>
              </div>
            )}

            {canCustomize ? (
              <>
                {/* CTA */}
                <button
                  onClick={handleStartCustomizing}
                  className="w-full bg-brand-dark text-white py-4 rounded-full text-lg font-semibold hover:bg-brand-darkest transition-colors shadow-lg hover:shadow-xl"
                >
                  Start Customizing
                </button>

                <p className="text-center text-xs text-brand-darkest/40 mt-3">
                  {product.requiresQrCode ? (
                    <>
                      {renderStringWithArtKeyTrademarks(
                        "You'll upload your image and design your ArtKey portal in the next step."
                      )}
                    </>
                  ) : (
                    <>
                      You&apos;ll upload your image and finish customizing in the next
                      step.
                    </>
                  )}
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-brand-dark text-white py-4 rounded-full text-lg font-semibold hover:bg-brand-darkest transition-colors shadow-lg hover:shadow-xl"
                >
                  Add to Cart
                </button>

                <p className="text-center text-xs text-brand-darkest/40 mt-3">
                  This product is ready to add to cart without customization.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
