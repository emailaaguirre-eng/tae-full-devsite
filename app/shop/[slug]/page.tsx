"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

interface ProductDetail {
  id: string;
  slug: string;
  name: string;
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
};

function toVariantIdCandidates(row: VariantImageMeta): number[] {
  const ids = [row?.id, row?.printfulVariantId]
    .map((value) => Math.trunc(Number(value)))
    .filter((n) => Number.isFinite(n) && n > 0);
  return [...new Set(ids)];
}

function isActiveRow(row: VariantImageMeta): boolean {
  return row?.active !== false;
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
    setSelectedVariantId(variantRows.find((v) => v.isCurrent)?.id || variantRows[0]?.id || null);
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

  const parsedImageMeta = useMemo(() => {
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
        variantImages: Array.isArray(parsed?.variantImages)
          ? (parsed.variantImages as VariantImageMeta[])
          : [],
        siblingVariants: Array.isArray(parsed?.siblingVariants)
          ? (parsed.siblingVariants as VariantImageMeta[])
          : [],
      };
    } catch {
      return { variantMatrix: [], variantImages: [], siblingVariants: [] };
    }
  }, [product?.printfulDataJson]);

  const selectedPrintfulVariantId = useMemo(() => {
    const n = Number(currentVariant?.printfulVariantId);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
  }, [currentVariant?.printfulVariantId]);

  const exactVariantImages = useMemo(() => {
    if (!selectedPrintfulVariantId) return [];
    const urls: string[] = [];
    const push = (url?: string | null) => {
      if (!url || urls.includes(url)) return;
      urls.push(url);
    };

    for (const row of parsedImageMeta.variantMatrix) {
      if (!isActiveRow(row)) continue;
      if (toVariantIdCandidates(row).includes(selectedPrintfulVariantId)) {
        push(row?.image);
      }
    }
    for (const row of parsedImageMeta.variantImages) {
      if (!isActiveRow(row)) continue;
      if (toVariantIdCandidates(row).includes(selectedPrintfulVariantId)) {
        push(row?.image);
      }
    }
    for (const row of parsedImageMeta.siblingVariants) {
      if (!isActiveRow(row)) continue;
      if (toVariantIdCandidates(row).includes(selectedPrintfulVariantId)) {
        push(row?.image);
      }
    }
    return urls;
  }, [parsedImageMeta, selectedPrintfulVariantId]);

  const formatSpecificImages = useMemo(() => {
    const selectedSize = normalizeValue(currentVariant?.sizeLabel || currentVariant?.pfSize);
    const selectedMaterial = normalizeValue(currentVariant?.paperType);
    const selectedFrame = normalizeValue(currentVariant?.finishType);
    const selectedColor = normalizeValue(currentVariant?.pfColor);
    const urls: string[] = [];
    const push = (url?: string | null) => {
      if (!url || urls.includes(url)) return;
      urls.push(url);
    };

    for (const row of parsedImageMeta.variantMatrix) {
      if (row?.active === false || !row?.image) continue;
      const rowSize = normalizeValue(row?.size);
      const rowMaterial = normalizeValue(row?.paperType || row?.material);
      const rowFrame = normalizeValue(row?.frame);
      const rowColor = normalizeValue(row?.frameColor || row?.color);

      const matchesSize = !selectedSize || !rowSize || rowSize === selectedSize;
      const matchesMaterial = !selectedMaterial || !rowMaterial || rowMaterial === selectedMaterial;
      const matchesFrame = !selectedFrame || !rowFrame || rowFrame === selectedFrame;
      const matchesColor = !selectedColor || !rowColor || rowColor === selectedColor;

      if (matchesSize && matchesMaterial && matchesFrame && matchesColor) {
        push(row.image);
      }
    }

    return urls;
  }, [
    currentVariant?.finishType,
    currentVariant?.paperType,
    currentVariant?.pfColor,
    currentVariant?.pfSize,
    currentVariant?.sizeLabel,
    parsedImageMeta.variantMatrix,
  ]);

  const displayImages = useMemo(() => {
    if (!product) return [];
    if (exactVariantImages.length > 0) return exactVariantImages;
    if (formatSpecificImages.length > 0) return formatSpecificImages;
    const fallback = [
      ...(product.heroImage ? [product.heroImage] : []),
      ...(product.galleryImages || []).filter((url) => !!url && url !== product.heroImage),
    ];
    return [...new Set(fallback)];
  }, [exactVariantImages, formatSpecificImages, product]);

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
          <h1 className="text-3xl font-bold text-brand-darkest mb-4">
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
    keyFor: (v: VariantOption) => string
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
      const scored = [...list].sort((a, b) => {
        const score = (x: VariantOption) => {
          let s = x.inStock ? 10 : 0;
          if (currentVariant) {
            if (getSizeLabel(x) === getSizeLabel(currentVariant)) s += 2;
            if (getMaterialLabel(x) === getMaterialLabel(currentVariant)) s += 2;
            if (getFrameLabel(x) === getFrameLabel(currentVariant)) s += 2;
            if (getOrientationLabel(x) === getOrientationLabel(currentVariant)) s += 1;
          }
          return s;
        };
        return score(b) - score(a);
      });
      options.push({
        key,
        label: labelFor(scored[0]),
        variant: scored[0],
      });
    }
    return options;
  };

  const sizeOptions = buildOptions(variantRows, getSizeLabel, getSizeLabel);
  const materialOptions = buildOptions(variantRows, getMaterialLabel, getMaterialLabel);
  const frameOptions = buildOptions(variantRows, getFrameLabel, getFrameLabel);
  const orientationOptions = buildOptions(variantRows, getOrientationLabel, getOrientationLabel);
  const colorOptions = [
    ...new Map(
      variantRows
        .filter((v) => v.pfColorCode || v.pfColor)
        .map((v) => [v.pfColorCode || v.pfColor || v.id, v])
    ).values(),
  ];

  const handleVariantSelect = (variant: VariantOption) => {
    setHoverVariant(null);
    if (variant.id === currentVariant?.id) return;
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
  const mainImageSrc =
    hoveredImage ||
    displayImages[activeImageIndex] ||
    displayImages[0] ||
    null;

  const handleStartCustomizing = () => {
    if (product.customizable === false) return;
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
    addToCart({
      id: `${product.id}:${currentVariant?.printfulVariantId ?? "default"}`,
      name: product.name,
      price: Number(currentVariant?.basePrice ?? product.basePrice),
      quantity: 1,
      imageUrl: currentVariant?.heroImage || product.heroImage || undefined,
      source: "shop",
      productSlug: product.slug,
      printfulProductId: product.printfulProductId ?? undefined,
      printfulVariantId: currentVariant?.printfulVariantId ?? product.printfulVariantId ?? undefined,
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
            <div className="relative aspect-square bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
              {mainImageSrc ? (
                <Image
                  src={mainImageSrc}
                  alt={product.name}
                  fill
                  className="object-contain p-8"
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
                  Includes ArtKey Portal
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

            <h1 className="text-3xl md:text-4xl font-bold text-brand-darkest font-playfair mb-3">
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
            <div className="mb-8 space-y-6">
              {sizeOptions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-brand-darkest mb-3 uppercase tracking-wide">
                    Size
                  </h3>
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
                </div>
              )}

              {materialOptions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-brand-darkest mb-3 uppercase tracking-wide">
                    Material
                  </h3>
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
                </div>
              )}

              {frameOptions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-brand-darkest mb-3 uppercase tracking-wide">
                    Frame / Finish
                  </h3>
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
                </div>
              )}

              {orientationOptions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-brand-darkest mb-3 uppercase tracking-wide">
                    Orientation
                  </h3>
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
                </div>
              )}

              {colorOptions.length > 1 && (
                <div>
                  <h3 className="text-sm font-semibold text-brand-darkest mb-3 uppercase tracking-wide">
                    Frame Color
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {colorOptions.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => handleVariantSelect(v)}
                        onMouseEnter={() => setHoverVariant(v)}
                        onMouseLeave={() => setHoverVariant(null)}
                        onFocus={() => setHoverVariant(v)}
                        onBlur={() => setHoverVariant(null)}
                        disabled={!v.inStock || currentVariant?.id === v.id}
                        className={getOptionButtonClass(currentVariant?.id === v.id, !!v.inStock)}
                        title={v.pfColor || ""}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-4 h-4 rounded-sm border border-black/15"
                            style={{ backgroundColor: v.pfColorCode || "#ccc" }}
                          />
                          <span>{v.pfColor || "Color option"}</span>
                        </div>
                        {renderOptionPrice(v)}
                      </button>
                    ))}
                  </div>
                </div>
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
                    Finish
                  </p>
                  <p className="font-semibold text-brand-darkest">
                    {product.finishType}
                  </p>
                </div>
              )}
              {product.orientation && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-brand-darkest/50 uppercase tracking-wide mb-1">
                    Orientation
                  </p>
                  <p className="font-semibold text-brand-darkest capitalize">
                    {product.orientation}
                  </p>
                </div>
              )}
              {product.printDpi && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-brand-darkest/50 uppercase tracking-wide mb-1">
                    Print Quality
                  </p>
                  <p className="font-semibold text-brand-darkest">
                    {product.printDpi} DPI
                  </p>
                </div>
              )}
            </div>

            {/* ArtKey Feature Callout */}
            {product.requiresQrCode && (
              <div className="bg-gradient-to-r from-brand-light/50 to-brand-medium/20 border border-brand-medium/30 rounded-xl p-6 mb-8">
                <h3 className="font-bold text-brand-darkest mb-2">
                  Includes ArtKey Portal
                </h3>
                <p className="text-sm text-brand-darkest/70 leading-relaxed">
                  Your product will include a unique QR code linked to a
                  personal ArtKey portal. Share images, videos, links, a
                  guestbook, and more with anyone who scans it.
                </p>
              </div>
            )}

            {product.customizable !== false ? (
              <>
                {/* CTA */}
                <button
                  onClick={handleStartCustomizing}
                  className="w-full bg-brand-dark text-white py-4 rounded-full text-lg font-semibold hover:bg-brand-darkest transition-colors shadow-lg hover:shadow-xl"
                >
                  Start Customizing
                </button>

                <p className="text-center text-xs text-brand-darkest/40 mt-3">
                  You&apos;ll upload your image and design your ArtKey portal in the
                  next step.
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
