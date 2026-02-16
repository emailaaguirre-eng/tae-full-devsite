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
  category: {
    id: string;
    slug: string;
    name: string;
    icon: string;
    description: string | null;
  } | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          {/* Product Image */}
          <div className="relative aspect-square bg-white rounded-2xl shadow-lg overflow-hidden">
            {product.heroImage ? (
              <Image
                src={product.heroImage}
                alt={product.name}
                fill
                className="object-contain p-8"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-light to-brand-medium">
                <span className="text-8xl text-brand-darkest/20">
                  {product.category?.icon || "🖼️"}
                </span>
              </div>
            )}
            {product.requiresQrCode && (
              <div className="absolute top-4 right-4 bg-brand-dark text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                Includes ArtKey Portal
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
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-brand-darkest/50 uppercase tracking-wide mb-1">
                  Fulfilled By
                </p>
                <p className="font-semibold text-brand-darkest capitalize">
                  {product.printProvider}
                </p>
              </div>
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
