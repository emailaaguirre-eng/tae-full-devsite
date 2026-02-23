"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

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
  requiredPlacements: string | null;
  category: {
    id: string;
    slug: string;
    name: string;
    icon: string;
    description: string | null;
  } | null;
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
  printfulVariantId: number | null;
  isCurrent: boolean;
  pfColor: string | null;
  pfColorCode: string | null;
  pfSize: string | null;
  pfName: string | null;
  inStock: boolean;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

  const allImages = [
    ...(product.heroImage ? [product.heroImage] : []),
    ...(product.galleryImages || []).filter(
      (url) => url !== product.heroImage
    ),
  ];

  const handleVariantSelect = (variant: VariantOption) => {
    if (variant.isCurrent) return;
    router.push(`/shop/${variant.slug}`);
  };

  const handleStartCustomizing = () => {
    const searchParams = new URLSearchParams({
      product_id: product.id,
      slug: product.slug,
      product_name: product.name,
    });
    if (product.printfulProductId)
      searchParams.set("printful_id", String(product.printfulProductId));
    if (product.printfulVariantId)
      searchParams.set("variant_id", String(product.printfulVariantId));

    router.push(`/studio?${searchParams}`);
  };

  const sizeVariants = variants.filter(
    (v) => v.sizeLabel || v.pfSize
  );

  const colorVariants = variants.filter(
    (v) => v.pfColor && v.pfColorCode
  );

  const uniqueColors = [
    ...new Map(
      colorVariants.map((v) => [v.pfColorCode, v])
    ).values(),
  ];

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
              {allImages.length > 0 ? (
                <Image
                  src={allImages[activeImageIndex] || allImages[0]}
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
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((url, i) => (
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
              ${product.basePrice.toFixed(2)}
            </p>

            {product.description && (
              <p className="text-brand-darkest/80 leading-relaxed mb-8">
                {product.description}
              </p>
            )}

            {/* Variant Selectors */}
            {sizeVariants.length > 1 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-brand-darkest mb-3 uppercase tracking-wide">
                  Size
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sizeVariants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleVariantSelect(v)}
                      disabled={!v.inStock}
                      className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        v.isCurrent
                          ? "bg-brand-dark text-white border-brand-dark"
                          : v.inStock
                          ? "bg-white text-brand-darkest border-brand-light hover:border-brand-dark"
                          : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      }`}
                    >
                      {v.sizeLabel || v.pfSize || v.name}
                      {v.basePrice !== product.basePrice && v.inStock && (
                        <span className="block text-xs mt-0.5 opacity-70">
                          ${v.basePrice.toFixed(2)}
                        </span>
                      )}
                      {!v.inStock && (
                        <span className="block text-xs mt-0.5">Out of stock</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color variants (if product has frame colors, etc.) */}
            {uniqueColors.length > 1 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-brand-darkest mb-3 uppercase tracking-wide">
                  Color
                </h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleVariantSelect(v)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        v.isCurrent
                          ? "border-brand-dark ring-2 ring-brand-dark ring-offset-2"
                          : "border-brand-light hover:border-brand-dark"
                      }`}
                      style={{ backgroundColor: v.pfColorCode || "#ccc" }}
                      title={v.pfColor || ""}
                    />
                  ))}
                </div>
              </div>
            )}

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
          </div>
        </div>
      </div>
    </div>
  );
}
