"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import cocreatorsData from "@/content/cocreators.json";

interface CoCreator {
  name: string;
  title: string;
  image: string;
  mountainImage?: string;
  heroImage?: string;
  bio: string;
  description?: string;
  slug: string;
  thumbnailImage?: string;
}

interface CollaborationProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  heroImage: string | null;
  basePrice: number;
  hasMultipleVariants?: boolean;
  variantCount?: number;
  categoryName: string;
  categoryIcon: string;
  requiresQrCode: boolean;
}

function firstNonEmpty(...candidates: Array<string | undefined | null>): string {
  for (const c of candidates) {
    if (c != null && String(c).trim() !== "") return String(c).trim();
  }
  return "";
}

function firstNonEmptyOptional(
  ...candidates: Array<string | undefined | null>
): string | undefined {
  const s = firstNonEmpty(...candidates);
  return s || undefined;
}

export default function CoCreatorDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const staticCreators = cocreatorsData.cocreators as CoCreator[];
  const staticMatch = staticCreators.find((c) => c.slug === slug);

  const [creator, setCreator] = useState<CoCreator | null>(staticMatch || null);
  /** `undefined` = cocreators API not finished; `null` = no DB row for slug; `string` = CoCreator.id */
  const [coCreatorDbId, setCoCreatorDbId] = useState<string | null | undefined>(undefined);
  const [collabProducts, setCollabProducts] = useState<CollaborationProduct[]>([]);
  const [collabLoading, setCollabLoading] = useState(false);

  useEffect(() => {
    setCoCreatorDbId(undefined);
    const s = staticCreators.find((c) => c.slug === slug);
    fetch("/api/cocreators")
      .then((r) => r.json())
      .then((res) => {
        if (res.source === "db" && res.data.length > 0) {
          const dbMatch = res.data.find((c: any) => c.slug === slug);
          if (dbMatch) {
            setCoCreatorDbId(typeof dbMatch.id === "string" && dbMatch.id.trim() ? dbMatch.id.trim() : null);
            setCreator({
              name: firstNonEmpty(dbMatch.name, s?.name),
              title: firstNonEmpty(dbMatch.title, s?.title),
              image: firstNonEmpty(
                dbMatch.thumbnailImage,
                dbMatch.heroImage,
                s?.image
              ),
              mountainImage: firstNonEmptyOptional(
                dbMatch.mountainImage,
                dbMatch.heroImage,
                s?.mountainImage,
                s?.heroImage
              ),
              heroImage: firstNonEmptyOptional(dbMatch.heroImage, s?.heroImage),
              bio: firstNonEmpty(dbMatch.bio, s?.bio),
              description: firstNonEmpty(dbMatch.description, s?.description ?? ""),
              slug: firstNonEmpty(dbMatch.slug, s?.slug, slug),
              thumbnailImage: firstNonEmptyOptional(
                dbMatch.thumbnailImage,
                s?.thumbnailImage
              ),
            });
          } else {
            setCoCreatorDbId(null);
          }
        } else {
          setCoCreatorDbId(null);
        }
      })
      .catch(() => {
        setCoCreatorDbId(null);
      });
  }, [slug]);

  useEffect(() => {
    if (coCreatorDbId === undefined || coCreatorDbId === null) {
      setCollabProducts([]);
      setCollabLoading(false);
      return;
    }
    const params = new URLSearchParams({
      coCreatorId: coCreatorDbId,
      coCreatorSlug: slug,
      group: "false",
      limit: "50",
    });
    setCollabLoading(true);
    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) {
          setCollabProducts(data.data as CollaborationProduct[]);
        } else {
          setCollabProducts([]);
        }
      })
      .catch(() => setCollabProducts([]))
      .finally(() => setCollabLoading(false));
  }, [coCreatorDbId, slug]);

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-normal text-brand-darkest mb-4">
            CoCreator Not Found
          </h1>
          <p className="text-brand-darkest/60 mb-6">
            We couldn&apos;t find the creator you&apos;re looking for.
          </p>
          <Link
            href="/cocreators"
            className="bg-brand-dark text-white px-6 py-3 rounded-full font-semibold hover:bg-brand-darkest transition-colors"
          >
            Back to CoCreators
          </Link>
        </div>
      </div>
    );
  }

  const bioLines = creator.bio
    .split("\n\n")
    .filter((part) => {
      const trimmed = part.trim();
      return trimmed && trimmed !== creator.name.trim();
    });

  const descLines = (creator.description || "")
    .split("\n\n")
    .filter((part) => {
      const trimmed = part.trim();
      return trimmed && !trimmed.startsWith("Learn More");
    });

  const heroImg = creator.mountainImage || creator.heroImage;
  const hideSecondImage =
    slug === "kimber-cross" || slug === "lance-jones";

  const formatPrice = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-brand-light/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-brand-darkest/60">
            <Link href="/" className="hover:text-brand-dark transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              href="/cocreators"
              className="hover:text-brand-dark transition-colors"
            >
              CoCreators
            </Link>
            <span>/</span>
            <span className="text-brand-darkest font-medium">
              {creator.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-brand-light to-brand-medium">
              {creator.image && (
                <Image
                  src={creator.image}
                  alt={creator.name}
                  fill
                  className="object-contain"
                  style={{
                    objectPosition:
                      slug === "lance-jones" ? "center 58%" : "top center",
                  }}
                  unoptimized
                />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-medium uppercase tracking-wider mb-3">
                {creator.title}
              </p>
              <h1 className="text-4xl md:text-5xl font-normal text-brand-darkest font-playfair mb-6">
                {creator.name}
              </h1>
              <div className="space-y-4">
                {bioLines.map((line, idx) => (
                  <p
                    key={idx}
                    className="text-lg text-brand-darkest/80 leading-relaxed"
                  >
                    {line}
                  </p>
                ))}
                {descLines.map((line, idx) => (
                  <p
                    key={`desc-${idx}`}
                    className="text-lg text-brand-darkest/80 leading-relaxed"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {heroImg && !hideSecondImage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={heroImg}
              alt={`${creator.name} in action`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-normal text-brand-darkest font-playfair mb-2">
          Collaborations
        </h2>
        <p className="text-brand-darkest/60 mb-10">
          Products and experiences created with {creator.name.split(" ")[0]}.
        </p>
        {coCreatorDbId === undefined ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-brand-dark" />
            <p className="mt-4 text-brand-darkest/50 text-sm">Loading collaborations…</p>
          </div>
        ) : coCreatorDbId === null ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <p className="text-brand-darkest/60 text-lg">
              Collaboration products are available when this co-creator is synced from the site directory.
            </p>
          </div>
        ) : collabLoading ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-brand-dark" />
            <p className="mt-4 text-brand-darkest/50 text-sm">Loading products…</p>
          </div>
        ) : collabProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <p className="text-brand-darkest/60 text-lg">
              No collaboration products are linked yet. Check back soon or browse the shop.
            </p>
            <Link
              href="/shop"
              className="inline-block mt-6 text-sm font-semibold text-brand-dark hover:text-brand-darkest"
            >
              Browse shop →
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {collabProducts.map((product) => (
              <Link
                key={product.id}
                href={`/shop/${product.slug}`}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 group"
              >
                <div className="relative h-56 bg-gradient-to-br from-brand-light to-brand-medium overflow-hidden">
                  {product.heroImage ? (
                    <Image
                      src={product.heroImage}
                      alt={product.name}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl text-brand-darkest/20">
                        {product.categoryIcon || "🖼️"}
                      </span>
                    </div>
                  )}
                  {product.requiresQrCode && (
                    <span className="absolute top-3 right-3 bg-brand-dark/80 text-white text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-wide">
                      ArtKey
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-[11px] font-semibold text-brand-medium uppercase tracking-wider mb-1">
                    {product.categoryName}
                  </p>
                  <h3 className="text-lg font-normal text-brand-darkest mb-1 line-clamp-1 group-hover:text-brand-dark transition-colors">
                    {product.name}
                  </h3>
                  {product.hasMultipleVariants && product.variantCount ? (
                    <p className="text-xs text-brand-darkest/50 mb-2">
                      {product.variantCount} options available
                    </p>
                  ) : null}
                  <p className="text-sm text-brand-darkest/70 line-clamp-2 mb-4">
                    {product.description || "Premium quality customizable product."}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-brand-dark">
                      ${formatPrice(product.basePrice)}
                    </span>
                    <span className="text-sm font-semibold text-brand-medium group-hover:text-brand-dark transition-colors">
                      View &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 text-center">
        <Link
          href="/cocreators"
          className="inline-block border-2 border-brand-dark text-brand-dark px-8 py-3 rounded-full font-semibold hover:bg-brand-dark hover:text-white transition-all"
        >
          Back to CoCreators
        </Link>
      </div>
    </div>
  );
}
